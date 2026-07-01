import { getServerSession } from 'next-auth';
import Link from 'next/link';

import { PageHeader } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export default async function PlacementLandlordsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.organizationId || session?.user?.id;

  const landlords = await prisma.landlordOwner.findMany({
    where: { userId },
    include: {
      _count: {
        select: {
          properties: true,
          rentalMandates: true,
        },
      },
    },
    orderBy: [{ status: 'asc' }, { lastName: 'asc' }],
    take: 25,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Landlords" description="Owners represented by the agency">
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/placement/mandates">Mandates</Link>
          </Button>
          <Button asChild>
            <Link href="/placement/landlords/new">New Landlord</Link>
          </Button>
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Owner Register</CardTitle>
        </CardHeader>
        <CardContent>
          {landlords.length === 0 ? (
            <p className="text-muted-foreground text-sm">No landlords captured yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4 font-medium">Owner</th>
                    <th className="py-3 pr-4 font-medium">Contact</th>
                    <th className="py-3 pr-4 font-medium">Properties</th>
                    <th className="py-3 pr-4 font-medium">Mandates</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {landlords.map((landlord) => (
                    <tr key={landlord.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <div className="font-medium">
                          {landlord.firstName} {landlord.lastName}
                        </div>
                        {landlord.companyName && (
                          <div className="text-muted-foreground">{landlord.companyName}</div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div>{landlord.email}</div>
                        <div className="text-muted-foreground">{landlord.phone || '-'}</div>
                      </td>
                      <td className="py-3 pr-4">{landlord._count.properties}</td>
                      <td className="py-3 pr-4">{landlord._count.rentalMandates}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{landlord.status}</Badge>
                      </td>
                      <td className="py-3">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/placement/landlords/${landlord.id}/edit`}>Edit</Link>
                        </Button>
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
