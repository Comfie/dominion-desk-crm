import { z } from 'zod';
import { TeamRole, InviteStatus } from '@prisma/client';

export const inviteTeamMemberSchema = z.object({
  email: z.string().email('Valid email is required'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.nativeEnum(TeamRole).default('VIEWER'),
  canManageProperties: z.boolean().default(false),
  canManageBookings: z.boolean().default(false),
  canManageTenants: z.boolean().default(false),
  canManageFinancials: z.boolean().default(false),
  canViewReports: z.boolean().default(true),
});

export const updateTeamMemberSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: z.nativeEnum(TeamRole).optional(),
  canManageProperties: z.boolean().optional(),
  canManageBookings: z.boolean().optional(),
  canManageTenants: z.boolean().optional(),
  canManageFinancials: z.boolean().optional(),
  canViewReports: z.boolean().optional(),
  status: z.nativeEnum(InviteStatus).optional(),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
});

export const listTeamMembersSchema = z.object({
  status: z.nativeEnum(InviteStatus).optional(),
  role: z.nativeEnum(TeamRole).optional(),
});

export type InviteTeamMemberDto = z.infer<typeof inviteTeamMemberSchema>;
export type UpdateTeamMemberDto = z.infer<typeof updateTeamMemberSchema>;
export type AcceptInviteDto = z.infer<typeof acceptInviteSchema>;
export type ListTeamMembersDto = z.infer<typeof listTeamMembersSchema>;
