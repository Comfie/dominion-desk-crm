import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  teamMemberService,
  inviteTeamMemberSchema,
  listTeamMembersSchema,
} from '@/lib/features/team';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/shared/errors/app-error';

/**
 * GET /api/team-members - List team members with optional filtering
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only CUSTOMER (landlords) can manage team members
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Only landlords can manage team members' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = listTeamMembersSchema.parse({
      status: searchParams.get('status') || undefined,
      role: searchParams.get('role') || undefined,
    });

    const teamMembers = await teamMemberService.getAll(session.user.id, params);

    return NextResponse.json({
      teamMembers,
      count: teamMembers.length,
    });
  } catch (error) {
    console.error('Error fetching team members:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}

/**
 * POST /api/team-members - Invite a new team member
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only CUSTOMER (landlords) can invite team members
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Only landlords can invite team members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = inviteTeamMemberSchema.parse(body);

    const teamMember = await teamMemberService.invite(session.user.id, validatedData);

    return NextResponse.json(teamMember, { status: 201 });
  } catch (error) {
    console.error('Error inviting team member:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to invite team member' }, { status: 500 });
  }
}
