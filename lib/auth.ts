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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accountType = user.accountType;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.accountType = token.accountType as string;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
