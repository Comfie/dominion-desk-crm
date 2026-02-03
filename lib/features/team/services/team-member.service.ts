import crypto from 'crypto';
import { teamMemberRepository } from '../repositories/team-member.repository';
import {
  InviteTeamMemberDto,
  UpdateTeamMemberDto,
  ListTeamMembersDto,
} from '../dtos/team-member.dto';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/shared/errors/app-error';
import { sendEmail, emailTemplates } from '@/lib/email';
import { logger } from '@/lib/shared/logger';

const INVITATION_EXPIRY_DAYS = 7;

/**
 * Team Member Service
 * Business logic for team member management and invitations
 */
export class TeamMemberService {
  /**
   * Invite a new team member
   */
  async invite(userId: string, data: InviteTeamMemberDto) {
    // Check if team member with this email already exists for this user
    const existing = await teamMemberRepository.findByEmail(data.email, userId);

    if (existing) {
      // If invitation is expired or declined, allow re-invitation
      if (existing.status === 'EXPIRED' || existing.status === 'DECLINED') {
        // Update existing invitation
        await teamMemberRepository.update(existing.id, userId, {
          ...data,
          status: 'PENDING',
        });

        // Send invitation email
        await this.sendInvitationEmail(existing.id, data.email, data.firstName);

        logger.info('Team member re-invited', { userId, teamMemberId: existing.id });
        return existing;
      }

      throw new ValidationError('Team member with this email already exists', {
        email: data.email,
      });
    }

    // Create new team member
    const teamMember = await teamMemberRepository.create(userId, data);

    // Send invitation email
    await this.sendInvitationEmail(teamMember.id, data.email, data.firstName);

    logger.info('Team member invited', { userId, teamMemberId: teamMember.id });

    return teamMember;
  }

  /**
   * Get all team members for a user
   */
  async getAll(userId: string, filters?: ListTeamMembersDto) {
    return teamMemberRepository.findAll(userId, filters);
  }

  /**
   * Get team member by ID
   */
  async getById(userId: string, memberId: string) {
    const teamMember = await teamMemberRepository.findById(memberId, userId);

    if (!teamMember) {
      throw new NotFoundError('Team member not found');
    }

    return teamMember;
  }

  /**
   * Update team member role and permissions
   */
  async update(userId: string, memberId: string, data: UpdateTeamMemberDto) {
    // Verify team member exists
    const teamMember = await teamMemberRepository.findById(memberId, userId);

    if (!teamMember) {
      throw new NotFoundError('Team member not found');
    }

    // Prevent changing status to ACCEPTED via this endpoint
    if (data.status === 'ACCEPTED') {
      throw new ValidationError('Cannot manually accept invitation. Use accept endpoint.');
    }

    await teamMemberRepository.update(memberId, userId, data);

    logger.info('Team member updated', { userId, teamMemberId: memberId });

    return this.getById(userId, memberId);
  }

  /**
   * Remove team member
   */
  async remove(userId: string, memberId: string) {
    // Verify team member exists
    const teamMember = await teamMemberRepository.findById(memberId, userId);

    if (!teamMember) {
      throw new NotFoundError('Team member not found');
    }

    await teamMemberRepository.delete(memberId, userId);

    logger.info('Team member removed', { userId, teamMemberId: memberId });
  }

  /**
   * Accept team member invitation
   */
  async acceptInvite(token: string) {
    // Decode token to get team member ID
    const teamMemberId = this.decodeInvitationToken(token);

    // Find team member
    const teamMember = await teamMemberRepository.findById(teamMemberId, ''); // No userId filter

    if (!teamMember) {
      throw new NotFoundError('Invitation not found');
    }

    // Check if invitation is still pending
    if (teamMember.status !== 'PENDING') {
      throw new ValidationError('Invitation has already been processed or expired');
    }

    // Check if invitation has expired (7 days)
    const invitedAt = new Date(teamMember.invitedAt);
    const expiryDate = new Date(invitedAt.getTime() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    if (new Date() > expiryDate) {
      // Mark as expired
      await teamMemberRepository.updateStatus(teamMemberId, 'EXPIRED');
      throw new ValidationError('Invitation has expired. Please request a new invitation.');
    }

    // Accept invitation
    await teamMemberRepository.updateStatus(teamMemberId, 'ACCEPTED', new Date());

    logger.info('Team member invitation accepted', { teamMemberId });

    return teamMember;
  }

  /**
   * Decline team member invitation
   */
  async declineInvite(token: string) {
    const teamMemberId = this.decodeInvitationToken(token);

    const teamMember = await teamMemberRepository.findById(teamMemberId, '');

    if (!teamMember) {
      throw new NotFoundError('Invitation not found');
    }

    if (teamMember.status !== 'PENDING') {
      throw new ValidationError('Invitation has already been processed');
    }

    await teamMemberRepository.updateStatus(teamMemberId, 'DECLINED');

    logger.info('Team member invitation declined', { teamMemberId });
  }

  /**
   * Resend invitation email
   */
  async resendInvite(userId: string, memberId: string) {
    const teamMember = await teamMemberRepository.findById(memberId, userId);

    if (!teamMember) {
      throw new NotFoundError('Team member not found');
    }

    if (teamMember.status === 'ACCEPTED') {
      throw new ValidationError('Cannot resend invitation to accepted team member');
    }

    // Update status to PENDING if expired or declined
    if (teamMember.status !== 'PENDING') {
      await teamMemberRepository.updateStatus(memberId, 'PENDING');
    }

    // Send invitation email
    await this.sendInvitationEmail(memberId, teamMember.email, teamMember.firstName);

    logger.info('Team member invitation resent', { userId, teamMemberId: memberId });
  }

  /**
   * Get team member statistics
   */
  async getStats(userId: string) {
    const all = await teamMemberRepository.findAll(userId);

    return {
      total: all.length,
      pending: all.filter((m) => m.status === 'PENDING').length,
      accepted: all.filter((m) => m.status === 'ACCEPTED').length,
      declined: all.filter((m) => m.status === 'DECLINED').length,
      expired: all.filter((m) => m.status === 'EXPIRED').length,
    };
  }

  /**
   * Send invitation email to team member
   */
  private async sendInvitationEmail(teamMemberId: string, email: string, firstName: string) {
    const token = this.generateInvitationToken(teamMemberId);
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/team/accept-invite?token=${token}`;

    try {
      await sendEmail({
        to: email,
        subject: "You've been invited to join a team",
        html: emailTemplates.teamInvitation(firstName, invitationUrl),
        text: `Hi ${firstName},\n\nYou've been invited to join a team.\n\nClick the link below to accept the invitation:\n${invitationUrl}\n\nThis invitation will expire in ${INVITATION_EXPIRY_DAYS} days.`,
      });

      logger.info('Team invitation email sent', { teamMemberId, email });
    } catch (error) {
      logger.error('Failed to send team invitation email', { teamMemberId, email, error });
      throw new Error('Failed to send invitation email');
    }
  }

  /**
   * Generate invitation token (simple base64 encoding of team member ID)
   */
  private generateInvitationToken(teamMemberId: string): string {
    // In production, consider using JWT or a more secure token mechanism
    return Buffer.from(teamMemberId).toString('base64');
  }

  /**
   * Decode invitation token to get team member ID
   */
  private decodeInvitationToken(token: string): string {
    try {
      return Buffer.from(token, 'base64').toString('utf-8');
    } catch (error) {
      throw new ValidationError('Invalid invitation token');
    }
  }
}

export const teamMemberService = new TeamMemberService();
