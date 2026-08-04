import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { PageHeader } from '@/components/shared';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { NewLandlordForm } from '../../new/landlord-form';

export default async function EditLandlordPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.organizationId || session?.user?.id;
  const { id } = await params;

  if (!userId) {
    notFound();
  }

  const landlord = await prisma.landlordOwner.findFirst({
    where: { id, userId },
  });

  if (!landlord) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Landlord" description="Update owner and billing details" />
      <NewLandlordForm
        mode="edit"
        initialValues={{
          id: landlord.id,
          firstName: landlord.firstName,
          lastName: landlord.lastName,
          companyName: landlord.companyName || '',
          email: landlord.email,
          phone: landlord.phone || '',
          alternatePhone: landlord.alternatePhone || '',
          idNumber: landlord.idNumber || '',
          taxNumber: landlord.taxNumber || '',
          vatNumber: landlord.vatNumber || '',
          vatRegistered: landlord.vatRegistered,
          status: landlord.status,
          notes: landlord.notes || '',
        }}
      />
    </div>
  );
}
