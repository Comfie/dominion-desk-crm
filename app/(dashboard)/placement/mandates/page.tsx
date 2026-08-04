import { format } from 'date-fns';
import { getServerSession } from 'next-auth';
import Link from 'next/link';

import { PageHeader } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

function formatPercent(value: unknown) {
  return value === null || value === undefined ? '-' : `${Number(value)}%`;
}

export default async function PlacementMandatesPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.organizationId || session?.user?.id;

  const mandates = await prisma.rentalMandate.findMany({
    where: { userId },
    include: {
      property: { select: { name: true, city: true } },
      landlordOwner: { select: { firstName: true, lastName: true, companyName: true } },
    },
    orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
    take: 25,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Mandates" description="Placement and management agreements">
        <Button asChild>
          <Link href="/placement/mandates/new">New Mandate</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Mandate Register</CardTitle>
        </CardHeader>
        <CardContent>
          {mandates.length === 0 ? (
            <p className="text-muted-foreground text-sm">No mandates captured yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4 font-medium">Property</th>
                    <th className="py-3 pr-4 font-medium">Landlord</th>
                    <th className="py-3 pr-4 font-medium">Type</th>
                    <th className="py-3 pr-4 font-medium">Period</th>
                    <th className="py-3 pr-4 font-medium">Fees</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mandates.map((mandate) => (
                    <tr key={mandate.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <div className="font-medium">{mandate.property.name}</div>
                        <div className="text-muted-foreground">{mandate.property.city}</div>
                      </td>
                      <td className="py-3 pr-4">
                        {mandate.landlordOwner ? (
                          <>
                            <div>
                              {mandate.landlordOwner.firstName} {mandate.landlordOwner.lastName}
                            </div>
                            {mandate.landlordOwner.companyName && (
                              <div className="text-muted-foreground">
                                {mandate.landlordOwner.companyName}
                              </div>
                            )}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div>{mandate.mandateType.replaceAll('_', ' ')}</div>
                        <div className="text-muted-foreground">{mandate.exclusivity}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <div>{format(mandate.startDate, 'dd MMM yyyy')}</div>
                        <div className="text-muted-foreground">
                          {mandate.endDate ? format(mandate.endDate, 'dd MMM yyyy') : 'No end date'}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div>Placement: {formatPercent(mandate.placementFeePercentage)}</div>
                        <div className="text-muted-foreground">
                          Management: {formatPercent(mandate.managementFeePercentage)}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{mandate.status}</Badge>
                      </td>
                      <td className="py-3">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/placement/mandates/${mandate.id}/edit`}>Edit</Link>
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
