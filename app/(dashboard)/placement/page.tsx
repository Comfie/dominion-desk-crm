import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { Calendar, ClipboardCheck, FileText, Users } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export default async function PlacementPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.organizationId || session?.user?.id;

  const [applicationCount, screeningCount, viewingCount, landlordCount] = await Promise.all([
    prisma.rentalApplication.count({
      where: { userId, status: { in: ['NEW', 'APPLICATION_RECEIVED', 'SCREENING'] } },
    }),
    prisma.applicantScreening.count({
      where: { userId, overallStatus: { in: ['PENDING', 'NEEDS_REVIEW'] } },
    }),
    prisma.viewing.count({
      where: { userId, status: { in: ['SCHEDULED', 'CONFIRMED'] } },
    }),
    prisma.landlordOwner.count({
      where: { userId, status: 'ACTIVE' },
    }),
  ]);

  const pipelineCards = [
    {
      title: 'Active applications',
      value: applicationCount,
      href: '/placement/applications',
      icon: FileText,
    },
    {
      title: 'Screening queue',
      value: screeningCount,
      href: '/placement/applications',
      icon: ClipboardCheck,
    },
    {
      title: 'Upcoming viewings',
      value: viewingCount,
      href: '/placement/viewings',
      icon: Calendar,
    },
    {
      title: 'Active landlords',
      value: landlordCount,
      href: '/placement/landlords',
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Placement Pipeline"
        description="Track agency placement work from enquiry through tenant placement"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pipelineCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold">{card.value}</div>
              <Button asChild variant="outline" size="sm">
                <Link href={card.href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
