'use client';

import * as Sentry from '@sentry/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider, useSession } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';

interface ProvidersProps {
  children: React.ReactNode;
}

// Component to sync Sentry user context with the session
function SentryUserContext({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      Sentry.setUser({
        id: session.user.id,
        email: session.user.email ?? undefined,
        username: session.user.name ?? undefined,
      });
    } else if (status === 'unauthenticated') {
      // Clear user context when logged out
      Sentry.setUser(null);
    }
  }, [session, status]);

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem enableColorScheme>
      <SessionProvider>
        <SentryUserContext>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </SentryUserContext>
      </SessionProvider>
    </ThemeProvider>
  );
}
