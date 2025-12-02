import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/backfill-payment-properties
 * Backfills propertyId for payments that don't have it set
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting to backfill propertyId for payments...');

    // Find all payments without propertyId but with tenantId for this user
    const paymentsWithoutProperty = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        propertyId: null,
        tenantId: { not: null },
      },
      include: {
        tenant: {
          include: {
            properties: {
              where: { isActive: true },
              select: {
                propertyId: true,
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
    });

    console.log(`Found ${paymentsWithoutProperty.length} payments without propertyId`);

    let updated = 0;
    let skipped = 0;
    const details: Array<{ paymentRef: string; property: string; status: string }> = [];

    for (const payment of paymentsWithoutProperty) {
      const propertyId = payment.tenant?.properties?.[0]?.propertyId;
      const propertyName = payment.tenant?.properties?.[0]?.property.name;

      if (propertyId && propertyName) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { propertyId },
        });

        console.log(`✓ Updated payment ${payment.paymentReference} -> ${propertyName}`);
        details.push({
          paymentRef: payment.paymentReference,
          property: propertyName,
          status: 'updated',
        });
        updated++;
      } else {
        console.log(
          `✗ Skipped payment ${payment.paymentReference} - no active property for tenant`
        );
        details.push({
          paymentRef: payment.paymentReference,
          property: 'N/A',
          status: 'skipped',
        });
        skipped++;
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total payments processed: ${paymentsWithoutProperty.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);

    return NextResponse.json({
      success: true,
      message: `Backfill complete: ${updated} updated, ${skipped} skipped`,
      summary: {
        total: paymentsWithoutProperty.length,
        updated,
        skipped,
      },
      details,
    });
  } catch (error) {
    console.error('Error backfilling payment properties:', error);
    return NextResponse.json({ error: 'Failed to backfill payment properties' }, { status: 500 });
  }
}
