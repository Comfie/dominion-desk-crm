import { prisma } from '@/lib/db';

/**
 * Get stale maintenance requests (5+ days old and still pending/in-progress)
 * Used for dashboard alerts when cron jobs aren't available
 */
export async function getStaleMaintenance(userId: string) {
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const staleRequests = await prisma.maintenanceRequest.findMany({
    where: {
      userId,
      status: {
        in: ['PENDING', 'IN_PROGRESS'],
      },
      updatedAt: {
        lte: fiveDaysAgo,
      },
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'asc', // Oldest first
    },
    take: 5, // Show max 5 on dashboard
  });

  return staleRequests.map((request) => {
    const daysStale = Math.floor(
      (Date.now() - new Date(request.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      ...request,
      daysStale,
    };
  });
}
