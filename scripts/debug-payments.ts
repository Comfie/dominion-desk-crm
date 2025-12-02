import { prisma } from '../lib/db';

async function debugPayments() {
  try {
    const payments = await prisma.payment.findMany({
      where: { status: 'PAID' },
      include: {
        property: { select: { id: true, name: true } },
        booking: {
          select: {
            propertyId: true,
            property: { select: { id: true, name: true } },
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            properties: {
              where: { isActive: true },
              select: { property: { select: { id: true, name: true } } },
            },
          },
        },
      },
      take: 10,
    });

    console.log('\n=== PAYMENT DEBUG ===');
    console.log('Total PAID payments found:', payments.length);
    console.log('');

    payments.forEach((p, idx) => {
      console.log(`Payment ${idx + 1}:`);
      console.log(`  ID: ${p.id}`);
      console.log(`  Amount: R${p.amount.toString()}`);
      console.log(`  Type: ${p.paymentType}`);
      console.log(`  Date: ${p.paymentDate.toISOString().split('T')[0]}`);
      console.log(`  PropertyId (direct): ${p.propertyId || 'null'}`);
      console.log(`  Property name (direct): ${p.property?.name || 'null'}`);
      console.log(`  BookingId: ${p.bookingId || 'null'}`);
      console.log(`  Booking property: ${p.booking?.property?.name || 'null'}`);
      console.log(`  TenantId: ${p.tenantId || 'null'}`);
      console.log(`  Tenant: ${p.tenant ? `${p.tenant.firstName} ${p.tenant.lastName}` : 'null'}`);
      console.log(
        `  Tenant properties: ${p.tenant?.properties?.map((tp) => tp.property.name).join(', ') || 'null'}`
      );
      console.log('');
    });

    // Check what year the payments are in
    if (payments.length > 0) {
      const years = payments.map((p) => new Date(p.paymentDate).getFullYear());
      const uniqueYears = [...new Set(years)];
      console.log('Payment years found:', uniqueYears.join(', '));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPayments();
