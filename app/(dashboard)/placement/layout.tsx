import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { canAccessPlacementFeatures } from '@/lib/account-capabilities';

export default async function PlacementLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !canAccessPlacementFeatures(session.user.accountType)) {
    redirect('/dashboard');
  }

  return children;
}
