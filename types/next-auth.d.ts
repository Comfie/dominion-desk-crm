import type { DefaultSession } from 'next-auth';
import type { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      accountType: string;
      role: UserRole;
      requirePasswordChange?: boolean;
      organizationId: string; // Current workspace context
      organizationName?: string; // For UI display
      isTeamMember?: boolean; // True if accessing via team membership
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    accountType: string;
    role: UserRole;
    requirePasswordChange?: boolean;
    organizationId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    accountType: string;
    role: UserRole;
    requirePasswordChange?: boolean;
    organizationId: string;
    organizationName?: string;
    isTeamMember?: boolean;
  }
}
