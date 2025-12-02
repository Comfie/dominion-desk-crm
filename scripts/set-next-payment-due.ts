import { prisma } from '../lib/db';

async function setNextPaymentDue() {
  console.log('Setting nextPaymentDue for tenants...');

  // Get all active tenants with monthly rent
  const tenants = await prisma.tenant.findMany({
    where: {
      status: 'ACTIVE',
      monthlyRent: { not: null },
    },
    include: {
      user: {
        select: {
          rentalDueDay: true,
        },
      },
    },
  });

  console.log(`Found ${tenants.length} active tenants with monthly rent`);

  let updated = 0;

  for (const tenant of tenants) {
    const rentalDueDay = tenant.user.rentalDueDay || 1;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    // If we're past the due day this month, set for next month
    let targetMonth = currentMonth;
    let targetYear = currentYear;

    if (currentDay >= rentalDueDay) {
      targetMonth = currentMonth + 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear = currentYear + 1;
      }
    }

    // Cap at 28 to avoid month-end issues
    const dueDay = Math.min(rentalDueDay, 28);
    const nextPaymentDue = new Date(targetYear, targetMonth, dueDay, 9, 0, 0);

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { nextPaymentDue },
    });

    console.log(
      `Updated tenant ${tenant.firstName} ${tenant.lastName} - Next payment due: ${nextPaymentDue.toDateString()}`
    );
    updated++;
  }

  console.log(`\nUpdated ${updated} tenants with nextPaymentDue`);
}

setNextPaymentDue()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
