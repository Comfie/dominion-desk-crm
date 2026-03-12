/**
 * Production seed — minimal setup only
 * Creates: admin account + system task templates + system settings
 * Run once after clearing the production database
 */

import 'dotenv/config';
import { PrismaClient, SubscriptionTier, TaskType, Priority } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { initializeDefaultSettings } from '../lib/services/system-settings.service';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const systemTaskTemplates = [
  {
    name: 'Check-In Checklist',
    description: 'Standard checklist for guest/tenant check-in process',
    taskType: TaskType.CHECK_IN,
    priority: Priority.HIGH,
    category: 'check-in',
    isSystem: true,
    checklist: [
      { item: 'Verify guest identity (ID or passport)', isRequired: true, sortOrder: 0 },
      { item: 'Hand over all keys', isRequired: true, sortOrder: 1 },
      { item: 'Take meter readings (electricity/water)', isRequired: true, sortOrder: 2 },
      { item: 'Document property condition with photos', isRequired: true, sortOrder: 3 },
      { item: 'Explain house rules and emergency contacts', isRequired: false, sortOrder: 4 },
      { item: 'Show how appliances work', isRequired: false, sortOrder: 5 },
      { item: 'Provide welcome pack/information', isRequired: false, sortOrder: 6 },
      { item: 'Confirm Wi-Fi credentials provided', isRequired: false, sortOrder: 7 },
    ],
  },
  {
    name: 'Check-Out Checklist',
    description: 'Standard checklist for guest/tenant check-out process',
    taskType: TaskType.CHECK_OUT,
    priority: Priority.HIGH,
    category: 'check-out',
    isSystem: true,
    checklist: [
      { item: 'Collect all keys', isRequired: true, sortOrder: 0 },
      { item: 'Take final meter readings', isRequired: true, sortOrder: 1 },
      { item: 'Inspect property for damage', isRequired: true, sortOrder: 2 },
      { item: 'Document condition with photos', isRequired: true, sortOrder: 3 },
      { item: 'Check all appliances are working', isRequired: false, sortOrder: 4 },
      { item: 'Verify cleaning status', isRequired: false, sortOrder: 5 },
      { item: 'Process deposit return/deductions', isRequired: true, sortOrder: 6 },
      { item: 'Update property availability status', isRequired: true, sortOrder: 7 },
    ],
  },
  {
    name: 'Property Inspection',
    description: 'Comprehensive property inspection checklist',
    taskType: TaskType.INSPECTION,
    priority: Priority.NORMAL,
    category: 'inspection',
    isSystem: true,
    checklist: [
      { item: 'Check exterior condition (walls, roof, gutters)', isRequired: true, sortOrder: 0 },
      { item: 'Inspect all rooms for damage', isRequired: true, sortOrder: 1 },
      { item: 'Test smoke detectors and alarms', isRequired: true, sortOrder: 2 },
      { item: 'Check plumbing (taps, toilets, drains)', isRequired: true, sortOrder: 3 },
      { item: 'Test electrical outlets and switches', isRequired: true, sortOrder: 4 },
      { item: 'Inspect appliances', isRequired: false, sortOrder: 5 },
      { item: 'Check windows and doors lock properly', isRequired: true, sortOrder: 6 },
      { item: 'Review garden/outdoor area', isRequired: false, sortOrder: 7 },
      { item: 'Take dated photos of all areas', isRequired: true, sortOrder: 8 },
    ],
  },
  {
    name: 'Move-In Preparation',
    description: 'Checklist to prepare property for new tenant move-in',
    taskType: TaskType.OTHER,
    priority: Priority.HIGH,
    category: 'move-in',
    isSystem: true,
    checklist: [
      { item: 'Deep clean property', isRequired: true, sortOrder: 0 },
      { item: 'Change locks or rekey', isRequired: false, sortOrder: 1 },
      { item: 'Test all utilities are working', isRequired: true, sortOrder: 2 },
      { item: 'Prepare welcome letter', isRequired: false, sortOrder: 3 },
      { item: 'Schedule move-in appointment', isRequired: true, sortOrder: 4 },
      { item: 'Prepare lease documents', isRequired: true, sortOrder: 5 },
      { item: 'Set up payment collection method', isRequired: true, sortOrder: 6 },
    ],
  },
  {
    name: 'Move-Out Processing',
    description: 'Checklist for processing tenant move-out',
    taskType: TaskType.OTHER,
    priority: Priority.HIGH,
    category: 'move-out',
    isSystem: true,
    checklist: [
      { item: 'Receive move-out notice', isRequired: true, sortOrder: 0 },
      { item: 'Schedule final inspection', isRequired: true, sortOrder: 1 },
      { item: 'Document any damage', isRequired: true, sortOrder: 2 },
      { item: 'Calculate deposit deductions', isRequired: true, sortOrder: 3 },
      { item: 'Process deposit return within legal timeframe', isRequired: true, sortOrder: 4 },
      { item: 'Update property availability status', isRequired: true, sortOrder: 5 },
      { item: 'Schedule cleaning/repairs', isRequired: false, sortOrder: 6 },
      { item: 'Cancel tenant utilities if applicable', isRequired: false, sortOrder: 7 },
    ],
  },
  {
    name: 'Lease Renewal Process',
    description: 'Checklist for managing lease renewals',
    taskType: TaskType.LEASE_RENEWAL,
    priority: Priority.HIGH,
    category: 'lease',
    isSystem: true,
    checklist: [
      { item: 'Review current lease terms', isRequired: true, sortOrder: 0 },
      { item: 'Check market rental rates', isRequired: false, sortOrder: 1 },
      { item: 'Contact tenant about renewal intentions', isRequired: true, sortOrder: 2 },
      { item: 'Negotiate new terms if needed', isRequired: false, sortOrder: 3 },
      { item: 'Prepare renewal documents', isRequired: true, sortOrder: 4 },
      { item: 'Get signed renewal agreement', isRequired: true, sortOrder: 5 },
      { item: 'Update system with new lease dates', isRequired: true, sortOrder: 6 },
    ],
  },
  {
    name: 'Maintenance Follow-Up',
    description: 'Follow-up checklist after maintenance completion',
    taskType: TaskType.FOLLOW_UP,
    priority: Priority.NORMAL,
    category: 'maintenance',
    isSystem: true,
    checklist: [
      { item: 'Confirm work has been completed', isRequired: true, sortOrder: 0 },
      { item: 'Verify quality of work', isRequired: true, sortOrder: 1 },
      { item: 'Get tenant/guest feedback', isRequired: false, sortOrder: 2 },
      { item: 'Process payment to contractor', isRequired: true, sortOrder: 3 },
      { item: 'Update maintenance records', isRequired: true, sortOrder: 4 },
      { item: 'Schedule follow-up inspection if needed', isRequired: false, sortOrder: 5 },
    ],
  },
  {
    name: 'Payment Reminder Follow-Up',
    description: 'Checklist for following up on overdue payments',
    taskType: TaskType.PAYMENT_REMINDER,
    priority: Priority.HIGH,
    category: 'payment',
    isSystem: true,
    checklist: [
      { item: 'Verify payment is actually overdue', isRequired: true, sortOrder: 0 },
      { item: 'Send first payment reminder', isRequired: true, sortOrder: 1 },
      { item: 'Call tenant if no response after 3 days', isRequired: false, sortOrder: 2 },
      { item: 'Document all communication attempts', isRequired: true, sortOrder: 3 },
      { item: 'Send formal notice if required', isRequired: false, sortOrder: 4 },
      { item: 'Update payment status once received', isRequired: true, sortOrder: 5 },
    ],
  },
];

async function main() {
  console.log('🌱 Starting production seed...\n');

  // 1. Admin account
  console.log('👤 Creating admin account...');
  const adminPassword = await bcrypt.hash('Nerayah@2022', 10);

  await prisma.user.upsert({
    where: { email: 'comfynyatsine@gmail.com' },
    update: { password: adminPassword },
    create: {
      email: 'comfynyatsine@gmail.com',
      password: adminPassword,
      firstName: 'Comfort',
      lastName: 'Nyatsine',
      role: 'CUSTOMER',
      accountType: 'INDIVIDUAL',
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      subscriptionStatus: 'ACTIVE',
      emailVerified: true,
      propertyLimit: 20,
      rentalDueDay: 1,
    },
  });
  console.log('✅ Admin account ready\n');

  // 2. System task templates
  console.log('📋 Seeding system task templates...');
  await prisma.taskTemplate.deleteMany({ where: { isSystem: true } });
  for (const template of systemTaskTemplates) {
    await prisma.taskTemplate.create({
      data: {
        userId: null,
        name: template.name,
        description: template.description,
        taskType: template.taskType,
        priority: template.priority,
        category: template.category,
        isSystem: template.isSystem,
        checklist: template.checklist,
      },
    });
  }
  console.log(`✅ Created ${systemTaskTemplates.length} system task templates\n`);

  // 3. System settings
  console.log('⚙️  Initializing system settings...');
  await initializeDefaultSettings();
  console.log('✅ System settings initialized\n');

  console.log('🎉 Production seed complete!');
  console.log('   Login: comfynyatsine@gmail.com');
  console.log('   ⚠️  Change your password after first login.');
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
