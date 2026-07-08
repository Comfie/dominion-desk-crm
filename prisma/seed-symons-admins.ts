/**
 * Client onboarding seed — Symons account admins
 *
 * Creates:
 *   1. Brandley Symons  — private (INDIVIDUAL) account owner. Properties are
 *      imported into this workspace.
 *   2. Kern-Lee Symons  — a second login who helps manage Brandley's workspace
 *      (own User account + an ACCEPTED TeamMember record under Brandley with
 *      full management permissions).
 *
 * Idempotent: safe to run on test first, then production. Re-running updates
 * the existing rows instead of duplicating them.
 *
 * Passwords: taken from SEED_BRANDLEY_PASSWORD / SEED_KERNLEE_PASSWORD if set,
 * otherwise a strong random password is generated and printed once at the end.
 * Both accounts are flagged requirePasswordChange, so the real users must set
 * their own password on first login.
 *
 * Run:  DATABASE_URL="<target-db>" npx tsx prisma/seed-symons-admins.ts
 */

import 'dotenv/config';
import { randomBytes } from 'crypto';
import { PrismaClient, SubscriptionTier } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Emails are stored exactly as provided. The app compares emails
// case-sensitively at login, so users must sign in with this exact casing.
const OWNER = {
  email: 'Brandley.symons@gmail.com',
  firstName: 'Brandley',
  lastName: 'Symons',
};

const HELPER = {
  email: 'Symonskern55@gmail.com',
  firstName: 'Kern-Lee',
  lastName: 'Symons',
};

function generatePassword(): string {
  // Strong, readable-enough one-time password; users are forced to change it.
  return `Symons-${randomBytes(6).toString('hex')}-2026!`;
}

async function main() {
  console.log('🌱 Seeding Symons account admins...\n');

  const ownerPassword = process.env.SEED_BRANDLEY_PASSWORD || generatePassword();
  const helperPassword = process.env.SEED_KERNLEE_PASSWORD || generatePassword();

  // 1. Owner — private individual account, provisioned at professional tier so
  //    the property limit is not enforced during the bulk import.
  console.log('👤 Upserting owner account (Brandley Symons)...');
  const owner = await prisma.user.upsert({
    where: { email: OWNER.email },
    update: {
      firstName: OWNER.firstName,
      lastName: OWNER.lastName,
      role: 'CUSTOMER',
      accountType: 'INDIVIDUAL',
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      subscriptionStatus: 'ACTIVE',
      isActive: true,
      emailVerified: true,
      propertyLimit: 100,
    },
    create: {
      email: OWNER.email,
      password: await bcrypt.hash(ownerPassword, 10),
      firstName: OWNER.firstName,
      lastName: OWNER.lastName,
      role: 'CUSTOMER',
      accountType: 'INDIVIDUAL',
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      subscriptionStatus: 'ACTIVE',
      isActive: true,
      emailVerified: true,
      requirePasswordChange: true,
      propertyLimit: 100,
      rentalDueDay: 1,
    },
  });
  console.log(`✅ Owner ready (id: ${owner.id})\n`);

  // 2. Helper — own login account so they can authenticate.
  console.log('👤 Upserting helper account (Kern-Lee Symons)...');
  const helper = await prisma.user.upsert({
    where: { email: HELPER.email },
    update: {
      firstName: HELPER.firstName,
      lastName: HELPER.lastName,
      role: 'CUSTOMER',
      accountType: 'INDIVIDUAL',
      isActive: true,
      emailVerified: true,
    },
    create: {
      email: HELPER.email,
      password: await bcrypt.hash(helperPassword, 10),
      firstName: HELPER.firstName,
      lastName: HELPER.lastName,
      role: 'CUSTOMER',
      accountType: 'INDIVIDUAL',
      isActive: true,
      emailVerified: true,
      requirePasswordChange: true,
    },
  });
  console.log(`✅ Helper ready (id: ${helper.id})\n`);

  // 3. Team membership — link the helper into the owner's workspace as an
  //    ADMIN with full management permissions. Matched on userId + email +
  //    status:ACCEPTED by the org-switch logic in lib/auth.ts.
  console.log('🔗 Linking helper into owner workspace as team admin...');
  const membershipData = {
    email: HELPER.email,
    firstName: HELPER.firstName,
    lastName: HELPER.lastName,
    role: 'ADMIN' as const,
    canManageProperties: true,
    canManageBookings: true,
    canManageTenants: true,
    canManageFinancials: true,
    canViewReports: true,
    status: 'ACCEPTED' as const,
    acceptedAt: new Date(),
  };

  const existingMembership = await prisma.teamMember.findFirst({
    where: { userId: owner.id, email: HELPER.email },
  });

  if (existingMembership) {
    await prisma.teamMember.update({
      where: { id: existingMembership.id },
      data: membershipData,
    });
  } else {
    await prisma.teamMember.create({
      data: { userId: owner.id, ...membershipData },
    });
  }
  console.log('✅ Team membership ready\n');

  console.log('🎉 Symons admins seeded.\n');
  console.log('   Owner login : ' + OWNER.email);
  if (!process.env.SEED_BRANDLEY_PASSWORD) {
    console.log('   Owner pass  : ' + ownerPassword);
  }
  console.log('   Helper login: ' + HELPER.email);
  if (!process.env.SEED_KERNLEE_PASSWORD) {
    console.log('   Helper pass : ' + helperPassword);
  }
  console.log('\n   ⚠️  Log in with the exact email casing shown (case-sensitive).');
  console.log('   ⚠️  Both accounts must change their password on first login.');
  console.log('   ℹ️  Helper manages the owner workspace via the org switcher.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
