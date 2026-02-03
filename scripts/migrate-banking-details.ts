// @ts-nocheck
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { saveBankingDetails } from '../lib/services/banking-encryption.service';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Migrate existing plain text banking details to encrypted storage
 * Run this BEFORE applying the schema changes that remove banking fields from User model
 */
async function main() {
  console.log('🔄 Starting banking details migration...');

  if (!process.env.BANKING_ENCRYPTION_KEY) {
    console.error('❌ BANKING_ENCRYPTION_KEY environment variable is not set!');
    console.log('Generate one with: openssl rand -hex 32');
    process.exit(1);
  }

  // Find all users with banking details
  const usersWithBanking = await prisma.user.findMany({
    where: {
      OR: [
        { bankName: { not: null } },
        { bankAccountName: { not: null } },
        { bankAccountNumber: { not: null } },
        { bankBranchCode: { not: null } },
        { paymentInstructions: { not: null } },
      ],
    },
    select: {
      id: true,
      email: true,
      bankName: true,
      bankAccountName: true,
      bankAccountNumber: true,
      bankBranchCode: true,
      bankSwiftCode: true,
      paymentInstructions: true,
    },
  });

  console.log(`Found ${usersWithBanking.length} users with banking details`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of usersWithBanking) {
    try {
      // Check if already migrated
      const existing = await prisma.encryptedBankingDetails.findUnique({
        where: { userId: user.id },
      });

      if (existing) {
        console.log(`⏭️  Skipping ${user.email} - already migrated`);
        skipped++;
        continue;
      }

      // Migrate banking details
      await saveBankingDetails(user.id, {
        bankName: user.bankName || undefined,
        bankAccountName: user.bankAccountName || undefined,
        bankAccountNumber: user.bankAccountNumber || undefined,
        bankBranchCode: user.bankBranchCode || undefined,
        bankSwiftCode: user.bankSwiftCode || undefined,
        paymentInstructions: user.paymentInstructions || undefined,
      });

      console.log(`✅ Migrated banking details for ${user.email}`);
      migrated++;
    } catch (error) {
      console.error(`❌ Failed to migrate ${user.email}:`, error);
      failed++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`  ✅ Migrated: ${migrated}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log('\n✅ Migration complete!');

  if (migrated > 0) {
    console.log('\n⚠️  Important: Banking details have been encrypted and stored securely.');
    console.log('You can now run: npx prisma db push --accept-data-loss');
    console.log('to apply the schema changes that remove plain text banking fields.');
  }
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
