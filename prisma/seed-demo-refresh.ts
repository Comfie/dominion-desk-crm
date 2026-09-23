/**
 * Demo data refresh (TEST database only)
 *
 * Wipes the operational data of the @mailinator.com demo accounts and reseeds
 * a realistic Gauteng portfolio with every date relative to TODAY, then writes
 * a matching bank statement CSV to docs/demo/ so the reconciliation demo works
 * end to end: upload it and watch September's deposits match.
 *
 * Safety:
 *   - Refuses to run unless DEMO_REFRESH_CONFIRM_HOST equals the database host.
 *   - Only touches users whose email ends in @mailinator.com. Real client
 *     accounts (e.g. the Symons workspace) are never read or modified.
 *   - User logins for the demo landlord/admin/agent are kept (passwords unchanged).
 *
 * Run (re-run any time before a demo):
 *   DEMO_REFRESH_CONFIRM_HOST=gondola.proxy.rlwy.net:11985 npx tsx prisma/seed-demo-refresh.ts
 * Optional: DEMO_TENANT_PASSWORD=... to set the tenant portal password.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

import { generatePaymentReference } from '../lib/features/reconciliation/utils/payment-reference';

const DB_URL = process.env.DATABASE_URL ?? '';
const host = DB_URL ? new URL(DB_URL).host : '';
if (!host || process.env.DEMO_REFRESH_CONFIRM_HOST !== host) {
  console.error(
    `Refusing to run. Set DEMO_REFRESH_CONFIRM_HOST=${host || '<db host>'} to confirm the target.`
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: DB_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const DEMO_DOMAIN = '@mailinator.com';
const LANDLORD_EMAIL = 'landlord.propertycrm@mailinator.com';
const SECOND_DEMO_EMAIL = 'demo01.propertycrm@mailinator.com';
const CLEAR_ONLY_EMAILS = ['agent.propertycrm@mailinator.com'];

// Tables that belong to the account itself (settings, billing, logins): keep.
const KEEP_USER_TABLES = new Set([
  'User',
  'EncryptedBankingDetails',
  'SubscriptionHistory',
  'TeamMember',
  'PayFastSubscription',
  'PayFastTransaction',
  'BillingInvoice',
  'TaskTemplate',
  'MessageTemplate',
  'MessageAutomation',
  'CannedResponse',
  'Integration',
  'PasswordResetToken',
  'SystemSettings',
]);

// ---------------------------------------------------------------------------
// Date helpers (all relative to today, SAST machine time)
// ---------------------------------------------------------------------------
const today = new Date();
today.setHours(12, 0, 0, 0);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const monthStart = (offset: number) =>
  new Date(today.getFullYear(), today.getMonth() + offset, 1, 9);
const dueDateFor = (offset: number, dueDay: number) =>
  new Date(today.getFullYear(), today.getMonth() + offset, Math.min(dueDay, 28), 9);
const MONTHS = [
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
const monthLabel = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const fmtFnbDate = (d: Date) =>
  `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------
async function wipeDemoData(ownerIds: string[]) {
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'userId'`;
  const targets = tables.map((t) => t.table_name).filter((t) => !KEEP_USER_TABLES.has(t));

  // Delete in passes: foreign keys between these tables resolve as children go first.
  let remaining = [...targets];
  for (let pass = 1; pass <= 8 && remaining.length; pass++) {
    const failed: string[] = [];
    for (const table of remaining) {
      try {
        await prisma.$executeRawUnsafe(`DELETE FROM "${table}" WHERE "userId" = ANY($1)`, ownerIds);
      } catch {
        failed.push(table);
      }
    }
    remaining = failed;
  }
  if (remaining.length) throw new Error(`Could not clear: ${remaining.join(', ')}`);

  // Old demo tenant portal logins (their Tenant rows are gone now).
  const oldTenants = await prisma.user.deleteMany({
    where: { role: 'TENANT', email: { endsWith: DEMO_DOMAIN } },
  });
  return { tablesCleared: targets.length, oldTenantLogins: oldTenants.count };
}

// ---------------------------------------------------------------------------
// Portfolio definition
// ---------------------------------------------------------------------------
type Outcome = 'paid' | 'reconcile-ref' | 'reconcile-name' | 'reconcile-partial' | 'arrears';

interface LeaseSeed {
  first: string;
  last: string;
  phone: string;
  property: string;
  unit?: string;
  rent: number;
  reference?: string;
  startMonthsAgo: number;
  endInDays: number;
  thisMonth: Outcome;
  latePayer?: boolean;
}

const PROPERTIES = [
  {
    key: 'loveday',
    name: 'Loveday Court',
    type: 'APARTMENT',
    address: '14 Loveday Street, Braamfontein',
    city: 'Johannesburg',
    postal: '2001',
    bed: 2,
    bath: 1,
    multi: true,
  },
  {
    key: 'jansmuts',
    name: '12 Jan Smuts Ave Cottage',
    type: 'COTTAGE',
    address: '12 Jan Smuts Avenue, Rosebank',
    city: 'Johannesburg',
    postal: '2196',
    bed: 1,
    bath: 1,
    multi: false,
  },
  {
    key: 'fourways',
    name: 'Fourways Gardens 18',
    type: 'TOWNHOUSE',
    address: '18 Fourways Gardens, Cedar Road',
    city: 'Fourways',
    postal: '2191',
    bed: 3,
    bath: 2,
    multi: false,
  },
  {
    key: 'melville',
    name: 'Melville Cottage',
    type: 'COTTAGE',
    address: '31 7th Street, Melville',
    city: 'Johannesburg',
    postal: '2092',
    bed: 2,
    bath: 1,
    multi: false,
  },
  {
    key: 'menlyn',
    name: 'Menlyn Maine Studio 407',
    type: 'STUDIO',
    address: '407 Central Square, Menlyn Maine',
    city: 'Pretoria',
    postal: '0181',
    bed: 1,
    bath: 1,
    multi: false,
  },
] as const;

const LEASES: LeaseSeed[] = [
  {
    first: 'Thandi',
    last: 'Moyo',
    phone: '0821234501',
    property: 'loveday',
    unit: 'Unit 2',
    rent: 8500,
    reference: 'DD-7K3M9Q',
    startMonthsAgo: 14,
    endInDays: 300,
    thisMonth: 'reconcile-ref',
  },
  {
    first: 'Sipho',
    last: 'Dube',
    phone: '0831234502',
    property: 'loveday',
    unit: 'Unit 5',
    rent: 7200,
    startMonthsAgo: 9,
    endInDays: 180,
    thisMonth: 'reconcile-name',
  },
  {
    first: 'Nomvula',
    last: 'Mahlangu',
    phone: '0841234503',
    property: 'loveday',
    unit: 'Unit 3',
    rent: 7900,
    startMonthsAgo: 20,
    endInDays: 120,
    thisMonth: 'paid',
  },
  {
    first: 'Johan',
    last: 'van Wyk',
    phone: '0721234504',
    property: 'loveday',
    unit: 'Unit 7',
    rent: 9800,
    startMonthsAgo: 7,
    endInDays: 150,
    thisMonth: 'arrears',
    latePayer: true,
  },
  {
    first: 'Lerato',
    last: 'Khumalo',
    phone: '0761234505',
    property: 'jansmuts',
    rent: 6500,
    reference: 'DD-M4Q8TX',
    startMonthsAgo: 5,
    endInDays: 210,
    thisMonth: 'reconcile-partial',
  },
  {
    first: 'Ayesha',
    last: 'Patel',
    phone: '0791234506',
    property: 'fourways',
    rent: 14500,
    startMonthsAgo: 11,
    endInDays: 240,
    thisMonth: 'reconcile-name',
  },
  {
    first: 'Pieter',
    last: 'Botha',
    phone: '0811234507',
    property: 'melville',
    rent: 9200,
    startMonthsAgo: 23,
    endInDays: 38,
    thisMonth: 'reconcile-ref',
  },
];

const HISTORY_MONTHS = 5; // paid history before the current month

// ---------------------------------------------------------------------------
// Seed one landlord workspace
// ---------------------------------------------------------------------------
async function seedLandlord(landlordId: string, tenantPasswordHash: string) {
  const landlord = await prisma.user.findUniqueOrThrow({ where: { id: landlordId } });
  const dueDay = landlord.rentalDueDay || 1;

  const propIds: Record<string, string> = {};
  for (const p of PROPERTIES) {
    const created = await prisma.property.create({
      data: {
        userId: landlordId,
        name: p.name,
        propertyType: p.type,
        address: p.address,
        city: p.city,
        province: 'Gauteng',
        postalCode: p.postal,
        bedrooms: p.bed,
        bathrooms: p.bath,
        rentalType: 'LONG_TERM',
        allowsMultipleTenants: p.multi,
        status: p.key === 'menlyn' ? 'ACTIVE' : 'OCCUPIED',
        monthlyRent: p.key === 'menlyn' ? new Prisma.Decimal(6900) : undefined,
        isAvailable: p.key === 'menlyn',
      },
    });
    propIds[p.key] = created.id;
  }

  const statementLines: Array<{ date: Date; amount: number; description: string }> = [];
  const summary: string[] = [];

  for (const l of LEASES) {
    const email = `${l.first}.${l.last}`.toLowerCase().replace(/\s+/g, '') + '.dd@mailinator.com';
    const portalUser = await prisma.user.create({
      data: {
        email,
        password: tenantPasswordHash,
        firstName: l.first,
        lastName: l.last,
        phone: l.phone,
        role: 'TENANT',
        accountType: 'TENANT',
        emailVerified: true,
        emailVerifiedAt: today,
        isFirstLogin: false,
        requirePasswordChange: false,
      },
    });

    const leaseStart = monthStart(-l.startMonthsAgo);
    const tenant = await prisma.tenant.create({
      data: {
        userId: landlordId,
        firstName: l.first,
        lastName: l.last,
        email,
        phone: l.phone,
        tenantType: 'TENANT',
        status: 'ACTIVE',
        portalUserId: portalUser.id,
        employmentStatus: 'EMPLOYED',
      },
    });

    const reference = l.reference ?? generatePaymentReference();
    await prisma.propertyTenant.create({
      data: {
        userId: landlordId,
        propertyId: propIds[l.property],
        tenantId: tenant.id,
        unitLabel: l.unit ?? null,
        leaseStartDate: leaseStart,
        leaseEndDate: addDays(today, l.endInDays),
        moveInDate: leaseStart,
        monthlyRent: new Prisma.Decimal(l.rent),
        depositPaid: new Prisma.Decimal(l.rent * 1.5),
        paymentReference: reference,
        isActive: true,
      },
    });

    const propName = PROPERTIES.find((p) => p.key === l.property)!.name;
    const unitSuffix = l.unit ? `-${l.unit.replace(/\s+/g, '')}` : '';
    const firstOffset = -Math.min(HISTORY_MONTHS, l.startMonthsAgo);

    for (let offset = firstOffset; offset <= 0; offset++) {
      const due = dueDateFor(offset, dueDay);
      const isCurrent = offset === 0;
      const paidLate = l.latePayer ? 9 : tenant.id.charCodeAt(tenant.id.length - 1) % 4;
      let status: Prisma.PaymentCreateInput['status'] = 'PAID';
      let paymentDate: Date | null = addDays(due, paidLate);

      if (isCurrent) {
        if (l.thisMonth === 'paid') {
          paymentDate = addDays(due, 0);
        } else {
          status = due < today ? 'OVERDUE' : 'PENDING';
          paymentDate = null;
        }
      }

      await prisma.payment.create({
        data: {
          user: { connect: { id: landlordId } },
          tenant: { connect: { id: tenant.id } },
          property: { connect: { id: propIds[l.property] } },
          paymentReference: `PAY-${due.getTime()}-${tenant.id.slice(-7).toUpperCase()}`,
          paymentType: 'RENT',
          amount: new Prisma.Decimal(l.rent),
          currency: 'ZAR',
          dueDate: due,
          status,
          paymentDate,
          paymentMethod: status === 'PAID' ? 'EFT' : null,
          invoiceNumber: `INV-${due.getFullYear()}${String(due.getMonth() + 1).padStart(2, '0')}-${tenant.id.substring(0, 8)}${unitSuffix}`,
          description: `Monthly rent for ${monthLabel(due)} - ${propName}${l.unit ? ` (${l.unit})` : ''}`,
          reminderSent: isCurrent && status !== 'PAID',
          reminderSentAt: isCurrent && status !== 'PAID' ? addDays(due, -3) : null,
          reminderCount: isCurrent && status !== 'PAID' ? 1 : 0,
          verifiedAt: status === 'PAID' ? paymentDate : null,
          verifiedBy: status === 'PAID' ? landlordId : null,
        },
      });

      if (isCurrent) {
        const payDay = addDays(due, 1 + (statementLines.length % 5));
        const when = payDay < today ? payDay : addDays(today, -1);
        if (l.thisMonth === 'reconcile-ref') {
          statementLines.push({
            date: when,
            amount: l.rent,
            description: `FNB APP PAYMENT FROM ${reference}`,
          });
        } else if (l.thisMonth === 'reconcile-name') {
          statementLines.push({
            date: when,
            amount: l.rent,
            description: `ABSA TRF ${l.first[0]} ${l.last.toUpperCase()} RENT ${MONTHS[due.getMonth()].slice(0, 3).toUpperCase()}`,
          });
        } else if (l.thisMonth === 'reconcile-partial') {
          statementLines.push({
            date: when,
            amount: Math.round((l.rent * 0.46) / 100) * 100,
            description: `CAPITEC ${reference}`,
          });
        }
      }
    }
    summary.push(
      `${l.first} ${l.last} — ${propName}${l.unit ? ` ${l.unit}` : ''} — R${l.rent} — ${reference} — this month: ${l.thisMonth}`
    );
  }

  // Noise a real statement has: not rent.
  const due = dueDateFor(0, dueDay);
  statementLines.push({
    date: addDays(due, 1),
    amount: -2145.6,
    description: 'DEBIT ORDER CITY OF JHB RATES',
  });
  statementLines.push({
    date: addDays(due, 3),
    amount: 950,
    description: 'CASH DEPOSIT BRAAMFONTEIN',
  });
  statementLines.push({
    date: addDays(due, 4),
    amount: -1850,
    description: 'POS PURCHASE BUILDERS WAREHOUSE',
  });
  statementLines.push({ date: addDays(today, -2), amount: 12.4, description: 'CREDIT INTEREST' });

  // Operations around the rent
  const lovedayId = propIds.loveday;
  await prisma.maintenanceRequest.createMany({
    data: [
      {
        userId: landlordId,
        propertyId: lovedayId,
        title: 'Geyser leaking, Unit 5',
        description: 'Tenant reports water pooling under the geyser in the ceiling cupboard.',
        category: 'PLUMBING',
        priority: 'HIGH',
        status: 'SCHEDULED',
        assignedTo: 'Rand Plumbing & Geysers',
        assignedAt: addDays(today, -1),
        scheduledDate: addDays(today, 2),
        estimatedCost: new Prisma.Decimal(2800),
        location: 'Unit 5 ceiling cupboard',
      },
      {
        userId: landlordId,
        propertyId: propIds.jansmuts,
        title: 'Gate motor stuck',
        description: 'Sliding gate motor stops halfway. Needs a service or new battery.',
        category: 'SECURITY',
        priority: 'NORMAL',
        status: 'PENDING',
        estimatedCost: new Prisma.Decimal(1850),
        location: 'Driveway gate',
      },
      {
        userId: landlordId,
        propertyId: lovedayId,
        title: 'Kitchen tap dripping, Unit 2',
        description: 'Washer replaced on the kitchen mixer tap.',
        category: 'PLUMBING',
        priority: 'LOW',
        status: 'COMPLETED',
        assignedTo: 'Rand Plumbing & Geysers',
        completedDate: addDays(today, -6),
        actualCost: new Prisma.Decimal(420),
        resolutionNotes: 'Washer and cartridge replaced.',
      },
    ],
  });

  const expenses: Prisma.ExpenseCreateManyInput[] = [];
  for (let m = -2; m <= 0; m++) {
    const d = dueDateFor(m, 3);
    expenses.push({
      userId: landlordId,
      propertyId: lovedayId,
      title: `Body corporate levy ${monthLabel(d)}`,
      category: 'LEVIES',
      amount: new Prisma.Decimal(4200),
      expenseDate: d,
      status: 'PAID',
      paidDate: d,
      vendor: 'Loveday Court Body Corporate',
      isDeductible: true,
    });
    expenses.push({
      userId: landlordId,
      propertyId: propIds.melville,
      title: `Municipal rates ${monthLabel(d)}`,
      category: 'RATES',
      amount: new Prisma.Decimal(2145.6),
      expenseDate: d,
      status: 'PAID',
      paidDate: d,
      vendor: 'City of Johannesburg',
      isDeductible: true,
    });
  }
  expenses.push({
    userId: landlordId,
    propertyId: lovedayId,
    title: 'Kitchen tap repair, Unit 2',
    category: 'MAINTENANCE',
    amount: new Prisma.Decimal(420),
    expenseDate: addDays(today, -6),
    status: 'PAID',
    paidDate: addDays(today, -5),
    vendor: 'Rand Plumbing & Geysers',
    isDeductible: true,
  });
  expenses.push({
    userId: landlordId,
    propertyId: propIds.fourways,
    title: 'Building insurance (annual)',
    category: 'INSURANCE',
    amount: new Prisma.Decimal(6840),
    expenseDate: addDays(today, -40),
    status: 'PAID',
    paidDate: addDays(today, -40),
    vendor: 'Santam',
    isDeductible: true,
  });
  await prisma.expense.createMany({ data: expenses });

  await prisma.inspection.createMany({
    data: [
      {
        userId: landlordId,
        propertyId: propIds.fourways,
        inspectionType: 'ROUTINE',
        scheduledDate: addDays(today, 10),
        status: 'SCHEDULED',
        inspector: 'John Landlord',
      },
      {
        userId: landlordId,
        propertyId: propIds.melville,
        inspectionType: 'MOVE_OUT',
        scheduledDate: addDays(today, 38),
        status: 'SCHEDULED',
        inspector: 'John Landlord',
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        userId: landlordId,
        title: 'Lease renewal: Pieter Botha, Melville Cottage',
        description: 'Lease ends in 38 days. Offer renewal at R9 650 (+5%) or plan the vacancy.',
        taskType: 'LEASE_RENEWAL',
        priority: 'HIGH',
        status: 'TODO',
        dueDate: addDays(today, 7),
        relatedType: 'property',
        relatedId: propIds.melville,
      },
      {
        userId: landlordId,
        title: 'Follow up arrears: Johan van Wyk',
        description: 'This month’s rent unpaid. Call before sending a formal notice.',
        taskType: 'PAYMENT_REMINDER',
        priority: 'URGENT',
        status: 'TODO',
        dueDate: addDays(today, 1),
        relatedType: 'property',
        relatedId: lovedayId,
      },
      {
        userId: landlordId,
        title: 'Get second quote for gate motor',
        taskType: 'MAINTENANCE',
        priority: 'NORMAL',
        status: 'IN_PROGRESS',
        dueDate: addDays(today, 4),
        relatedType: 'property',
        relatedId: propIds.jansmuts,
      },
    ],
  });

  await prisma.inquiry.create({
    data: {
      userId: landlordId,
      propertyId: propIds.menlyn,
      inquirySource: 'EMAIL',
      inquiryType: 'VIEWING',
      contactName: 'Kagiso Sithole',
      contactEmail: 'kagiso.sithole.dd@mailinator.com',
      contactPhone: '0821239876',
      message:
        'Hi, is the Menlyn Maine studio still available from next month? I work in Menlyn and would like to view it this weekend.',
      status: 'NEW',
      priority: 'NORMAL',
      createdAt: addDays(today, -2),
    },
  });

  return { statementLines, summary };
}

async function seedSmallWorkspace(ownerId: string, tenantPasswordHash: string) {
  const owner = await prisma.user.findUniqueOrThrow({ where: { id: ownerId } });
  const dueDay = owner.rentalDueDay || 1;
  const property = await prisma.property.create({
    data: {
      userId: ownerId,
      name: 'Kempton Park Duplex 4',
      propertyType: 'DUPLEX',
      address: '4 Monument Road, Kempton Park',
      city: 'Kempton Park',
      province: 'Gauteng',
      postalCode: '1619',
      bedrooms: 2,
      bathrooms: 1.5,
      rentalType: 'LONG_TERM',
      status: 'OCCUPIED',
    },
  });
  const email = 'bongani.nkosi.dd@mailinator.com';
  const portalUser = await prisma.user.create({
    data: {
      email,
      password: tenantPasswordHash,
      firstName: 'Bongani',
      lastName: 'Nkosi',
      role: 'TENANT',
      accountType: 'TENANT',
      emailVerified: true,
      emailVerifiedAt: today,
      isFirstLogin: false,
      requirePasswordChange: false,
    },
  });
  const tenant = await prisma.tenant.create({
    data: {
      userId: ownerId,
      firstName: 'Bongani',
      lastName: 'Nkosi',
      email,
      phone: '0831237788',
      tenantType: 'TENANT',
      status: 'ACTIVE',
      portalUserId: portalUser.id,
    },
  });
  await prisma.propertyTenant.create({
    data: {
      userId: ownerId,
      propertyId: property.id,
      tenantId: tenant.id,
      leaseStartDate: monthStart(-4),
      leaseEndDate: addDays(today, 240),
      moveInDate: monthStart(-4),
      monthlyRent: new Prisma.Decimal(8800),
      depositPaid: new Prisma.Decimal(8800),
      paymentReference: generatePaymentReference(),
      isActive: true,
    },
  });
  for (let offset = -3; offset <= 0; offset++) {
    const due = dueDateFor(offset, dueDay);
    const paid = offset < 0;
    await prisma.payment.create({
      data: {
        user: { connect: { id: ownerId } },
        tenant: { connect: { id: tenant.id } },
        property: { connect: { id: property.id } },
        paymentReference: `PAY-${due.getTime()}-${tenant.id.slice(-7).toUpperCase()}`,
        paymentType: 'RENT',
        amount: new Prisma.Decimal(8800),
        currency: 'ZAR',
        dueDate: due,
        status: paid ? 'PAID' : due < today ? 'OVERDUE' : 'PENDING',
        paymentDate: paid ? addDays(due, 2) : null,
        paymentMethod: paid ? 'EFT' : null,
        invoiceNumber: `INV-${due.getFullYear()}${String(due.getMonth() + 1).padStart(2, '0')}-${tenant.id.substring(0, 8)}`,
        description: `Monthly rent for ${monthLabel(due)} - ${property.name}`,
      },
    });
  }
}

function writeStatementCsv(lines: Array<{ date: Date; amount: number; description: string }>) {
  const sorted = [...lines].sort((a, b) => a.date.getTime() - b.date.getTime());
  let balance = 48_250.35;
  const rows = sorted.map((l) => {
    balance = Math.round((balance + l.amount) * 100) / 100;
    return `${fmtFnbDate(l.date)},${l.amount.toFixed(2)},${balance.toFixed(2)},"${l.description}"`;
  });
  const csv = [
    'ACCOUNT TRANSACTION HISTORY',
    'Account Name,J LANDLORD RENTAL ACCOUNT',
    `Statement period,${fmtFnbDate(dueDateFor(0, 1))} to ${fmtFnbDate(today)}`,
    '',
    'Date,Amount,Balance,Description',
    ...rows,
    '',
  ].join('\n');
  const dir = path.join(process.cwd(), 'docs', 'demo');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'sample-bank-statement.csv');
  fs.writeFileSync(file, csv);
  return file;
}

async function main() {
  const demoOwners = await prisma.user.findMany({
    where: {
      email: { in: [LANDLORD_EMAIL, SECOND_DEMO_EMAIL, ...CLEAR_ONLY_EMAILS] },
      role: 'CUSTOMER',
    },
    select: { id: true, email: true },
  });
  if (demoOwners.some((u) => !u.email.endsWith(DEMO_DOMAIN)))
    throw new Error('Non-demo account selected');
  const landlord = demoOwners.find((u) => u.email === LANDLORD_EMAIL);
  if (!landlord) throw new Error(`${LANDLORD_EMAIL} not found`);

  console.log(`Target: ${host}`);
  const wiped = await wipeDemoData(demoOwners.map((u) => u.id));
  console.log('Cleared:', wiped);

  const tenantPassword =
    process.env.DEMO_TENANT_PASSWORD || `Demo-${generatePaymentReference().slice(3)}!`;
  const hash = await bcrypt.hash(tenantPassword, 12);

  const { statementLines, summary } = await seedLandlord(landlord.id, hash);
  const second = demoOwners.find((u) => u.email === SECOND_DEMO_EMAIL);
  if (second) await seedSmallWorkspace(second.id, hash);

  const csvPath = writeStatementCsv(statementLines);

  console.log('\nLandlord portfolio (landlord.propertycrm@mailinator.com):');
  summary.forEach((s) => console.log('  ' + s));
  console.log(`\nBank statement for the reconciliation demo: ${csvPath}`);
  console.log(`Tenant portal password (all *.dd@mailinator.com tenants): ${tenantPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
