import { prisma } from '@/lib/db';

export async function getTenantBySessionEmail(email?: string | null) {
  if (!email) {
    return null;
  }

  return prisma.tenant.findFirst({
    where: { email },
  });
}
