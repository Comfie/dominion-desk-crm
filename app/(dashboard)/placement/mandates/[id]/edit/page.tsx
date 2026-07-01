import { format } from 'date-fns';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { PageHeader } from '@/components/shared';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { NewMandateForm } from '../../new/mandate-form';

export default async function EditMandatePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.organizationId || session?.user?.id;
  const { id } = await params;

  if (!userId) {
    notFound();
  }

  const mandate = await prisma.rentalMandate.findFirst({
    where: { id, userId },
  });

  if (!mandate) {
    notFound();
  }

  const [properties, landlords] = await Promise.all([
    prisma.property.findMany({
      where: {
        userId,
        OR: [
          {
            rentalType: { in: ['LONG_TERM', 'BOTH'] },
            status: { not: 'ARCHIVED' },
          },
          { id: mandate.propertyId },
        ],
      },
      select: {
        id: true,
        name: true,
        city: true,
        landlordOwnerId: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.landlordOwner.findMany({
      where: {
        userId,
        OR: [{ status: 'ACTIVE' }, { id: mandate.landlordOwnerId || '' }],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Mandate" description="Update agreement dates, status, and fees" />

      <NewMandateForm
        mode="edit"
        properties={properties}
        landlords={landlords.map((landlord) => ({
          ...landlord,
          displayName: landlord.companyName || `${landlord.firstName} ${landlord.lastName}`.trim(),
        }))}
        defaults={{
          propertyId: mandate.propertyId,
          landlordOwnerId: mandate.landlordOwnerId || '',
        }}
        initialValues={{
          id: mandate.id,
          propertyId: mandate.propertyId,
          landlordOwnerId: mandate.landlordOwnerId || '',
          mandateType: mandate.mandateType,
          exclusivity: mandate.exclusivity,
          status: mandate.status,
          startDate: format(mandate.startDate, 'yyyy-MM-dd'),
          endDate: mandate.endDate ? format(mandate.endDate, 'yyyy-MM-dd') : '',
          placementFeePercentage: mandate.placementFeePercentage?.toString() || '',
          managementFeePercentage: mandate.managementFeePercentage?.toString() || '',
          vatApplicable: mandate.vatApplicable,
          mandateDocumentUrl: mandate.mandateDocumentUrl || '',
          notes: mandate.notes || '',
        }}
      />
    </div>
  );
}
