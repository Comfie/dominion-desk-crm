import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { maintenanceService } from '@/lib/features/maintenance/services/maintenance.service';

/**
 * POST /api/maintenance/[id]/create-task
 * Create a task from a maintenance request
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const task = await maintenanceService.createTaskFromMaintenance(id, session.user.id);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('permission')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    console.error('Error creating task from maintenance:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
