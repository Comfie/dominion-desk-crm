import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from './app-error';
import { logger } from '@/lib/shared/logger';

/**
 * Standard API error response format
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Global error handler for API routes
 * Converts all errors to consistent JSON responses
 *
 * @param error - The error to handle
 * @returns NextResponse with appropriate status code and error format
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   try {
 *     // Your logic here
 *   } catch (error) {
 *     return handleApiError(error);
 *   }
 * }
 * ```
 */
export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  // Auth helpers (requireAuth, requireCustomer, ...) throw a ready-made
  // NextResponse (401/403). Return it as-is instead of turning it into a 500.
  if (error instanceof NextResponse) {
    return error as NextResponse<ErrorResponse>;
  }

  // Known application errors
  if (error instanceof AppError) {
    logger.warn(`Application error: ${error.message}`, {
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  // Zod validation errors
  if (error instanceof z.ZodError) {
    logger.warn('Validation error', {
      code: 'VALIDATION_ERROR',
      issues: error.issues,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
      },
      { status: 400 }
    );
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error('Database error', {
      code: error.code,
      meta: error.meta,
      clientVersion: error.clientVersion,
    });

    // Unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'A record with this value already exists',
            details: error.meta,
          },
        },
        { status: 409 }
      );
    }

    // Foreign key constraint violation
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REFERENCE',
            message: 'Referenced record does not exist',
            details: error.meta,
          },
        },
        { status: 400 }
      );
    }

    // Record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Record not found',
            details: error.meta,
          },
        },
        { status: 404 }
      );
    }

    // Generic Prisma error
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'A database error occurred',
          details:
            process.env.NODE_ENV === 'development'
              ? { code: error.code, meta: error.meta }
              : undefined,
        },
      },
      { status: 500 }
    );
  }

  // Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    logger.error('Database validation error', { errorMessage: error.message });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_VALIDATION_ERROR',
          message: 'Invalid database operation',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
      },
      { status: 400 }
    );
  }

  // Unexpected errors
  logger.error('Unexpected error', {
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
  });

  // In production, don't expose internal error details
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: isDevelopment ? errorMessage : 'An unexpected error occurred',
        details: isDevelopment && error instanceof Error ? error.stack : undefined,
      },
    },
    { status: 500 }
  );
}

/**
 * Helper to throw NextResponse errors (for middleware that throws)
 * This is needed because auth helpers throw NextResponse objects
 */
export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

/**
 * Wrapper for API route handlers that automatically catches errors
 *
 * @example
 * ```typescript
 * export const POST = withErrorHandler(async (request: Request) => {
 *   const session = await requireAuth();
 *   const data = await bookingService.create(session.user.id, requestData);
 *   return NextResponse.json({ success: true, data });
 * });
 * ```
 */
export function withErrorHandler(
  handler: (request: Request, context?: unknown) => Promise<NextResponse>
) {
  return async (request: Request, context?: unknown): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      // If it's already a NextResponse (thrown by auth helpers), return it
      if (isNextResponse(error)) {
        return error;
      }
      return handleApiError(error);
    }
  };
}
