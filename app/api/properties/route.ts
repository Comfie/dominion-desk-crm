import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { propertyService, createPropertySchema } from '@/lib/features/properties';
import { ValidationError, ForbiddenError } from '@/lib/shared/errors/app-error';

// Query params schema for list endpoint
const listQuerySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
  occupied: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * GET /api/properties - List all properties for the user
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = listQuerySchema.parse({
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      search: searchParams.get('search') || undefined,
      occupied: searchParams.get('occupied') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    // Parse comma-separated filters
    const statusFilter = params.status?.split(',').filter(Boolean);
    const typeFilter = params.type?.split(',').filter(Boolean);

    let result = await propertyService.list(session.user.id, {
      status: statusFilter?.[0] as any, // Service handles single status
      rentalType: typeFilter?.[0] as any,
      search: params.search,
    });

    if (params.occupied) {
      result = result.filter((property) => property.hasActiveTenant);
    }

    // Apply pagination (service returns all, we paginate here)
    const start = (params.page - 1) * params.limit;
    const paginatedData = result.slice(start, start + params.limit);

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: result.length,
        totalPages: Math.ceil(result.length / params.limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

/**
 * POST /api/properties - Create a new property
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPropertySchema.parse(body);

    const property = await propertyService.create(session.user.id, validatedData);

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error creating property:', error);
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}
