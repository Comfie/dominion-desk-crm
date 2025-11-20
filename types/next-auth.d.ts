import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      accountType: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    accountType: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    accountType: string;
  }
}
