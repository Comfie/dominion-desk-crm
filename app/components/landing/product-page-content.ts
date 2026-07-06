export type ProductCta = {
  label: string;
  href: string;
};

export type ProductHero = {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: ProductCta;
  secondaryCta: ProductCta;
  trustSignals: string[];
};

export type AudiencePath = {
  id: 'private-landlords' | 'property-companies' | 'rental-agents';
  title: string;
  promise: string;
  cta: string;
  anchor: string;
  features: string[];
};

export type LifecycleStage = {
  label: string;
  description: string;
};

export type FeatureSuite = {
  id:
    | 'placement'
    | 'management'
    | 'tenant-portal'
    | 'financial-control'
    | 'operations'
    | 'bookings-inquiries'
    | 'south-african-trust';
  label: string;
  title: string;
  summary: string;
  features: string[];
};

export type QuickStartStep = {
  id: 'capture' | 'invite' | 'operate';
  kicker: string;
  title: string;
  description: string;
  metric: string;
  rows: string[];
};

export type ProductCapability = {
  title: string;
  status: 'Live' | 'Agency' | 'Portal' | 'Reports' | 'Local';
  description: string;
};

export type PricingPlan = {
  id: 'trial' | 'landlord' | 'portfolio' | 'agency';
  name: string;
  price: string;
  description: string;
  cta: ProductCta;
  features: string[];
};

export type FaqItem = {
  question: string;
  answer: string;
};

export const productHero: ProductHero = {
  eyebrow: 'Rental operations OS for South Africa',
  headline: 'Run rentals from one operating cockpit.',
  subheadline:
    'DominionDesk connects mandates, tenants, rent, maintenance, documents, and reports so landlords, companies, and agents can see what needs attention before it becomes a chase.',
  primaryCta: { label: 'Start free', href: '/register' },
  secondaryCta: { label: 'See product walkthrough', href: '/demo' },
  trustSignals: [
    'Built for South Africa',
    'Private, company, and agency accounts',
    'Tenant portal included',
  ],
};

export const quickStartSteps: QuickStartStep[] = [
  {
    id: 'capture',
    kicker: '01 / Bring the rental in',
    title: 'Capture the rental',
    description:
      'Add the property, owner, lease terms, mandate, or application context without building a spreadsheet first.',
    metric: '5 min',
    rows: ['Property record', 'Owner or landlord', 'Mandate or lease terms'],
  },
  {
    id: 'invite',
    kicker: '02 / Give access',
    title: 'Invite the tenant',
    description:
      'Create or link the tenant, activate the portal, and keep invoices, documents, and maintenance in one place.',
    metric: 'Portal ready',
    rows: ['Tenant profile', 'Portal access', 'Document handoff'],
  },
  {
    id: 'operate',
    kicker: '03 / Run the month',
    title: 'Run the month',
    description:
      'Track rent, proof of payment, maintenance, tasks, and reports from the same operational line.',
    metric: 'Live ops',
    rows: ['Rent status', 'Maintenance queue', 'Reports export'],
  },
];

export const audiencePaths: AudiencePath[] = [
  {
    id: 'private-landlords',
    title: 'Private landlords',
    promise: 'Manage rentals without chasing tenants, spreadsheets, and scattered documents.',
    cta: 'Explore landlord tools',
    anchor: '#management',
    features: [
      'Properties',
      'Tenant profiles',
      'Lease assignments',
      'Rent reminders',
      'Invoices',
      'Proof of payment uploads',
      'Tenant portal',
      'Maintenance requests',
      'Documents',
      'Expenses',
      'Tax and payment reports',
    ],
  },
  {
    id: 'property-companies',
    title: 'Property companies',
    promise: 'Run a portfolio with financial visibility, team access, and repeatable workflows.',
    cta: 'Explore portfolio tools',
    anchor: '#operations',
    features: [
      'Multi-property dashboard',
      'Long-term and short-term rental support',
      'Multi-tenant units and room rentals',
      'Team member access',
      'Role-based workflows',
      'Tasks',
      'Inspections',
      'Documents',
      'Maintenance coordination',
      'Income and expense tracking',
      'CSV exports',
      'Portfolio reports',
    ],
  },
  {
    id: 'rental-agents',
    title: 'Rental agents',
    promise: 'Manage the full placement journey before the tenant becomes an active lease.',
    cta: 'Explore placement tools',
    anchor: '#placement',
    features: [
      'Landlord register',
      'Mandates',
      'Placement and management fee tracking',
      'Rental applications',
      'Viewings',
      'Attendance statuses',
      'Screening checklist',
      'FICA and consent tracking',
      'Placement completion',
      'Tenant creation or linking',
      'Lease assignment',
      'Tenant portal handoff',
    ],
  },
];

export const lifecycleStages: LifecycleStage[] = [
  {
    label: 'Mandate',
    description: 'Capture landlord ownership, mandate type, and fee terms before marketing starts.',
  },
  {
    label: 'Application',
    description: 'Convert interest into structured rental applications tied to a property.',
  },
  {
    label: 'Viewing',
    description: 'Schedule viewings and track attendance without losing context.',
  },
  {
    label: 'Screening',
    description: 'Track credit, affordability, references, FICA, and consent checks.',
  },
  {
    label: 'Placement',
    description: 'Resolve or create the tenant and complete the lease/property assignment.',
  },
  {
    label: 'Lease',
    description: 'Keep lease records, documents, deposits, and move-in details connected.',
  },
  { label: 'Rent', description: 'Send reminders, issue invoices, and track EFT proof of payment.' },
  {
    label: 'Maintenance',
    description: 'Let tenants log maintenance requests with photos through the portal.',
  },
  {
    label: 'Reports',
    description: 'Export revenue, cash flow, rent collection, tax, occupancy, and tenant reports.',
  },
];

export const featureSuites: FeatureSuite[] = [
  {
    id: 'placement',
    label: 'Placement suite',
    title: 'From landlord mandate to tenant handoff',
    summary:
      'An agency-only workflow for rental agents who need to manage applications, viewings, screening, placement, and tenant portal activation.',
    features: [
      'Agency-only placement workspace',
      'Landlord owner register',
      'Mandate register',
      'Placement-only and management mandate support',
      'Placement and management fee tracking',
      'Application intake',
      'Inquiry-to-application support',
      'Viewing scheduling',
      'Viewing attendance statuses',
      'Applicant screening checklist',
      'Credit, affordability, employer, landlord reference, FICA, and consent checks',
      'FICA and consent tracking',
      'Placement completion',
      'Tenant resolution by linked tenant, email match, or new tenant',
      'Lease/property assignment',
      'Tenant portal activation handoff',
    ],
  },
  {
    id: 'management',
    label: 'Management suite',
    title: 'Manage the property and the relationship',
    summary:
      'Keep property records, tenants, leases, documents, maintenance, inspections, and unit-level rentals in one place.',
    features: [
      'Property creation and editing',
      'Property images',
      'Property documents',
      'Long-term, short-term, and mixed rental types',
      'Monthly rent, daily rate, cleaning fee, and security deposit fields',
      'Property import',
      'Property status tracking',
      'Multi-tenant per property support',
      'Unit labels for rooms or units',
      'Tenant profiles',
      'Emergency contact information',
      'Lease assignments',
      'Tenant status management',
      'Tenant document storage',
      'Maintenance requests',
      'Maintenance photos through tenant portal',
      'Inspections',
      'Tasks',
      'Notifications',
    ],
  },
  {
    id: 'tenant-portal',
    label: 'Tenant portal',
    title: 'Give every tenant a portal after handoff',
    summary:
      'Tenants get a self-service space for invoices, EFT proof, maintenance, documents, and profile details.',
    features: [
      'Tenant portal login',
      'Invoice viewing',
      'Payment history',
      'Proof of EFT payment upload',
      'Maintenance request logging',
      'Maintenance photo upload',
      'Tenant documents',
      'Profile and contact details',
      'Portal access activation after placement',
    ],
  },
  {
    id: 'financial-control',
    label: 'Financial control',
    title: 'Know what is paid, overdue, profitable, and export-ready',
    summary:
      'Track rent, invoices, EFT proof, expenses, banking details, reminders, and exportable reports.',
    features: [
      'Rent collection view',
      'Payment tracking',
      'Payment statuses',
      'Invoice generation',
      'Banking details',
      'Automated payment reminders',
      'Manual payment reminder triggers',
      'Bulk payment reminders',
      'Income tracking',
      'Expense tracking',
      'Tax-deductible expense flags',
      'Rent collection report',
      'Tenant payment ledger',
      'Revenue report',
      'Cash flow report',
      'Occupancy report',
      'Aging receivables report',
      'Lease expiration report',
      'Maintenance costs report',
      'Tax summary report',
      'CSV exports',
    ],
  },
  {
    id: 'operations',
    label: 'Operations layer',
    title: 'Control access, messages, tasks, documents, and audit history',
    summary:
      'Give teams and agencies repeatable workflows with the account types, automation, and controls they need.',
    features: [
      'Team member management',
      'Role-based access',
      'Account type rules: individual, company, agency, tenant',
      'Agency-only placement navigation',
      'Messaging templates',
      'Messaging automation UI',
      'Scheduled message queue',
      'Booking event automation triggers',
      'Payment and maintenance automation triggers',
      'Task management',
      'Document vault',
      'Audit trail',
      'Notifications',
    ],
  },
  {
    id: 'bookings-inquiries',
    label: 'Bookings and inquiries',
    title: 'Support mixed portfolios without separating the work',
    summary:
      'Manage bookings, guests, inquiries, pricing, calendar conflicts, and booking reports alongside long-term leases.',
    features: [
      'Booking creation and management',
      'Guest details',
      'Booking status workflow',
      'Availability and conflict checking',
      'Pricing calculation',
      'Cleaning fees',
      'Booking calendar',
      'Inquiry management',
      'Inquiry-to-booking support',
      'Booking reports',
    ],
  },
  {
    id: 'south-african-trust',
    label: 'South African workflows',
    title: 'Built around local rental operations',
    summary:
      'DominionDesk uses local rental terminology and workflows: ZAR, EFT proof, FICA, POPIA-aware data handling, and PayFast subscription billing.',
    features: [
      'Native ZAR workflows',
      'EFT-first rent collection',
      'Proof of payment upload',
      'POPIA-aware data handling',
      'PayFast subscription billing',
      'Local rental terminology and workflows',
      'Built for landlords, companies, and agents operating in South Africa',
    ],
  },
];

export const productCapabilities: ProductCapability[] = [
  {
    title: 'Placement',
    status: 'Agency',
    description: 'Mandates, applications, viewings, screening, and tenant handoff.',
  },
  {
    title: 'Tenant portal',
    status: 'Portal',
    description: 'Invoices, EFT proof, maintenance requests, documents, and profile details.',
  },
  {
    title: 'Rent collection',
    status: 'Live',
    description: 'Payment statuses, invoices, reminders, ledgers, and overdue visibility.',
  },
  {
    title: 'Maintenance',
    status: 'Live',
    description: 'Tenant requests, photos, coordination, tasks, and status tracking.',
  },
  {
    title: 'Documents',
    status: 'Live',
    description: 'Property, tenant, lease, FICA, and operating documents in context.',
  },
  {
    title: 'Reports',
    status: 'Reports',
    description: 'Revenue, cash flow, rent collection, occupancy, tax, and tenant reports.',
  },
  {
    title: 'Team access',
    status: 'Live',
    description: 'Private, company, agency, and tenant account rules with role-aware navigation.',
  },
  {
    title: 'Bookings',
    status: 'Live',
    description: 'Short-term bookings, guests, pricing, inquiries, and calendar views.',
  },
  {
    title: 'Tasks',
    status: 'Live',
    description: 'Operational follow-ups for maintenance, payments, inspections, and handoffs.',
  },
  {
    title: 'Messaging',
    status: 'Live',
    description: 'Templates, automation screens, scheduled messages, and reminder workflows.',
  },
  {
    title: 'CSV exports',
    status: 'Reports',
    description:
      'Export operational and financial data when owners, accountants, or teams need it.',
  },
  {
    title: 'South African workflows',
    status: 'Local',
    description: 'ZAR, EFT proof, FICA, POPIA-aware handling, and local rental language.',
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    id: 'trial',
    name: 'Founding trial',
    price: 'Start free',
    description: 'Early access for users getting started.',
    cta: { label: 'Start free', href: '/register' },
    features: ['Two months free', 'No credit card required', 'Tenant portal included'],
  },
  {
    id: 'landlord',
    name: 'Landlord',
    price: 'Early access',
    description: 'Early access for private landlords managing up to two properties.',
    cta: { label: 'Start free', href: '/register' },
    features: ['Rent reminders', 'Tenant portal', 'Maintenance', 'Documents', 'Reports'],
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    price: 'Early access',
    description:
      'Early access for companies and growing portfolios with more properties and team workflows.',
    cta: { label: 'Start free', href: '/register' },
    features: ['Multi-property workflows', 'Team access', 'CSV exports', 'Portfolio reports'],
  },
  {
    id: 'agency',
    name: 'Agency early access',
    price: 'Talk to us',
    description: 'For agencies managing placement, mandates, and tenant handoff.',
    cta: {
      label: 'Talk to us',
      href: '/demo',
    },
    features: ['Mandates, applications, screening, and portal handoff', 'Workspace setup support'],
  },
];

export const faqItems: FaqItem[] = [
  {
    question: 'Who is DominionDesk for?',
    answer:
      'DominionDesk is for private landlords, property companies, and rental agents who need one place to manage placement, tenants, rent, maintenance, documents, and reports.',
  },
  {
    question: 'What is the difference between private, company, and agency accounts?',
    answer:
      'Private and company accounts focus on property and tenant management. Agency accounts also unlock the placement workspace for mandates, applications, viewings, screening, placement completion, and tenant portal handoff.',
  },
  {
    question: 'Can rental agents manage placement before a lease starts?',
    answer:
      'Yes. Agency accounts can manage landlord owners, mandates, applications, viewings, screening checks, placement completion, lease assignment, and portal activation.',
  },
  {
    question: 'Do tenants get portal access?',
    answer:
      'Yes. Tenants get portal access so they can view invoices, upload proof of EFT payment, log maintenance requests, access documents, and manage profile details.',
  },
  {
    question: 'How does EFT proof of payment work?',
    answer:
      'Tenants pay into your bank account and upload their proof of payment through the tenant portal. You can then confirm receipt and keep the payment record connected to the tenant and property.',
  },
  {
    question: 'Can I manage rooms or multiple tenants in one property?',
    answer:
      'Yes. DominionDesk supports multi-tenant properties with optional unit labels for rooms, units, or sections of the same property.',
  },
  {
    question: 'Does it support short-term rentals?',
    answer:
      'Yes. DominionDesk includes booking management, guests, inquiry tracking, booking statuses, pricing calculation, cleaning fees, calendar views, and booking reports.',
  },
  {
    question: 'What reports can I export?',
    answer:
      'You can export rent collection, tenant payments, revenue, cash flow, occupancy, aging receivables, lease expiration, maintenance costs, and tax summary reports.',
  },
  {
    question: 'Is PayFast billing live?',
    answer:
      'PayFast subscription billing is implemented for DominionDesk subscriptions. Tenant rent collection currently supports EFT-first workflows with proof of payment upload.',
  },
  {
    question: 'Are external channel and payment integrations live?',
    answer:
      'External sync and payment integrations are being handled carefully. The current product page only promises the workflows that are available in DominionDesk today.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer:
      'Your operational records remain exportable through the available CSV exports and reports. DominionDesk is designed so your rental data stays usable outside the platform.',
  },
];

export const unsupportedProductionClaims = [
  'live Airbnb sync',
  'live Booking.com sync',
  'live Google Calendar sync',
  'live Paystack payments',
  'live Stripe payments',
  'guaranteed on-time payments',
  'zero double-bookings via sync',
];

export const staleScreenshotAssets = [
  '/mockups/img-dashboard.jpg',
  '/mockups/img-property-listing.jpg',
  '/mockups/img-tenant-listing.jpg',
  '/mockups/img-financials.jpg',
  '/mockups/img-maintenance.jpg',
  '/mockups/img-documents.jpg',
  '/mockups/img-booking-calendar.jpg',
  '/mockups/img-bookings.jpg',
  '/mockups/img-communications.jpg',
  '/mockups/img-reports-one.jpg',
  '/mockups/img-reports-two.jpg',
  '/mockups/img-mobile-dashboard.jpg',
];
