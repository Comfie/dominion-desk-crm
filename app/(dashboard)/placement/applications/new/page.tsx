import { getServerSession } from 'next-auth';

import { PageHeader } from '@/components/shared';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { NewRentalApplicationForm } from './rental-application-form';

export default async function NewRentalApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; inquiryId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.organizationId || session?.user?.id;
  const params = await searchParams;

  const [properties, inquiries] = await Promise.all([
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
        monthlyRent: true,
        securityDeposit: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.inquiry.findMany({
      where: {
        userId,
        status: { in: ['NEW', 'IN_PROGRESS', 'RESPONDED'] },
        inquiryType: { in: ['VIEWING', 'GENERAL', 'BOOKING'] },
      },
      select: {
        id: true,
        propertyId: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  const selectedInquiry = params.inquiryId
    ? inquiries.find((inquiry) => inquiry.id === params.inquiryId)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Application"
        description="Capture a rental applicant and start screening"
      />

      <NewRentalApplicationForm
        properties={properties.map((property) => ({
          id: property.id,
          name: property.name,
          city: property.city,
          monthlyRent: property.monthlyRent ? Number(property.monthlyRent) : null,
          securityDeposit: property.securityDeposit ? Number(property.securityDeposit) : null,
        }))}
        inquiries={inquiries}
        defaults={{
          propertyId: params.propertyId || selectedInquiry?.propertyId || '',
          inquiryId: params.inquiryId || '',
          applicantName: selectedInquiry?.contactName || '',
          applicantEmail: selectedInquiry?.contactEmail || '',
          applicantPhone: selectedInquiry?.contactPhone || '',
        }}
      />
    </div>
  );
}
