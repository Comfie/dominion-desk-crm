import { prisma } from '@/lib/db';
import {
  InviteTeamMemberDto,
  UpdateTeamMemberDto,
  ListTeamMembersDto,
} from '../dtos/team-member.dto';
import { InviteStatus, TeamRole } from '@prisma/client';

export class TeamMemberRepository {
  /**
   * Find all team members for a user (organization owner)
   */
  async findAll(userId: string, filters?: ListTeamMembersDto) {
    return prisma.teamMember.findMany({
      where: {
        userId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.role && { role: filters.role }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find team member by ID
   */
  async findById(id: string, userId: string) {
    return prisma.teamMember.findFirst({
      where: { id, userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find team member by email for a specific organization
   */
  async findByEmail(email: string, userId: string) {
    return prisma.teamMember.findFirst({
      where: {
        email,
        userId,
      },
    });
  }

  /**
   * Find all organizations where user is a team member
   */
  async findByTeamMemberUser(teamMemberUserId: string) {
    return prisma.teamMember.findMany({
      where: {
        // This would need a different field if we're tracking which user the team member is
        // For now, we'll just find by the userId field
      },
    });
  }

  /**
   * Create a new team member invitation
   */
  async create(userId: string, data: InviteTeamMemberDto) {
    return prisma.teamMember.create({
      data: {
        ...data,
        userId,
        status: 'PENDING',
        invitedAt: new Date(),
      },
    });
  }

  /**
   * Update team member details
   */
  async update(id: string, userId: string, data: UpdateTeamMemberDto) {
    return prisma.teamMember.updateMany({
      where: { id, userId },
      data,
    });
  }

  /**
   * Update team member status
   */
  async updateStatus(id: string, status: InviteStatus, acceptedAt?: Date) {
    return prisma.teamMember.update({
      where: { id },
      data: {
        status,
        ...(acceptedAt && { acceptedAt }),
      },
    });
  }

  /**
   * Delete team member
   */
  async delete(id: string, userId: string) {
    return prisma.teamMember.deleteMany({
      where: { id, userId },
    });
  }

  /**
   * Count team members for a user
   */
  async count(userId: string, status?: InviteStatus) {
    return prisma.teamMember.count({
      where: {
        userId,
        ...(status && { status }),
      },
    });
  }
}

export const teamMemberRepository = new TeamMemberRepository();
