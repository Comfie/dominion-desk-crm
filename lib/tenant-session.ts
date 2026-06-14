import { prisma } from '@/lib/db';

/**
 * Resolve the tenant record for a logged-in tenant portal user.
 *
 * Portal access is bound to the authenticated tenant User record first.
 * Email is only used as a legacy fallback when the explicit link has not
 * been populated yet.
 */
export async function getTenantForPortalSession(userId: string, email?: string | null) {
  if (!userId) {
    return null;
  }

  const linkedTenant = await prisma.tenant.findFirst({
    where: { portalUserId: userId },
  });

  if (linkedTenant) {
    return linkedTenant;
  }

  if (!email) {
    return null;
  }

  const matchingTenants = await prisma.tenant.findMany({
    where: { email },
    orderBy: { createdAt: 'asc' },
    take: 2,
  });

  if (matchingTenants.length !== 1) {
    return null;
  }

  const [tenant] = matchingTenants;

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { portalUserId: userId },
  });

  return tenant;
}
