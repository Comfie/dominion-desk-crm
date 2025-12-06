import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        if (!user.isActive) {
          throw new Error('Your account has been deactivated');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          image: user.photoUrl,
          accountType: user.accountType,
          role: user.role,
          requirePasswordChange: user.requirePasswordChange || false,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session: updateSession }) {
      // Initial sign in - set default organization to user's own workspace
      if (user) {
        token.id = user.id;
        token.accountType = user.accountType;
        token.role = user.role;
        token.requirePasswordChange = user.requirePasswordChange;
        token.organizationId = user.id; // Default: user's own workspace
        token.isTeamMember = false;

        // Fetch user's name for organization display
        const userRecord = await prisma.user.findUnique({
          where: { id: user.id },
          select: { firstName: true, lastName: true },
        });

        if (userRecord) {
          token.organizationName = `${userRecord.firstName} ${userRecord.lastName}`;
        }
      }

      // Handle organization switching (triggered by update)
      if (trigger === 'update' && updateSession?.organizationId) {
        const newOrgId = updateSession.organizationId as string;

        // If switching to own workspace
        if (newOrgId === token.id) {
          token.organizationId = newOrgId;
          token.isTeamMember = false;

          const userRecord = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { firstName: true, lastName: true },
          });

          if (userRecord) {
            token.organizationName = `${userRecord.firstName} ${userRecord.lastName}`;
          }
        } else {
          // Switching to another organization - verify team membership
          const teamMember = await prisma.teamMember.findFirst({
            where: {
              userId: newOrgId,
              email: token.email as string,
              status: 'ACCEPTED',
            },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          });

          if (teamMember) {
            token.organizationId = newOrgId;
            token.isTeamMember = true;
            token.organizationName = `${teamMember.user.firstName} ${teamMember.user.lastName}`;
          }
          // If verification fails, keep current organization (don't switch)
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.accountType = token.accountType as string;
        session.user.role = token.role;
        session.user.requirePasswordChange = token.requirePasswordChange;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationName = token.organizationName;
        session.user.isTeamMember = token.isTeamMember;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
