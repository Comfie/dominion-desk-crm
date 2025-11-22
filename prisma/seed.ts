import 'dotenv/config';
import { PrismaClient, SubscriptionTier } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create demo landlord user
  const hashedPassword = await bcrypt.hash('Demo@123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@propertycrm.com' },
    update: {},
    create: {
      email: 'demo@propertycrm.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      phone: '+27821234567',
      accountType: 'INDIVIDUAL',
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      subscriptionStatus: 'ACTIVE',
      emailVerified: true,
      propertyLimit: 20,
    },
  });

  // Create demo tenant user
  const tenantHashedPassword = await bcrypt.hash('Tenant@123', 10);

  const tenantUser = await prisma.user.upsert({
    where: { email: 'john.smith@example.com' },
    update: {},
    create: {
      email: 'john.smith@example.com',
      password: tenantHashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      phone: '+27829876543',
      accountType: 'TENANT',
      subscriptionTier: SubscriptionTier.FREE,
      subscriptionStatus: 'ACTIVE',
      emailVerified: true,
      propertyLimit: 0,
    },
  });

  // Create sample properties
  const property1 = await prisma.property.create({
    data: {
      userId: user.id,
      name: 'Modern 2BR Apartment in Sandton',
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

  const property2 = await prisma.property.create({
    data: {
      userId: user.id,
      name: 'Cozy 3BR Family Home in Durban North',
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

  // Create sample tenant
  const tenant = await prisma.tenant.create({
    data: {
      userId: user.id,
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '+27829876543',
      idNumber: '8501015800086',
      dateOfBirth: new Date('1985-01-01'),
      currentAddress: '78 Main Street',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8001',
      employmentStatus: 'EMPLOYED',
      employer: 'Tech Solutions SA',
      employerPhone: '+27214567890',
      monthlyIncome: 45000,
      emergencyContactName: 'Jane Smith',
      emergencyContactPhone: '+27821112222',
      emergencyContactRelation: 'Spouse',
      tenantType: 'TENANT',
      status: 'ACTIVE',
    },
  });

  // Create a booking
  const booking = await prisma.booking.create({
    data: {
      userId: user.id,
      propertyId: property1.id,
      bookingReference: 'BK-2024-001',
      bookingType: 'SHORT_TERM',
      checkInDate: new Date('2024-12-20'),
      checkOutDate: new Date('2024-12-27'),
      numberOfNights: 7,
      guestName: 'Sarah Johnson',
      guestEmail: 'sarah.j@example.com',
      guestPhone: '+27831234567',
      numberOfGuests: 2,
      baseRate: 5600,
      cleaningFee: 350,
      serviceFee: 500,
      totalAmount: 6450,
      amountPaid: 6450,
      amountDue: 0,
      paymentStatus: 'PAID',
      paymentMethod: 'CREDIT_CARD',
      bookingSource: 'DIRECT',
      status: 'CONFIRMED',
    },
  });

  // Create an inquiry
  await prisma.inquiry.create({
    data: {
      userId: user.id,
      propertyId: property1.id,
      inquirySource: 'WEBSITE',
      inquiryType: 'BOOKING',
      contactName: 'Michael Brown',
      contactEmail: 'michael.b@example.com',
      contactPhone: '+27847654321',
      message:
        "Hi, I'm interested in booking your Sandton apartment for a week in January. Is it available from the 15th to the 22nd?",
      checkInDate: new Date('2025-01-15'),
      checkOutDate: new Date('2025-01-22'),
      numberOfGuests: 3,
      status: 'NEW',
      priority: 'NORMAL',
    },
  });

  // Create a maintenance request
  await prisma.maintenanceRequest.create({
    data: {
      userId: user.id,
      propertyId: property2.id,
      title: 'Leaking tap in main bathroom',
      description:
        'The hot water tap in the main bathroom has been leaking for the past few days. It needs to be replaced or repaired.',
      category: 'PLUMBING',
      priority: 'NORMAL',
      location: 'Main Bathroom',
      status: 'PENDING',
      estimatedCost: 500,
    },
  });

  // Create sample tasks
  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        title: 'Follow up with Michael Brown',
        description: 'Follow up on the January booking inquiry',
        taskType: 'FOLLOW_UP',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        status: 'TODO',
      },
      {
        userId: user.id,
        title: 'Prepare check-in for Sarah Johnson',
        description: 'Prepare welcome package and check-in instructions',
        taskType: 'CHECK_IN',
        priority: 'NORMAL',
        dueDate: new Date('2024-12-20'),
        status: 'TODO',
      },
    ],
  });

  console.log('Database seeded successfully!');
  console.log('');
  console.log('Demo Landlord Credentials:');
  console.log('Email: demo@propertycrm.com');
  console.log('Password: Demo@123');
  console.log('');
  console.log('Demo Tenant Credentials:');
  console.log('Email: john.smith@example.com');
  console.log('Password: Tenant@123');
  console.log('');
  console.log('Created:');
  console.log(`- 1 Landlord User`);
  console.log(`- 1 Tenant User`);
  console.log(`- 2 Properties`);
  console.log(`- 1 Tenant Record`);
  console.log(`- 1 Booking`);
  console.log(`- 1 Inquiry`);
  console.log(`- 1 Maintenance Request`);
  console.log(`- 2 Tasks`);
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
