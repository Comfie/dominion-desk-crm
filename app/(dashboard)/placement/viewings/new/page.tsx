import { getServerSession } from 'next-auth';

import { PageHeader } from '@/components/shared';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { NewViewingForm } from './viewing-form';

export default async function NewViewingPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; inquiryId?: string; applicationId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.organizationId || session?.user?.id;
  const params = await searchParams;

  const [properties, inquiries, applications] = await Promise.all([
    prisma.property.findMany({
      where: {
        userId,
        rentalType: { in: ['LONG_TERM', 'BOTH'] },
        status: { not: 'ARCHIVED' },
      },
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    }),
    prisma.inquiry.findMany({
      where: {
        userId,
        status: { in: ['NEW', 'IN_PROGRESS', 'RESPONDED'] },
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
    prisma.rentalApplication.findMany({
      where: {
        userId,
        status: {
          in: ['NEW', 'APPLICATION_RECEIVED', 'SCREENING', 'APPROVED', 'LEASE_OFFER_SENT'],
        },
      },
      select: {
        id: true,
        propertyId: true,
        applicantFirstName: true,
        applicantLastName: true,
        applicantEmail: true,
        applicantPhone: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  const selectedInquiry = params.inquiryId
    ? inquiries.find((inquiry) => inquiry.id === params.inquiryId)
    : null;
  const selectedApplication = params.applicationId
    ? applications.find((application) => application.id === params.applicationId)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title="New Viewing" description="Schedule a rental viewing" />

      <NewViewingForm
        properties={properties}
        inquiries={inquiries}
        applications={applications.map((application) => ({
          ...application,
          applicantName: `${application.applicantFirstName} ${application.applicantLastName}`,
        }))}
        defaults={{
          propertyId:
            params.propertyId ||
            selectedInquiry?.propertyId ||
            selectedApplication?.propertyId ||
            '',
          inquiryId: params.inquiryId || '',
          rentalApplicationId: params.applicationId || '',
          contactName:
            selectedInquiry?.contactName ||
            (selectedApplication
              ? `${selectedApplication.applicantFirstName} ${selectedApplication.applicantLastName}`
              : ''),
          contactEmail: selectedInquiry?.contactEmail || selectedApplication?.applicantEmail || '',
          contactPhone: selectedInquiry?.contactPhone || selectedApplication?.applicantPhone || '',
        }}
      />
    </div>
  );
}
