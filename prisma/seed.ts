import 'dotenv/config';
import { PrismaClient, SubscriptionTier, TaskType, Priority } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { createDefaultFoldersForTenant } from '../lib/document-folders';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// System Task Templates for Property Management
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

async function seedTaskTemplates() {
  console.log('📋 Seeding Task Templates...');

  // Delete existing system templates
  await prisma.taskTemplate.deleteMany({
    where: { isSystem: true },
  });

  // Create new system templates
  for (const template of systemTaskTemplates) {
    await prisma.taskTemplate.create({
      data: {
        userId: null, // System templates have no owner
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

  console.log(`✅ Created ${systemTaskTemplates.length} system task templates`);
}

async function main() {
  console.log('🌱 Starting seed...');

  // --- 1. SETUP USERS (Login Accounts) ---

  const landlordPassword = await bcrypt.hash('Demo@123', 10);
  const tenantPassword = await bcrypt.hash('Tenant@123', 10);
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  // Super Admin
  await prisma.user.upsert({
    where: { email: 'admin@propertycrm.com' },
    update: {},
    create: {
      email: 'admin@propertycrm.com',
      password: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      subscriptionTier: SubscriptionTier.ENTERPRISE,
      subscriptionStatus: 'ACTIVE',
      emailVerified: true,
    },
  });

  // Landlord (The "Customer")
  const landlordUser = await prisma.user.upsert({
    where: { email: 'demo@propertycrm.com' },
    update: {},
    create: {
      email: 'demo@propertycrm.com',
      password: landlordPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: 'CUSTOMER',
      accountType: 'INDIVIDUAL',
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      subscriptionStatus: 'ACTIVE',
      emailVerified: true,
      propertyLimit: 20,
    },
  });

  // Tenant (The Login Account)
  // This creates the ability to log in, but doesn't contain the "Tenant Profile" data yet
  await prisma.user.upsert({
    where: { email: 'john.smith@example.com' },
    update: {},
    create: {
      email: 'john.smith@example.com',
      password: tenantPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'TENANT',
      accountType: 'TENANT',
      subscriptionTier: SubscriptionTier.FREE,
      subscriptionStatus: 'ACTIVE',
      emailVerified: true,
    },
  });

  // --- 2. CLEANUP OLD DATA ---
  // We delete children first to satisfy Foreign Key constraints
  console.log('🧹 Cleaning up...');

  const landlordId = landlordUser.id;

  // Delete items owned by the landlord
  await prisma.booking.deleteMany({ where: { userId: landlordId } });
  await prisma.inquiry.deleteMany({ where: { userId: landlordId } });
  await prisma.maintenanceRequest.deleteMany({ where: { userId: landlordId } });
  await prisma.task.deleteMany({ where: { userId: landlordId } });
  await prisma.tenant.deleteMany({ where: { userId: landlordId } }); // Deletes the Tenant Profiles
  await prisma.property.deleteMany({ where: { userId: landlordId } });

  console.log('🏗️ Creating Properties...');

  // --- 3. CREATE PROPERTIES ---

  const property1 = await prisma.property.create({
    data: {
      userId: landlordId,
      name: 'Modern 2BR Apartment in Sandton',
      description:
        'Spacious family home with a beautiful garden. Close to schools, shopping centers, and the beach. Ideal for long-term family rentals.',
      propertyType: 'HOUSE',
      address: '45 Ocean View Road',
      city: 'Durban',
      province: 'KwaZulu-Natal',
      postalCode: '4051',
      country: 'South Africa',
      bedrooms: 3,
      bathrooms: 2,
      size: 180,
      furnished: false,
      parkingSpaces: 2,
      rentalType: 'LONG_TERM',
      monthlyRent: 12000,
      securityDeposit: 24000,
      amenities: ['garden', 'garage', 'security', 'pool'],
      isAvailable: true,
      petsAllowed: true,
      smokingAllowed: false,
      status: 'ACTIVE',
    },
  });

  const property2 = await prisma.property.create({
    data: {
      userId: landlordId,
      name: 'Cozy 3BR Family Home',
      description:
        'Beautiful modern apartment with stunning city views. Perfect for business travelers and tourists looking for a comfortable stay in the heart of Sandton.',
      propertyType: 'APARTMENT',
      address: '123 Sandton Drive',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2196',
      country: 'South Africa',
      bedrooms: 2,
      bathrooms: 2,
      size: 85,
      furnished: true,
      parkingSpaces: 1,
      rentalType: 'BOTH',
      monthlyRent: 15000,
      dailyRate: 800,
      weeklyRate: 5000,
      cleaningFee: 350,
      securityDeposit: 15000,
      amenities: ['wifi', 'pool', 'gym', 'security', 'aircon', 'balcony'],
      isAvailable: true,
      minimumStay: 2,
      maximumStay: 30,
      petsAllowed: false,
      smokingAllowed: false,
      checkInTime: '14:00',
      checkOutTime: '10:00',
      status: 'ACTIVE',
    },
  });

  console.log('👤 Creating Tenant Profile...');

  // --- 4. CREATE TENANT PROFILE ---

  // This is the record defined in your Schema.
  // It belongs to the Landlord (userId = landlordId).
  // It links to the Tenant Login via the 'email' string.
  const tenantProfile = await prisma.tenant.create({
    data: {
      userId: landlordId, // IMPORTANT: This links the tenant to the Landlord's dashboard
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com', // IMPORTANT: This matches the User Login email
      phone: '+27829876543',
      idNumber: '8501015800086',
      dateOfBirth: new Date('1985-01-01'),
      employmentStatus: 'EMPLOYED',
      monthlyIncome: 45000,
      tenantType: 'TENANT',
      status: 'ACTIVE',
    },
  });

  console.log('📁 Creating default document folders for tenant...');
  await createDefaultFoldersForTenant(prisma, landlordId, tenantProfile.id, property1.id);

  // Seed task templates
  await seedTaskTemplates();

  console.log('📅 Creating Bookings & Maintenance...');

  // --- 5. CREATE RELATIONS (Booking & Maintenance) ---

  // Create a Booking linked to BOTH the Landlord and the Tenant Profile
  await prisma.booking.create({
    data: {
      userId: landlordId, // Belongs to Landlord
      propertyId: property1.id, // Relates to Property
      tenantId: tenantProfile.id, // *** CRITICAL: Links to the Tenant Profile we just created

      bookingReference: 'BK-2025-001',
      bookingType: 'SHORT_TERM',
      checkInDate: new Date('2025-04-20'),
      checkOutDate: new Date('2025-04-27'),
      numberOfNights: 7,

      // Guest details (redundant but often kept for historical records)
      guestName: 'John Smith',
      guestEmail: 'john.smith@example.com',
      guestPhone: '+27829876543',
      numberOfGuests: 2,

      baseRate: 5600,
      totalAmount: 6450,
      amountPaid: 6450,
      amountDue: 0,
      paymentStatus: 'PAID',
      paymentMethod: 'CREDIT_CARD',
      status: 'CONFIRMED',
    },
  });

  // Create a Maintenance Request linked to the Tenant
  await prisma.maintenanceRequest.create({
    data: {
      userId: landlordId,
      propertyId: property2.id, // Assuming he rents this one too, or just reporting it
      tenantId: tenantProfile.id, // *** CRITICAL: Links to Tenant Profile

      title: 'Leaking tap in main bathroom',
      description: 'Hot water tap leaking...',
      category: 'PLUMBING',
      priority: 'NORMAL',
      location: 'Main Bathroom',
      status: 'PENDING',
      estimatedCost: 500,
    },
  });

  // Create Inquiry (Unlinked to tenant profile, just a stranger)
  await prisma.inquiry.create({
    data: {
      userId: landlordId,
      propertyId: property1.id,
      inquirySource: 'WEBSITE',
      inquiryType: 'BOOKING',
      contactName: 'Michael Brown',
      contactEmail: 'michael.b@example.com',
      contactPhone: '+27847654321',
      message: 'Is this available?',
      checkInDate: new Date('2025-01-15'),
      checkOutDate: new Date('2025-01-22'),
      numberOfGuests: 3,
      status: 'NEW',
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
