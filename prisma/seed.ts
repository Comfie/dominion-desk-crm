import 'dotenv/config';
import {
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  PrismaClient,
  Priority,
  PropertyType,
  RentalType,
  SubscriptionTier,
  TaskType,
  TenantType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { createDefaultFoldersForTenant } from '../lib/document-folders';
import { generateTenantPassword } from '../lib/password-generator';
import { saveBankingDetails } from '../lib/services/banking-encryption.service';
import { initializeDefaultSettings } from '../lib/services/system-settings.service';

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

async function resetDatabase() {
  console.log('🧹 Cleaning up existing database data...');

  await prisma.$executeRawUnsafe(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename NOT IN (
            '_prisma_migrations',
            'spatial_ref_sys',
            'geometry_columns',
            'geography_columns',
            'raster_columns',
            'raster_overviews'
          )
      )
      LOOP
        EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', r.tablename);
      END LOOP;
    END $$;
  `);

  console.log('✅ Database cleared');
}

async function createTenantPortalUser(details: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  const password = generateTenantPassword(details.firstName, details.lastName);
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: details.email },
    update: {
      password: hashedPassword,
      firstName: details.firstName,
      lastName: details.lastName,
      phone: details.phone || '',
      accountType: 'TENANT',
      role: 'TENANT',
      isActive: true,
      isFirstLogin: true,
      emailVerified: false,
      requirePasswordChange: true,
      propertyLimit: 0,
    },
    create: {
      email: details.email,
      password: hashedPassword,
      firstName: details.firstName,
      lastName: details.lastName,
      phone: details.phone || '',
      accountType: 'TENANT',
      role: 'TENANT',
      isActive: true,
      isFirstLogin: true,
      emailVerified: false,
      requirePasswordChange: true,
      propertyLimit: 0,
      subscriptionTier: SubscriptionTier.FREE,
      subscriptionStatus: 'ACTIVE',
    },
  });

  return password;
}

export async function main() {
  console.log('🌱 Starting seed...');
  await resetDatabase();

  // --- 1. SETUP USERS (Login Accounts) ---
  // Quick test login sheet:
  // - admin01.propertycrm@mailinator.com / Admin@123 / SUPER_ADMIN
  // - demo01.propertycrm@mailinator.com / Demo@123 / CUSTOMER
  // - john.smith.propertycrm@mailinator.com / Tenant@123 / TENANT
  // - landlord.propertycrm@mailinator.com / password123 / CUSTOMER
  // - sarah.johnson.propertycrm@mailinator.com / SarahJohnson2026! / TENANT
  // - michael.brown.propertycrm@mailinator.com / MichaelBrown2026! / TENANT
  // - emma.davis.propertycrm@mailinator.com / EmmaDavis2026! / TENANT
  // - james.wilson.propertycrm@mailinator.com / JamesWilson2026! / TENANT
  // - robert.taylor.propertycrm@mailinator.com / RobertTaylor2026! / TENANT
  // - lisa.anderson.propertycrm@mailinator.com / LisaAnderson2026! / TENANT
  // Password format for generated tenant portal users:
  // - FirstLast2026! (generated at runtime from first/last name and current year)

  const landlordPassword = await bcrypt.hash('Demo@123', 10);
  const tenantPassword = await bcrypt.hash('Tenant@123', 10);
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  // Super Admin
  await prisma.user.upsert({
    where: { email: 'admin01.propertycrm@mailinator.com' },
    update: {},
    create: {
      email: 'admin01.propertycrm@mailinator.com',
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
    where: { email: 'demo01.propertycrm@mailinator.com' },
    update: {},
    create: {
      email: 'demo01.propertycrm@mailinator.com',
      password: landlordPassword,
      firstName: 'Demo',
      lastName: 'User',
      phone: '+27821234567',
      role: 'CUSTOMER',
      accountType: 'INDIVIDUAL',
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      subscriptionStatus: 'ACTIVE',
      emailVerified: true,
      propertyLimit: 20,
    },
  });

  // Save encrypted banking details for landlord
  console.log('🔐 Saving encrypted banking details for landlord...');
  await saveBankingDetails(landlordUser.id, {
    bankName: 'First National Bank',
    bankAccountName: 'Demo User Properties',
    bankAccountNumber: '62012345678',
    bankBranchCode: '250655',
    paymentInstructions:
      'Please use your payment reference as the bank reference when making EFT payments.',
  });

  // Tenant (The Login Account)
  // This creates the ability to log in, but doesn't contain the "Tenant Profile" data yet
  // IMPORTANT: The email must match the Tenant Profile email for the portal to work
  await prisma.user.upsert({
    where: { email: 'john.smith.propertycrm@mailinator.com' },
    update: {},
    create: {
      email: 'john.smith.propertycrm@mailinator.com',
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

  const landlordId = landlordUser.id;

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
      email: 'john.smith.propertycrm@mailinator.com', // IMPORTANT: This matches the User Login email
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

  console.log('🔗 Creating Property-Tenant Relationship...');

  // Create PropertyTenant relationship (links tenant to property with lease details)
  await prisma.propertyTenant.create({
    data: {
      userId: landlordId,
      propertyId: property1.id,
      tenantId: tenantProfile.id,
      leaseStartDate: new Date('2024-01-01'),
      leaseEndDate: new Date('2025-12-31'),
      monthlyRent: 12000,
      depositPaid: 24000,
      isActive: true,
      moveInDate: new Date('2024-01-01'),
    },
  });

  console.log('💰 Creating Payments for testing proof upload...');

  // Create multiple payments with different statuses for testing
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Payment 1: PAID (completed payment from last month)
  await prisma.payment.create({
    data: {
      userId: landlordId,
      tenantId: tenantProfile.id,
      propertyId: property1.id,
      paymentReference: `PAY-${Date.now()}-0001`,
      paymentType: 'RENT',
      amount: 12000,
      currency: 'ZAR',
      paymentMethod: 'EFT',
      paymentDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 5),
      dueDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
      status: 'PAID',
      description: `Rent for ${lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
    },
  });

  // Payment 2: OVERDUE (past due date, needs proof upload)
  await prisma.payment.create({
    data: {
      userId: landlordId,
      tenantId: tenantProfile.id,
      propertyId: property1.id,
      paymentReference: `PAY-${Date.now()}-0002`,
      paymentType: 'RENT',
      amount: 12000,
      currency: 'ZAR',
      dueDate: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1),
      status: 'OVERDUE',
      description: `Rent for ${thisMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
    },
  });

  // Payment 3: PENDING (upcoming payment, can upload proof early)
  await prisma.payment.create({
    data: {
      userId: landlordId,
      tenantId: tenantProfile.id,
      propertyId: property1.id,
      paymentReference: `PAY-${Date.now()}-0003`,
      paymentType: 'RENT',
      amount: 12000,
      currency: 'ZAR',
      dueDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1),
      status: 'PENDING',
      description: `Rent for ${nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
    },
  });

  // Payment 4: PENDING (utilities)
  await prisma.payment.create({
    data: {
      userId: landlordId,
      tenantId: tenantProfile.id,
      propertyId: property1.id,
      paymentReference: `PAY-${Date.now()}-0004`,
      paymentType: 'UTILITIES',
      amount: 850,
      currency: 'ZAR',
      dueDate: new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 15),
      status: 'PENDING',
      description: 'Electricity & Water - January 2025',
    },
  });

  // Seed task templates
  await seedTaskTemplates();

  // Initialize system settings (including payment transaction fee)
  console.log('⚙️  Initializing system settings...');
  await initializeDefaultSettings();

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
      guestEmail: 'john.smith.propertycrm@mailinator.com',
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
      contactEmail: 'michael.b.propertycrm@mailinator.com',
      contactPhone: '+27847654321',
      message: 'Is this available?',
      checkInDate: new Date('2025-01-15'),
      checkOutDate: new Date('2025-01-22'),
      numberOfGuests: 3,
      status: 'NEW',
    },
  });

  {
    console.log('💳 Creating landlord test workspace...');

    const paymentLandlordPassword = await bcrypt.hash('password123', 10);
    const paymentLandlord = await prisma.user.upsert({
      where: { email: 'landlord.propertycrm@mailinator.com' },
      update: {
        password: paymentLandlordPassword,
        firstName: 'John',
        lastName: 'Landlord',
        phone: '+27 82 123 4567',
        role: 'CUSTOMER',
        accountType: 'INDIVIDUAL',
        subscriptionTier: SubscriptionTier.PROFESSIONAL,
        subscriptionStatus: 'ACTIVE',
        emailVerified: true,
        rentalDueDay: 1,
        propertyLimit: 20,
      },
      create: {
        email: 'landlord.propertycrm@mailinator.com',
        password: paymentLandlordPassword,
        firstName: 'John',
        lastName: 'Landlord',
        phone: '+27 82 123 4567',
        role: 'CUSTOMER',
        accountType: 'INDIVIDUAL',
        subscriptionTier: SubscriptionTier.PROFESSIONAL,
        subscriptionStatus: 'ACTIVE',
        emailVerified: true,
        rentalDueDay: 1,
        propertyLimit: 20,
      },
    });

    console.log('👥 Creating tenant portal accounts...');
    const paymentTenantSeeds: Array<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      tenantType: TenantType;
      status: 'ACTIVE';
      employmentStatus: 'EMPLOYED' | 'STUDENT' | 'SELF_EMPLOYED';
      employer?: string;
      monthlyIncome?: number;
      monthlyRent: number;
      paymentDueDay: number;
      autoSendReminder: boolean;
      reminderDaysBefore?: number;
    }> = [
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson.propertycrm@mailinator.com',
        phone: '+27 83 111 2222',
        tenantType: TenantType.TENANT,
        status: 'ACTIVE',
        employmentStatus: 'EMPLOYED',
        employer: 'Tech Corp',
        monthlyIncome: 25000,
        monthlyRent: 8500,
        paymentDueDay: 1,
        autoSendReminder: true,
        reminderDaysBefore: 3,
      },
      {
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown.propertycrm@mailinator.com',
        phone: '+27 84 222 3333',
        tenantType: TenantType.TENANT,
        status: 'ACTIVE',
        employmentStatus: 'STUDENT',
        monthlyRent: 5000,
        paymentDueDay: 1,
        autoSendReminder: true,
      },
      {
        firstName: 'Emma',
        lastName: 'Davis',
        email: 'emma.davis.propertycrm@mailinator.com',
        phone: '+27 85 333 4444',
        tenantType: TenantType.TENANT,
        status: 'ACTIVE',
        employmentStatus: 'STUDENT',
        monthlyRent: 5000,
        paymentDueDay: 1,
        autoSendReminder: true,
      },
      {
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james.wilson.propertycrm@mailinator.com',
        phone: '+27 86 444 5555',
        tenantType: TenantType.TENANT,
        status: 'ACTIVE',
        employmentStatus: 'STUDENT',
        monthlyRent: 5000,
        paymentDueDay: 1,
        autoSendReminder: true,
      },
      {
        firstName: 'Robert',
        lastName: 'Taylor',
        email: 'robert.taylor.propertycrm@mailinator.com',
        phone: '+27 87 555 6666',
        tenantType: TenantType.TENANT,
        status: 'ACTIVE',
        employmentStatus: 'SELF_EMPLOYED',
        monthlyRent: 12000,
        paymentDueDay: 1,
        autoSendReminder: true,
      },
      {
        firstName: 'Lisa',
        lastName: 'Anderson',
        email: 'lisa.anderson.propertycrm@mailinator.com',
        phone: '+27 88 666 7777',
        tenantType: TenantType.TENANT,
        status: 'ACTIVE',
        employmentStatus: 'EMPLOYED',
        monthlyRent: 6000,
        paymentDueDay: 1,
        autoSendReminder: true,
      },
    ];

    const paymentTenantRecords = await Promise.all(
      paymentTenantSeeds.map(async (seed) => {
        const password = await createTenantPortalUser({
          email: seed.email,
          firstName: seed.firstName,
          lastName: seed.lastName,
          phone: seed.phone,
        });

        const tenant = await prisma.tenant.create({
          data: {
            userId: paymentLandlord.id,
            firstName: seed.firstName,
            lastName: seed.lastName,
            email: seed.email,
            phone: seed.phone,
            tenantType: seed.tenantType,
            status: seed.status,
            employmentStatus: seed.employmentStatus,
            employer: seed.employer,
            monthlyIncome: seed.monthlyIncome,
            monthlyRent: seed.monthlyRent,
            paymentDueDay: seed.paymentDueDay,
            autoSendReminder: seed.autoSendReminder,
            reminderDaysBefore: seed.reminderDaysBefore,
          },
        });

        return { ...seed, password, tenant };
      })
    );

    const [
      paymentTenant1,
      paymentTenant2,
      paymentTenant3,
      paymentTenant4,
      paymentTenant5,
      paymentTenant6,
    ] = paymentTenantRecords.map((record) => record.tenant);
    const paymentTenantReferenceKeys = new Map(
      paymentTenantRecords.map(({ tenant, firstName, lastName }, index) => [
        tenant.id,
        `${firstName}${lastName}${index + 1}`.replace(/[^A-Za-z0-9]/g, '').toUpperCase(),
      ])
    );
    const getTenantReferenceKey = (tenantId: string) =>
      paymentTenantReferenceKeys.get(tenantId) ?? tenantId.slice(-8).toUpperCase();

    console.log('🏘️  Creating landlord test properties...');
    const paymentProperties = await Promise.all([
      prisma.property.create({
        data: {
          userId: paymentLandlord.id,
          name: '12 Ocean View Apartments',
          description: 'Modern 2-bedroom apartment with sea views',
          propertyType: PropertyType.APARTMENT,
          address: '12 Beach Road',
          city: 'Cape Town',
          province: 'Western Cape',
          postalCode: '8001',
          bedrooms: 2,
          bathrooms: 1,
          parkingSpaces: 1,
          rentalType: RentalType.LONG_TERM,
          monthlyRent: 8500,
          isAvailable: false,
          status: 'ACTIVE',
          allowsMultipleTenants: false,
        },
      }),
      prisma.property.create({
        data: {
          userId: paymentLandlord.id,
          name: '45 Student House',
          description: 'Large house divided into 3 units for students',
          propertyType: PropertyType.HOUSE,
          address: '45 University Avenue',
          city: 'Stellenbosch',
          province: 'Western Cape',
          postalCode: '7600',
          bedrooms: 6,
          bathrooms: 3,
          parkingSpaces: 2,
          rentalType: RentalType.LONG_TERM,
          monthlyRent: 15000,
          isAvailable: false,
          status: 'ACTIVE',
          allowsMultipleTenants: true,
        },
      }),
      prisma.property.create({
        data: {
          userId: paymentLandlord.id,
          name: '7 Sunset Townhouse',
          description: 'Beautiful 3-bedroom townhouse',
          propertyType: PropertyType.TOWNHOUSE,
          address: '7 Sunset Boulevard',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2000',
          bedrooms: 3,
          bathrooms: 2,
          parkingSpaces: 2,
          rentalType: RentalType.LONG_TERM,
          monthlyRent: 12000,
          isAvailable: false,
          status: 'ACTIVE',
          allowsMultipleTenants: false,
        },
      }),
      prisma.property.create({
        data: {
          userId: paymentLandlord.id,
          name: '22 Garden Cottage',
          description: 'Charming cottage in quiet neighborhood',
          propertyType: PropertyType.COTTAGE,
          address: '22 Rose Street',
          city: 'Durban',
          province: 'KwaZulu-Natal',
          postalCode: '4001',
          bedrooms: 1,
          bathrooms: 1,
          parkingSpaces: 1,
          rentalType: RentalType.LONG_TERM,
          monthlyRent: 6000,
          isAvailable: false,
          status: 'ACTIVE',
          allowsMultipleTenants: false,
        },
      }),
    ]);
    console.log(`✅ Created ${paymentProperties.length} landlord test properties`);

    console.log('🏠 Assigning tenant portal users to properties...');
    const paymentCurrentDate = new Date();
    const paymentCurrentMonth = paymentCurrentDate.getMonth();
    const paymentCurrentYear = paymentCurrentDate.getFullYear();
    const paymentLeaseStartDate = new Date(paymentCurrentYear, paymentCurrentMonth - 6, 1);
    const paymentIn15Days = new Date(
      paymentCurrentDate.getFullYear(),
      paymentCurrentDate.getMonth(),
      paymentCurrentDate.getDate() + 15
    );
    const paymentIn45Days = new Date(
      paymentCurrentDate.getFullYear(),
      paymentCurrentDate.getMonth(),
      paymentCurrentDate.getDate() + 45
    );
    const paymentIn75Days = new Date(
      paymentCurrentDate.getFullYear(),
      paymentCurrentDate.getMonth(),
      paymentCurrentDate.getDate() + 75
    );
    const paymentIn120Days = new Date(
      paymentCurrentDate.getFullYear(),
      paymentCurrentDate.getMonth(),
      paymentCurrentDate.getDate() + 120
    );
    const paymentExpired5DaysAgo = new Date(
      paymentCurrentDate.getFullYear(),
      paymentCurrentDate.getMonth(),
      paymentCurrentDate.getDate() - 5
    );

    await prisma.propertyTenant.create({
      data: {
        userId: paymentLandlord.id,
        propertyId: paymentProperties[0].id,
        tenantId: paymentTenant1.id,
        leaseStartDate: paymentLeaseStartDate,
        leaseEndDate: paymentIn15Days,
        monthlyRent: 8500,
        depositPaid: 8500,
        isActive: true,
        moveInDate: paymentLeaseStartDate,
      },
    });

    await prisma.propertyTenant.createMany({
      data: [
        {
          userId: paymentLandlord.id,
          propertyId: paymentProperties[1].id,
          tenantId: paymentTenant2.id,
          unitLabel: 'Room A',
          leaseStartDate: paymentLeaseStartDate,
          leaseEndDate: paymentIn120Days,
          monthlyRent: 5000,
          depositPaid: 5000,
          isActive: true,
          moveInDate: paymentLeaseStartDate,
        },
        {
          userId: paymentLandlord.id,
          propertyId: paymentProperties[1].id,
          tenantId: paymentTenant3.id,
          unitLabel: 'Room B',
          leaseStartDate: paymentLeaseStartDate,
          leaseEndDate: paymentIn45Days,
          monthlyRent: 5000,
          depositPaid: 5000,
          isActive: true,
          moveInDate: paymentLeaseStartDate,
        },
        {
          userId: paymentLandlord.id,
          propertyId: paymentProperties[1].id,
          tenantId: paymentTenant4.id,
          unitLabel: 'Room C',
          leaseStartDate: paymentLeaseStartDate,
          leaseEndDate: paymentExpired5DaysAgo,
          monthlyRent: 5000,
          depositPaid: 5000,
          isActive: true,
          moveInDate: paymentLeaseStartDate,
        },
      ],
    });

    await prisma.propertyTenant.create({
      data: {
        userId: paymentLandlord.id,
        propertyId: paymentProperties[2].id,
        tenantId: paymentTenant5.id,
        leaseStartDate: paymentLeaseStartDate,
        leaseEndDate: paymentIn75Days,
        monthlyRent: 12000,
        depositPaid: 12000,
        isActive: true,
        moveInDate: paymentLeaseStartDate,
      },
    });

    await prisma.propertyTenant.create({
      data: {
        userId: paymentLandlord.id,
        propertyId: paymentProperties[3].id,
        tenantId: paymentTenant6.id,
        leaseStartDate: new Date(paymentCurrentYear, paymentCurrentMonth - 1, 1),
        leaseEndDate: paymentIn45Days,
        monthlyRent: 6000,
        depositPaid: 6000,
        isActive: true,
        moveInDate: new Date(paymentCurrentYear, paymentCurrentMonth - 1, 1),
      },
    });

    console.log('💰 Creating payment history...');
    const payments: Array<{
      userId: string;
      tenantId: string;
      propertyId: string;
      paymentReference: string;
      paymentType: PaymentType;
      amount: number;
      currency: string;
      dueDate: Date;
      paymentDate?: Date | null;
      paymentMethod?: PaymentMethod | null;
      status: PaymentStatus;
      invoiceNumber: string;
      description: string;
    }> = [];

    const createPayments = (
      tenantId: string,
      propertyId: string,
      monthlyRent: number,
      paymentBehavior: 'excellent' | 'good' | 'late' | 'very-late',
      monthsBack: number = 6
    ) => {
      for (let i = monthsBack - 1; i >= 1; i--) {
        const month = paymentCurrentMonth - i;
        const year = month < 0 ? paymentCurrentYear - 1 : paymentCurrentYear;
        const adjustedMonth = month < 0 ? month + 12 : month;

        const dueDate = new Date(year, adjustedMonth, 1);
        const monthNames = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];

        let paymentDate: Date | null = null;
        let status: PaymentStatus = PaymentStatus.PENDING;
        let paymentMethod: PaymentMethod | null = null;

        switch (paymentBehavior) {
          case 'excellent':
            paymentDate = new Date(year, adjustedMonth, 0, 29 - Math.floor(Math.random() * 2));
            status = PaymentStatus.PAID;
            paymentMethod = PaymentMethod.EFT;
            break;
          case 'good': {
            const daysLate = Math.floor(Math.random() * 4);
            paymentDate = new Date(year, adjustedMonth, 1 + daysLate);
            status = PaymentStatus.PAID;
            paymentMethod = PaymentMethod.EFT;
            break;
          }
          case 'late': {
            const lateBy = 5 + Math.floor(Math.random() * 10);
            paymentDate = new Date(year, adjustedMonth, 1 + lateBy);
            status = PaymentStatus.PAID;
            paymentMethod = PaymentMethod.CASH;
            break;
          }
          case 'very-late':
            if (Math.random() > 0.3) {
              const veryLate = 15 + Math.floor(Math.random() * 15);
              paymentDate = new Date(year, adjustedMonth, 1 + veryLate);
              status = PaymentStatus.PAID;
              paymentMethod = PaymentMethod.CASH;
            } else {
              status = PaymentStatus.OVERDUE;
            }
            break;
        }

        payments.push({
          userId: paymentLandlord.id,
          tenantId,
          propertyId,
          paymentReference: `PAY-${year}${String(adjustedMonth + 1).padStart(2, '0')}-${getTenantReferenceKey(
            tenantId
          )}`,
          paymentType: PaymentType.RENT,
          amount: monthlyRent,
          currency: 'ZAR',
          dueDate,
          paymentDate,
          paymentMethod,
          status,
          invoiceNumber: `INV-${year}${String(adjustedMonth + 1).padStart(2, '0')}-${getTenantReferenceKey(
            tenantId
          )}`,
          description: `Monthly rent for ${monthNames[adjustedMonth]} ${year}`,
        });
      }
    };

    createPayments(paymentTenant1.id, paymentProperties[0].id, 8500, 'excellent');
    createPayments(paymentTenant2.id, paymentProperties[1].id, 5000, 'good');
    createPayments(paymentTenant3.id, paymentProperties[1].id, 5000, 'excellent');
    createPayments(paymentTenant4.id, paymentProperties[1].id, 5000, 'late');
    createPayments(paymentTenant5.id, paymentProperties[2].id, 12000, 'very-late');
    createPayments(paymentTenant6.id, paymentProperties[3].id, 6000, 'good', 2);

    await prisma.payment.createMany({ data: payments });
    console.log(`✅ Created ${payments.length} payment records`);

    console.log('📅 Creating current month payments...');
    const currentMonthPayments = [
      {
        userId: paymentLandlord.id,
        tenantId: paymentTenant1.id,
        propertyId: paymentProperties[0].id,
        paymentReference: `PAY-${paymentCurrentYear}${String(paymentCurrentMonth + 1).padStart(2, '0')}-${getTenantReferenceKey(
          paymentTenant1.id
        )}`,
        paymentType: PaymentType.RENT,
        amount: 8500,
        currency: 'ZAR',
        dueDate: new Date(paymentCurrentYear, paymentCurrentMonth, 1),
        paymentDate: new Date(paymentCurrentYear, paymentCurrentMonth - 1, 30),
        paymentMethod: PaymentMethod.EFT,
        status: PaymentStatus.PAID,
        invoiceNumber: `INV-${paymentCurrentYear}${String(paymentCurrentMonth + 1).padStart(2, '0')}-${getTenantReferenceKey(
          paymentTenant1.id
        )}`,
        description: `Monthly rent for ${new Date(
          paymentCurrentYear,
          paymentCurrentMonth
        ).toLocaleString('default', { month: 'long' })} ${paymentCurrentYear}`,
      },
      {
        userId: paymentLandlord.id,
        tenantId: paymentTenant2.id,
        propertyId: paymentProperties[1].id,
        paymentReference: `PAY-${paymentCurrentYear}${String(paymentCurrentMonth + 1).padStart(2, '0')}-${getTenantReferenceKey(
          paymentTenant2.id
        )}`,
        paymentType: PaymentType.RENT,
        amount: 5000,
        currency: 'ZAR',
        dueDate: new Date(paymentCurrentYear, paymentCurrentMonth, 1),
        paymentDate: new Date(paymentCurrentYear, paymentCurrentMonth, 2),
        paymentMethod: PaymentMethod.EFT,
        status: PaymentStatus.PAID,
        invoiceNumber: `INV-${paymentCurrentYear}${String(paymentCurrentMonth + 1).padStart(2, '0')}-${getTenantReferenceKey(
          paymentTenant2.id
        )}-RoomA`,
        description: `Monthly rent for ${new Date(
          paymentCurrentYear,
          paymentCurrentMonth
        ).toLocaleString('default', {
          month: 'long',
        })} ${paymentCurrentYear} - 45 Student House (Room A)`,
      },
      {
        userId: paymentLandlord.id,
        tenantId: paymentTenant3.id,
        propertyId: paymentProperties[1].id,
        paymentReference: `PAY-${paymentCurrentYear}${String(paymentCurrentMonth + 1).padStart(2, '0')}-${getTenantReferenceKey(
          paymentTenant3.id
        )}`,
        paymentType: PaymentType.RENT,
        amount: 5000,
        currency: 'ZAR',
        dueDate: new Date(paymentCurrentYear, paymentCurrentMonth, 1),
        status: PaymentStatus.PENDING,
        invoiceNumber: `INV-${paymentCurrentYear}${String(paymentCurrentMonth + 1).padStart(2, '0')}-${getTenantReferenceKey(
          paymentTenant3.id
        )}-RoomB`,
        description: `Monthly rent for ${new Date(
          paymentCurrentYear,
          paymentCurrentMonth
        ).toLocaleString('default', {
          month: 'long',
        })} ${paymentCurrentYear} - 45 Student House (Room B)`,
      },
      {
        userId: paymentLandlord.id,
        tenantId: paymentTenant4.id,
        propertyId: paymentProperties[1].id,
        paymentReference: `PAY-${paymentCurrentYear}${String(paymentCurrentMonth + 1).padStart(2, '0')}-${getTenantReferenceKey(
          paymentTenant4.id
        )}`,
        paymentType: PaymentType.RENT,
        amount: 5000,
        currency: 'ZAR',
        dueDate: new Date(paymentCurrentYear, paymentCurrentMonth, 1),
        status: PaymentStatus.OVERDUE,
        invoiceNumber: `INV-${paymentCurrentYear}${String(paymentCurrentMonth + 1).padStart(2, '0')}-${getTenantReferenceKey(
          paymentTenant4.id
        )}-RoomC`,
        description: `Monthly rent for ${new Date(
          paymentCurrentYear,
          paymentCurrentMonth
        ).toLocaleString('default', {
          month: 'long',
        })} ${paymentCurrentYear} - 45 Student House (Room C)`,
      },
      {
        userId: paymentLandlord.id,
        tenantId: paymentTenant5.id,
        propertyId: paymentProperties[2].id,
        paymentReference: `PAY-${paymentCurrentYear}${String(paymentCurrentMonth + 1).padStart(2, '0')}-${getTenantReferenceKey(
          paymentTenant5.id
        )}`,
        paymentType: PaymentType.RENT,
        amount: 12000,
        currency: 'ZAR',
        dueDate: new Date(paymentCurrentYear, paymentCurrentMonth, 1),
        status: PaymentStatus.OVERDUE,
        invoiceNumber: `INV-${paymentCurrentYear}${String(paymentCurrentMonth + 1).padStart(2, '0')}-${getTenantReferenceKey(
          paymentTenant5.id
        )}`,
        description: `Monthly rent for ${new Date(
          paymentCurrentYear,
          paymentCurrentMonth
        ).toLocaleString('default', { month: 'long' })} ${paymentCurrentYear}`,
      },
      {
        userId: paymentLandlord.id,
        tenantId: paymentTenant6.id,
        propertyId: paymentProperties[3].id,
        paymentReference: `PAY-${paymentCurrentYear}${String(paymentCurrentMonth + 1).padStart(2, '0')}-${getTenantReferenceKey(
          paymentTenant6.id
        )}`,
        paymentType: PaymentType.RENT,
        amount: 6000,
        currency: 'ZAR',
        dueDate: new Date(paymentCurrentYear, paymentCurrentMonth, 1),
        status: PaymentStatus.PENDING_VERIFICATION,
        proofOfPaymentUrl: 'https://uploadthing.com/mock-proof.pdf',
        proofOfPaymentName: 'proof-of-payment.pdf',
        proofUploadedAt: new Date(paymentCurrentYear, paymentCurrentMonth, 3),
        invoiceNumber: `INV-${paymentCurrentYear}${String(paymentCurrentMonth + 1).padStart(2, '0')}-${getTenantReferenceKey(
          paymentTenant6.id
        )}`,
        description: `Monthly rent for ${new Date(
          paymentCurrentYear,
          paymentCurrentMonth
        ).toLocaleString('default', { month: 'long' })} ${paymentCurrentYear}`,
      },
    ];

    await prisma.payment.createMany({ data: currentMonthPayments });
    console.log(`✅ Created ${currentMonthPayments.length} current month payments`);

    console.log('📊 Payment test summary:');
    console.log(`   Landlord: ${paymentLandlord.email} / password123`);
    console.log('   Tenant portal accounts:');
    for (const tenantRecord of paymentTenantRecords) {
      console.log(`   - ${tenantRecord.email} / ${tenantRecord.password}`);
    }
    console.log(`   Properties: ${paymentProperties.length}`);
  }

  console.log('✅ Database seeded successfully!');
}

export async function runSeed() {
  try {
    await main();
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

if (require.main === module) {
  runSeed().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
