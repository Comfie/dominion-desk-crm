import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { propertyService } from '@/lib/features/properties';

const exportQuerySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
  occupied: z.coerce.boolean().optional(),
});

/**
 * GET /api/properties/export
 * Returns all properties matching the current filters for spreadsheet export.
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = exportQuerySchema.parse({
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      search: searchParams.get('search') || undefined,
      occupied: searchParams.get('occupied') || undefined,
    });

    const statusFilter = params.status?.split(',').filter(Boolean);
    const typeFilter = params.type?.split(',').filter(Boolean);

    let properties = await propertyService.list(session.user.id, {
      status: statusFilter?.[0] as any,
      rentalType: typeFilter?.[0] as any,
      search: params.search,
    });

    if (params.occupied) {
      properties = properties.filter((property) => property.hasActiveTenant);
    }

    return NextResponse.json({
      count: properties.length,
      properties,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error exporting properties:', error);
    return NextResponse.json({ error: 'Failed to export properties' }, { status: 500 });
  }
}
