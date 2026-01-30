import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { tenantService, createTenantSchema, listTenantsSchema } from '@/lib/features/tenants';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/shared/errors/app-error';

/**
 * GET /api/tenants - List tenants with pagination and filtering
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = listTenantsSchema.parse({
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    const result = await tenantService.list(session.user.id, params);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 });
  }
}

/**
 * POST /api/tenants - Create a new tenant
 * Supports optional portal access creation and property assignment
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTenantSchema.parse(body);

    const { tenant, generatedPassword } = await tenantService.createTenant(
      session.user.id,
      validatedData
    );

    // Return tenant with generated password if portal access was created
    // Frontend can display this to user for reference
    return NextResponse.json(
      {
        ...tenant,
        ...(generatedPassword && { generatedPassword }),
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle validation errors from service
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 });
  }
}
