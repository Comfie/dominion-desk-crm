import { NextResponse } from 'next/server';
import { z } from 'zod';
import { teamMemberService, acceptInviteSchema } from '@/lib/features/team';
import { ValidationError, NotFoundError } from '@/lib/shared/errors/app-error';

/**
 * POST /api/team-members/accept - Accept team member invitation (public endpoint)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = acceptInviteSchema.parse(body);

    const teamMember = await teamMemberService.acceptInvite(token);

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      teamMember: {
        id: teamMember.id,
        email: teamMember.email,
        firstName: teamMember.firstName,
        lastName: teamMember.lastName,
        role: teamMember.role,
      },
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}

/**
 * PUT /api/team-members/accept - Decline team member invitation (public endpoint)
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { token } = acceptInviteSchema.parse(body);

    await teamMemberService.declineInvite(token);

    return NextResponse.json({
      message: 'Invitation declined successfully',
    });
  } catch (error) {
    console.error('Error declining invitation:', error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to decline invitation' }, { status: 500 });
  }
}
