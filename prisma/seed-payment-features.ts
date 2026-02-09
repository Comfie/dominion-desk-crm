/**
 * Seed script for Payment Tracking & Invoicing Features
 *
 * Creates realistic test data for:
 * - Rent Collection Hub testing
 * - Manual invoice creation
 * - Tenant payment ledger
 * - Payment behavior tracking
 * - Multi-tenant properties with various payment states
 */

import 'dotenv/config';
import {
  PrismaClient,
  PaymentStatus,
  PaymentType,
  PropertyType,
  RentalType,
  TenantType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed for Payment Tracking Features...\n');

  // Clean existing data (be careful - this deletes everything!)
  console.log('🗑️  Cleaning existing data...');
  await prisma.payment.deleteMany();
  await prisma.propertyTenant.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany({ where: { role: 'CUSTOMER' } });

  // Create landlord user
  console.log('👤 Creating landlord user...');
  const landlord = await prisma.user.create({
    data: {
      email: 'landlord@test.com',
      password: await bcrypt.hash('password123', 10),
      firstName: 'John',
      lastName: 'Landlord',
      phone: '+27 82 123 4567',
      role: 'CUSTOMER',
      accountType: 'INDIVIDUAL',
      subscriptionTier: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
      emailVerified: true,
      rentalDueDay: 1, // Rent due on 1st of each month
      propertyLimit: 20,
    },
  });
  console.log(`✅ Created landlord: ${landlord.email}\n`);

  // Create properties
  console.log('🏘️  Creating properties...');

  const properties = await Promise.all([
    // Property 1: Single-tenant apartment - All paid
    prisma.property.create({
      data: {
        userId: landlord.id,
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

    // Property 2: Multi-tenant house - Mixed payment status
    prisma.property.create({
      data: {
        userId: landlord.id,
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
        monthlyRent: 15000, // Total rent from all units
        isAvailable: false,
        status: 'ACTIVE',
        allowsMultipleTenants: true,
      },
    }),

    // Property 3: Townhouse - Overdue tenant
    prisma.property.create({
      data: {
        userId: landlord.id,
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

    // Property 4: Cottage - Pending verification
    prisma.property.create({
      data: {
        userId: landlord.id,
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
  console.log(`✅ Created ${properties.length} properties\n`);

  // Create tenants
  console.log('👥 Creating tenants...');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Tenant 1: Excellent payment history - Always pays on time
  const tenant1 = await prisma.tenant.create({
    data: {
      userId: landlord.id,
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+27 83 111 2222',
      idNumber: '9001015800081',
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
  });

  // Tenant 2-4: Students in multi-tenant property
  const tenant2 = await prisma.tenant.create({
    data: {
      userId: landlord.id,
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'michael.brown@student.ac.za',
      phone: '+27 84 222 3333',
      tenantType: TenantType.TENANT,
      status: 'ACTIVE',
      employmentStatus: 'STUDENT',
      monthlyRent: 5000,
      paymentDueDay: 1,
      autoSendReminder: true,
    },
  });

  const tenant3 = await prisma.tenant.create({
    data: {
      userId: landlord.id,
      firstName: 'Emma',
      lastName: 'Davis',
      email: 'emma.davis@student.ac.za',
      phone: '+27 85 333 4444',
      tenantType: TenantType.TENANT,
      status: 'ACTIVE',
      employmentStatus: 'STUDENT',
      monthlyRent: 5000,
      paymentDueDay: 1,
      autoSendReminder: true,
    },
  });

  const tenant4 = await prisma.tenant.create({
    data: {
      userId: landlord.id,
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.wilson@student.ac.za',
      phone: '+27 86 444 5555',
      tenantType: TenantType.TENANT,
      status: 'ACTIVE',
      employmentStatus: 'STUDENT',
      monthlyRent: 5000,
      paymentDueDay: 1,
      autoSendReminder: true,
    },
  });

  // Tenant 5: Chronically late payer
  const tenant5 = await prisma.tenant.create({
    data: {
      userId: landlord.id,
      firstName: 'Robert',
      lastName: 'Taylor',
      email: 'robert.taylor@example.com',
      phone: '+27 87 555 6666',
      tenantType: TenantType.TENANT,
      status: 'ACTIVE',
      employmentStatus: 'SELF_EMPLOYED',
      monthlyRent: 12000,
      paymentDueDay: 1,
      autoSendReminder: true,
    },
  });

  // Tenant 6: New tenant - uploaded proof pending verification
  const tenant6 = await prisma.tenant.create({
    data: {
      userId: landlord.id,
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.anderson@example.com',
      phone: '+27 88 666 7777',
      tenantType: TenantType.TENANT,
      status: 'ACTIVE',
      employmentStatus: 'EMPLOYED',
      monthlyRent: 6000,
      paymentDueDay: 1,
      autoSendReminder: true,
    },
  });

  console.log(`✅ Created 6 tenants\n`);

  // Assign tenants to properties
  console.log('🏠 Assigning tenants to properties...');

  const leaseStartDate = new Date(currentYear, currentMonth - 6, 1); // Started 6 months ago

  // Lease end dates spread across expiry windows for lease expiration report
  const today = new Date();
  const in15Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15); // 0-30 window (critical)
  const in45Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 45); // 31-60 window (warning)
  const in75Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 75); // 61-90 window (moderate)
  const in120Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 120); // 90+ window (safe)
  const expired5DaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5); // Already expired

  // Property 1: Single tenant - lease expiring soon (0-30 days)
  await prisma.propertyTenant.create({
    data: {
      userId: landlord.id,
      propertyId: properties[0].id,
      tenantId: tenant1.id,
      leaseStartDate,
      leaseEndDate: in15Days,
      monthlyRent: 8500,
      depositPaid: 8500,
      isActive: true,
      moveInDate: leaseStartDate,
    },
  });

  // Property 2: Multi-tenant (3 students) - different expiry windows
  await prisma.propertyTenant.createMany({
    data: [
      {
        userId: landlord.id,
        propertyId: properties[1].id,
        tenantId: tenant2.id,
        unitLabel: 'Room A',
        leaseStartDate,
        leaseEndDate: in120Days, // 90+ window (safe)
        monthlyRent: 5000,
        depositPaid: 5000,
        isActive: true,
        moveInDate: leaseStartDate,
      },
      {
        userId: landlord.id,
        propertyId: properties[1].id,
        tenantId: tenant3.id,
        unitLabel: 'Room B',
        leaseStartDate,
        leaseEndDate: in45Days, // 31-60 window (warning)
        monthlyRent: 5000,
        depositPaid: 5000,
        isActive: true,
        moveInDate: leaseStartDate,
      },
      {
        userId: landlord.id,
        propertyId: properties[1].id,
        tenantId: tenant4.id,
        unitLabel: 'Room C',
        leaseStartDate,
        leaseEndDate: expired5DaysAgo, // Already expired
        monthlyRent: 5000,
        depositPaid: 5000,
        isActive: true,
        moveInDate: leaseStartDate,
      },
    ],
  });

  // Property 3: Single tenant - lease in 61-90 window
  await prisma.propertyTenant.create({
    data: {
      userId: landlord.id,
      propertyId: properties[2].id,
      tenantId: tenant5.id,
      leaseStartDate,
      leaseEndDate: in75Days,
      monthlyRent: 12000,
      depositPaid: 12000,
      isActive: true,
      moveInDate: leaseStartDate,
    },
  });

  // Property 4: Single tenant - new lease, expires in 31-60 window
  await prisma.propertyTenant.create({
    data: {
      userId: landlord.id,
      propertyId: properties[3].id,
      tenantId: tenant6.id,
      leaseStartDate: new Date(currentYear, currentMonth - 1, 1),
      leaseEndDate: in45Days,
      monthlyRent: 6000,
      depositPaid: 6000,
      isActive: true,
      moveInDate: new Date(currentYear, currentMonth - 1, 1),
    },
  });

  console.log(`✅ Assigned all tenants to properties\n`);

  // Create payment history (last 6 months)
  console.log('💰 Creating payment history...');

  const payments = [];

  // Helper function to create payments for a tenant
  const createPayments = (
    tenantId: string,
    propertyId: string,
    monthlyRent: number,
    paymentBehavior: 'excellent' | 'good' | 'late' | 'very-late',
    monthsBack: number = 6
  ) => {
    for (let i = monthsBack - 1; i >= 1; i--) {
      const month = currentMonth - i;
      const year = month < 0 ? currentYear - 1 : currentYear;
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
      let paymentMethod = null;

      // Determine payment behavior
      if (i > 0) {
        // Not current month
        switch (paymentBehavior) {
          case 'excellent':
            // Always pays 1-2 days early
            paymentDate = new Date(year, adjustedMonth, 0, 29 - Math.floor(Math.random() * 2));
            status = PaymentStatus.PAID;
            paymentMethod = 'EFT';
            break;
          case 'good':
            // Pays on time or 1-3 days late
            const daysLate = Math.floor(Math.random() * 4);
            paymentDate = new Date(year, adjustedMonth, 1 + daysLate);
            status = PaymentStatus.PAID;
            paymentMethod = 'EFT';
            break;
          case 'late':
            // Pays 5-15 days late
            const lateBy = 5 + Math.floor(Math.random() * 10);
            paymentDate = new Date(year, adjustedMonth, 1 + lateBy);
            status = PaymentStatus.PAID;
            paymentMethod = 'CASH';
            break;
          case 'very-late':
            // Sometimes doesn't pay at all, or very late
            if (Math.random() > 0.3) {
              const veryLate = 15 + Math.floor(Math.random() * 15);
              paymentDate = new Date(year, adjustedMonth, 1 + veryLate);
              status = PaymentStatus.PAID;
              paymentMethod = 'CASH';
            } else {
              status = PaymentStatus.OVERDUE;
            }
            break;
        }
      }

      payments.push({
        userId: landlord.id,
        tenantId,
        propertyId,
        paymentReference: `PAY-${year}${String(adjustedMonth + 1).padStart(2, '0')}-${tenantId.substring(0, 8).toUpperCase()}`,
        paymentType: PaymentType.RENT,
        amount: monthlyRent,
        currency: 'ZAR',
        dueDate,
        paymentDate,
        paymentMethod,
        status,
        invoiceNumber: `INV-${year}${String(adjustedMonth + 1).padStart(2, '0')}-${tenantId.substring(0, 8)}`,
        description: `Monthly rent for ${monthNames[adjustedMonth]} ${year}`,
      });
    }
  };

  // Tenant 1: Excellent payer
  createPayments(tenant1.id, properties[0].id, 8500, 'excellent');

  // Tenants 2-4: Students - good to late payers
  createPayments(tenant2.id, properties[1].id, 5000, 'good');
  createPayments(tenant3.id, properties[1].id, 5000, 'excellent');
  createPayments(tenant4.id, properties[1].id, 5000, 'late');

  // Tenant 5: Very late/chronic non-payer
  createPayments(tenant5.id, properties[2].id, 12000, 'very-late');

  // Tenant 6: New tenant (only 1 month)
  createPayments(tenant6.id, properties[3].id, 6000, 'good', 2);

  await prisma.payment.createMany({ data: payments });
  console.log(`✅ Created ${payments.length} payment records\n`);

  // Create current month payments with specific states
  console.log('📅 Creating current month payments...');

  const currentMonthPayments = [
    // Tenant 1: Already paid (excellent)
    {
      userId: landlord.id,
      tenantId: tenant1.id,
      propertyId: properties[0].id,
      paymentReference: `PAY-${currentYear}${String(currentMonth + 1).padStart(2, '0')}-${tenant1.id.substring(0, 8).toUpperCase()}`,
      paymentType: PaymentType.RENT,
      amount: 8500,
      currency: 'ZAR',
      dueDate: new Date(currentYear, currentMonth, 1),
      paymentDate: new Date(currentYear, currentMonth - 1, 30),
      paymentMethod: 'EFT',
      status: PaymentStatus.PAID,
      invoiceNumber: `INV-${currentYear}${String(currentMonth + 1).padStart(2, '0')}-${tenant1.id.substring(0, 8)}`,
      description: `Monthly rent for ${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`,
    },
    // Tenant 2: Paid (Room A)
    {
      userId: landlord.id,
      tenantId: tenant2.id,
      propertyId: properties[1].id,
      paymentReference: `PAY-${currentYear}${String(currentMonth + 1).padStart(2, '0')}-${tenant2.id.substring(0, 8).toUpperCase()}`,
      paymentType: PaymentType.RENT,
      amount: 5000,
      currency: 'ZAR',
      dueDate: new Date(currentYear, currentMonth, 1),
      paymentDate: new Date(currentYear, currentMonth, 2),
      paymentMethod: 'EFT',
      status: PaymentStatus.PAID,
      invoiceNumber: `INV-${currentYear}${String(currentMonth + 1).padStart(2, '0')}-${tenant2.id.substring(0, 8)}-RoomA`,
      description: `Monthly rent for ${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear} - 45 Student House (Room A)`,
    },
    // Tenant 3: Pending (Room B)
    {
      userId: landlord.id,
      tenantId: tenant3.id,
      propertyId: properties[1].id,
      paymentReference: `PAY-${currentYear}${String(currentMonth + 1).padStart(2, '0')}-${tenant3.id.substring(0, 8).toUpperCase()}`,
      paymentType: PaymentType.RENT,
      amount: 5000,
      currency: 'ZAR',
      dueDate: new Date(currentYear, currentMonth, 1),
      status: PaymentStatus.PENDING,
      invoiceNumber: `INV-${currentYear}${String(currentMonth + 1).padStart(2, '0')}-${tenant3.id.substring(0, 8)}-RoomB`,
      description: `Monthly rent for ${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear} - 45 Student House (Room B)`,
    },
    // Tenant 4: Overdue (Room C)
    {
      userId: landlord.id,
      tenantId: tenant4.id,
      propertyId: properties[1].id,
      paymentReference: `PAY-${currentYear}${String(currentMonth + 1).padStart(2, '0')}-${tenant4.id.substring(0, 8).toUpperCase()}`,
      paymentType: PaymentType.RENT,
      amount: 5000,
      currency: 'ZAR',
      dueDate: new Date(currentYear, currentMonth, 1),
      status: PaymentStatus.OVERDUE,
      invoiceNumber: `INV-${currentYear}${String(currentMonth + 1).padStart(2, '0')}-${tenant4.id.substring(0, 8)}-RoomC`,
      description: `Monthly rent for ${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear} - 45 Student House (Room C)`,
    },
    // Tenant 5: Overdue (chronic late payer)
    {
      userId: landlord.id,
      tenantId: tenant5.id,
      propertyId: properties[2].id,
      paymentReference: `PAY-${currentYear}${String(currentMonth + 1).padStart(2, '0')}-${tenant5.id.substring(0, 8).toUpperCase()}`,
      paymentType: PaymentType.RENT,
      amount: 12000,
      currency: 'ZAR',
      dueDate: new Date(currentYear, currentMonth, 1),
      status: PaymentStatus.OVERDUE,
      invoiceNumber: `INV-${currentYear}${String(currentMonth + 1).padStart(2, '0')}-${tenant5.id.substring(0, 8)}`,
      description: `Monthly rent for ${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`,
    },
    // Tenant 6: Pending verification (uploaded proof)
    {
      userId: landlord.id,
      tenantId: tenant6.id,
      propertyId: properties[3].id,
      paymentReference: `PAY-${currentYear}${String(currentMonth + 1).padStart(2, '0')}-${tenant6.id.substring(0, 8).toUpperCase()}`,
      paymentType: PaymentType.RENT,
      amount: 6000,
      currency: 'ZAR',
      dueDate: new Date(currentYear, currentMonth, 1),
      status: PaymentStatus.PENDING_VERIFICATION,
      proofOfPaymentUrl: 'https://uploadthing.com/mock-proof.pdf',
      proofOfPaymentName: 'proof-of-payment.pdf',
      proofUploadedAt: new Date(currentYear, currentMonth, 3),
      invoiceNumber: `INV-${currentYear}${String(currentMonth + 1).padStart(2, '0')}-${tenant6.id.substring(0, 8)}`,
      description: `Monthly rent for ${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`,
    },
  ];

  await prisma.payment.createMany({ data: currentMonthPayments });
  console.log(`✅ Created ${currentMonthPayments.length} current month payments\n`);

  // Summary
  console.log('📊 Seed Summary:');
  console.log('================');
  console.log(`👤 Landlord: ${landlord.email} / password123`);
  console.log(`🏘️  Properties: ${properties.length}`);
  console.log(`   - ${properties[0].name}: Single tenant (all paid)`);
  console.log(`   - ${properties[1].name}: Multi-tenant (mixed statuses)`);
  console.log(`   - ${properties[2].name}: Single tenant (overdue)`);
  console.log(`   - ${properties[3].name}: Single tenant (pending verification)`);
  console.log(`👥 Tenants: 6`);
  console.log(`💰 Total Payments: ${payments.length + currentMonthPayments.length}`);
  console.log(`\n✨ Seed completed successfully!`);
  console.log(`\n🧪 Test the following features:`);
  console.log(`   1. Rent Collection Hub (/financials/rent-collection)`);
  console.log(`   2. Manual Invoice Creation (/financials/invoices/new)`);
  console.log(`   3. Tenant Payment Ledger (/tenants/[id]/payments)`);
  console.log(`   4. Property Cards with payment badges (/properties)`);
  console.log(`   5. Payment health tracking and trends`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
