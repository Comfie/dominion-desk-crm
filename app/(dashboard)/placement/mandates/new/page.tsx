import { getServerSession } from 'next-auth';

import { PageHeader } from '@/components/shared';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { NewMandateForm } from './mandate-form';

export default async function NewMandatePage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; landlordOwnerId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.organizationId || session?.user?.id;
  const params = await searchParams;

  const [properties, landlords] = await Promise.all([
    prisma.property.findMany({
      where: {
        userId,
        rentalType: { in: ['LONG_TERM', 'BOTH'] },
        status: { not: 'ARCHIVED' },
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
      where: { userId, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
  ]);

  const selectedProperty = params.propertyId
    ? properties.find((property) => property.id === params.propertyId)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Mandate"
        description="Capture a placement or managed-rental agreement"
      />

      <NewMandateForm
        properties={properties}
        landlords={landlords.map((landlord) => ({
          ...landlord,
          displayName: landlord.companyName || `${landlord.firstName} ${landlord.lastName}`.trim(),
        }))}
        defaults={{
          propertyId: params.propertyId || '',
          landlordOwnerId: params.landlordOwnerId || selectedProperty?.landlordOwnerId || '',
        }}
      />
    </div>
  );
}
