import { format } from 'date-fns';
import { getServerSession } from 'next-auth';
import Link from 'next/link';

import { PageHeader } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { ViewingStatusActions } from './viewing-status-actions';

export default async function PlacementViewingsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.organizationId || session?.user?.id;

  const viewings = await prisma.viewing.findMany({
    where: { userId },
    include: {
      property: { select: { name: true, city: true } },
    },
    orderBy: [{ scheduledFor: 'asc' }],
    take: 25,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Viewings" description="Scheduled rental viewings and attendance">
        <Button asChild>
          <Link href="/placement/viewings/new">New Viewing</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Viewing Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {viewings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No viewings scheduled.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 pr-4 font-medium">Contact</th>
                    <th className="py-3 pr-4 font-medium">Property</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium">Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {viewings.map((viewing) => (
                    <tr key={viewing.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        {format(viewing.scheduledFor, 'dd MMM yyyy, HH:mm')}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{viewing.contactName}</div>
                        <div className="text-muted-foreground">
                          {viewing.contactEmail || viewing.contactPhone || '-'}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div>{viewing.property.name}</div>
                        <div className="text-muted-foreground">{viewing.property.city}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{viewing.status.replaceAll('_', ' ')}</Badge>
                      </td>
                      <td className="py-3">
                        <div className="space-y-2">
                          <div>{viewing.assignedTo || '-'}</div>
                          <ViewingStatusActions viewingId={viewing.id} status={viewing.status} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
