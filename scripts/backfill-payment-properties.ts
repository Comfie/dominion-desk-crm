import { prisma } from '../lib/db';

async function backfillPaymentProperties() {
  try {
    console.log('Starting to backfill propertyId for payments...\n');

    // Find all payments without propertyId but with tenantId
    const paymentsWithoutProperty = await prisma.payment.findMany({
      where: {
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

    for (const payment of paymentsWithoutProperty) {
      const propertyId = payment.tenant?.properties?.[0]?.propertyId;

      if (propertyId) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { propertyId },
        });

        console.log(
          `✓ Updated payment ${payment.paymentReference} -> ${payment.tenant?.properties?.[0]?.property.name}`
        );
        updated++;
      } else {
        console.log(
          `✗ Skipped payment ${payment.paymentReference} - no active property for tenant`
        );
        skipped++;
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total payments processed: ${paymentsWithoutProperty.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillPaymentProperties();
