import { prisma } from '../lib/db';

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, firstName: true, lastName: true },
  });
  console.log('Users in database:');
  users.forEach((u) => console.log(`  - ${u.email} (${u.role}) - ${u.firstName} ${u.lastName}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
