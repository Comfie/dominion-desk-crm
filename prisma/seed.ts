import 'dotenv/config';
import { PrismaClient, SubscriptionTier } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { createDefaultFoldersForTenant } from '../lib/document-folders';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
