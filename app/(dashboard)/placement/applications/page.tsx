import { getServerSession } from 'next-auth';
import Link from 'next/link';

import { PageHeader } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { format } from 'date-fns';
import { PlacementCompletionDialog } from './placement-completion-dialog';
import { ScreeningChecklist } from './screening-checklist';

export default async function PlacementApplicationsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.organizationId || session?.user?.id;

  const applications = await prisma.rentalApplication.findMany({
    where: { userId },
    include: {
      property: { select: { name: true, city: true, allowsMultipleTenants: true } },
      screening: true,
      tenant: { select: { id: true, portalUserId: true } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 25,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Applications" description="Rental applications and screening status">
        <Button asChild>
          <Link href="/placement/applications/new">New Application</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Application Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-muted-foreground text-sm">No rental applications yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4 font-medium">Applicant</th>
                    <th className="py-3 pr-4 font-medium">Property</th>
                    <th className="py-3 pr-4 font-medium">Application</th>
                    <th className="py-3 pr-4 font-medium">Screening</th>
                    <th className="py-3 pr-4 font-medium">Assigned</th>
                    <th className="py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <div className="font-medium">
                          {application.applicantFirstName} {application.applicantLastName}
                        </div>
                        <div className="text-muted-foreground">{application.applicantEmail}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <div>{application.property.name}</div>
                        <div className="text-muted-foreground">{application.property.city}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{application.status.replaceAll('_', ' ')}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">
                          {(application.screening?.overallStatus || 'NOT_STARTED').replaceAll(
                            '_',
                            ' '
                          )}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">{application.assignedTo || '-'}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          {application.status !== 'PLACED' && application.screening && (
                            <ScreeningChecklist
                              applicationId={application.id}
                              applicantName={`${application.applicantFirstName} ${application.applicantLastName}`}
                              documentsHref={
                                application.tenantId
                                  ? `/tenants/${application.tenantId}/documents`
                                  : `/properties/${application.propertyId}/documents`
                              }
                              proposedMonthlyRent={
                                application.proposedMonthlyRent === null
                                  ? null
                                  : Number(application.proposedMonthlyRent)
                              }
                              screening={{
                                creditCheckStatus: application.screening.creditCheckStatus,
                                affordabilityStatus: application.screening.affordabilityStatus,
                                employerReferenceStatus:
                                  application.screening.employerReferenceStatus,
                                landlordReferenceStatus:
                                  application.screening.landlordReferenceStatus,
                                ficaStatus: application.screening.ficaStatus,
                                declaredMonthlyIncome:
                                  application.screening.declaredMonthlyIncome?.toString() || '',
                                riskScore: application.screening.riskScore?.toString() || '',
                                consentReceived: application.screening.consentReceived,
                                notes: application.screening.notes || '',
                              }}
                            />
                          )}
                          <PlacementCompletionDialog
                            applicationId={application.id}
                            applicantName={`${application.applicantFirstName} ${application.applicantLastName}`}
                            eligible={
                              application.screening?.overallStatus === 'PASSED' &&
                              !['PLACED', 'REJECTED', 'WITHDRAWN'].includes(application.status)
                            }
                            allowsMultipleTenants={application.property.allowsMultipleTenants}
                            initialValues={{
                              leaseStartDate: application.proposedLeaseStartDate
                                ? format(application.proposedLeaseStartDate, 'yyyy-MM-dd')
                                : '',
                              leaseEndDate: application.proposedLeaseEndDate
                                ? format(application.proposedLeaseEndDate, 'yyyy-MM-dd')
                                : '',
                              monthlyRent: application.proposedMonthlyRent?.toString() || '',
                              depositPaid: application.proposedDeposit?.toString() || '0',
                              moveInDate: application.requestedMoveInDate
                                ? format(application.requestedMoveInDate, 'yyyy-MM-dd')
                                : '',
                            }}
                            placedTenant={
                              application.status === 'PLACED' && application.tenant
                                ? {
                                    id: application.tenant.id,
                                    portalAccessActive: Boolean(application.tenant.portalUserId),
                                  }
                                : null
                            }
                          />
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
