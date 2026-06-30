# Product Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the public landing page into a product-led DominionDesk page that positions the app as the South African rental operations OS for private landlords, property companies, and rental agents.

**Architecture:** Keep `app/page.tsx` as the server entry with metadata. Move landing-page copy into a typed content module, use focused presentational components for the product surface and lifecycle rail, and replace `LandingPageClient` with the approved product-page structure. Tests verify that the feature inventory, user-type positioning, CTAs, and honesty constraints are represented.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Lucide React, Vitest, Testing Library.

## Global Constraints

- Product positioning: DominionDesk is the rental operations OS for South Africa.
- User types: private landlords, property companies, rental agents/agencies, and tenants.
- Landing page must surface the agency placement journey without making private landlords secondary.
- No fake testimonials.
- No fabricated metrics.
- No unsupported claims that Airbnb, Booking.com, Google Calendar, Paystack, Stripe, or live external syncs are production-ready.
- Agency pricing must not be invented; use "Agency early access" or "Talk to us".
- Tenant portal access is mandatory after placement handoff.
- CTAs must link to `/register` and `/demo`.
- Do not reuse stale screenshots from `public/mockups/*` in the redesigned page.
- Product visuals must be built as current HTML/CSS product surfaces unless fresh screenshots are captured and verified during implementation.
- Keep implementation scoped to the public landing/product page and its local support files.

---

## File Structure

- Create: `app/components/landing/product-page-content.ts`
  - Owns all product-page copy, feature inventory, FAQ content, CTA labels, and route targets.
- Create: `app/components/landing/product-page-content.test.ts`
  - Verifies product positioning, feature coverage, user types, and unsupported-claim exclusions.
- Create: `app/components/landing/product-page-sections.tsx`
  - Owns small presentational sections used by the landing page: product surface, audience paths, lifecycle rail, feature groups, pricing, FAQ.
- Create: `app/components/landing/product-page-sections.test.tsx`
  - Verifies the key product sections render from content data.
- Modify: `app/components/LandingPageClient.tsx`
  - Replaces the current landlord-first page with the new product-page composition.
- Create or modify: `app/components/LandingPageClient.test.tsx`
  - Verifies nav, CTAs, public copy, and absence of unsupported integration promises.
- Modify: `app/page.tsx`
  - Updates metadata to the new product positioning.

---

### Task 1: Product Page Content Model

**Files:**

- Create: `app/components/landing/product-page-content.ts`
- Create: `app/components/landing/product-page-content.test.ts`

**Interfaces:**

- Produces: `productHero: ProductHero`
- Produces: `audiencePaths: AudiencePath[]`
- Produces: `lifecycleStages: LifecycleStage[]`
- Produces: `featureSuites: FeatureSuite[]`
- Produces: `pricingPlans: PricingPlan[]`
- Produces: `faqItems: FaqItem[]`
- Produces: `unsupportedProductionClaims: string[]`
- Produces: `staleScreenshotAssets: string[]`

- [ ] **Step 1: Write failing content coverage tests**

Create `app/components/landing/product-page-content.test.ts`:

```ts
import {
  audiencePaths,
  faqItems,
  featureSuites,
  lifecycleStages,
  pricingPlans,
  productHero,
  staleScreenshotAssets,
  unsupportedProductionClaims,
} from './product-page-content';

describe('product landing page content', () => {
  it('positions DominionDesk as a rental operations platform for the three buying audiences', () => {
    expect(productHero.headline).toBe('Run the rental lifecycle from mandate to monthly rent.');
    expect(productHero.primaryCta.href).toBe('/register');
    expect(productHero.secondaryCta.href).toBe('/demo');
    expect(audiencePaths.map((path) => path.title)).toEqual([
      'Private landlords',
      'Property companies',
      'Rental agents',
    ]);
  });

  it('includes the full rental lifecycle rail in order', () => {
    expect(lifecycleStages.map((stage) => stage.label)).toEqual([
      'Mandate',
      'Application',
      'Viewing',
      'Screening',
      'Placement',
      'Lease',
      'Rent',
      'Maintenance',
      'Reports',
    ]);
  });

  it('includes the agency placement feature inventory', () => {
    const placementSuite = featureSuites.find((suite) => suite.id === 'placement');

    expect(placementSuite?.features).toEqual(
      expect.arrayContaining([
        'Agency-only placement workspace',
        'Landlord owner register',
        'Mandate register',
        'Placement and management fee tracking',
        'Application intake',
        'Viewing scheduling',
        'Applicant screening checklist',
        'FICA and consent tracking',
        'Placement completion',
        'Lease/property assignment',
        'Tenant portal activation handoff',
      ])
    );
  });

  it('includes management, portal, financial, operations, booking, and SA trust suites', () => {
    expect(featureSuites.map((suite) => suite.id)).toEqual([
      'placement',
      'management',
      'tenant-portal',
      'financial-control',
      'operations',
      'bookings-inquiries',
      'south-african-trust',
    ]);
  });

  it('uses talk-to-us agency pricing instead of inventing a price', () => {
    const agencyPlan = pricingPlans.find((plan) => plan.id === 'agency');

    expect(agencyPlan?.price).toBe('Talk to us');
    expect(agencyPlan?.features).toContain('Mandates, applications, screening, and portal handoff');
  });

  it('keeps unsupported external integrations out of production claims', () => {
    const visibleCopy = [
      productHero.headline,
      productHero.subheadline,
      ...audiencePaths.flatMap((path) => [path.title, path.promise, ...path.features]),
      ...featureSuites.flatMap((suite) => [suite.title, suite.summary, ...suite.features]),
      ...faqItems.flatMap((faq) => [faq.question, faq.answer]),
    ].join(' ');

    for (const claim of unsupportedProductionClaims) {
      expect(visibleCopy).not.toContain(claim);
    }
  });

  it('documents stale mockup screenshots so the page does not reuse them', () => {
    expect(staleScreenshotAssets).toEqual(
      expect.arrayContaining([
        '/mockups/img-dashboard.jpg',
        '/mockups/img-property-listing.jpg',
        '/mockups/img-tenant-listing.jpg',
        '/mockups/img-financials.jpg',
        '/mockups/img-maintenance.jpg',
        '/mockups/img-documents.jpg',
      ])
    );
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
npm test -- app/components/landing/product-page-content.test.ts
```

Expected: FAIL because `app/components/landing/product-page-content.ts` does not exist.

- [ ] **Step 3: Create the typed product content module**

Create `app/components/landing/product-page-content.ts`:

```ts
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
  headline: 'Run the rental lifecycle from mandate to monthly rent.',
  subheadline:
    'DominionDesk brings placement, tenant management, rent collection, maintenance, documents, and reporting into one South African property operations platform for landlords, property companies, and rental agents.',
  primaryCta: { label: 'Start free', href: '/register' },
  secondaryCta: { label: 'See product walkthrough', href: '/demo' },
  trustSignals: [
    'Built for South Africa',
    'Private, company, and agency accounts',
    'Tenant portal included',
  ],
};

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
  {
    label: 'Rent',
    description: 'Send reminders, issue invoices, and track EFT proof of payment.',
  },
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

export const pricingPlans: PricingPlan[] = [
  {
    id: 'trial',
    name: 'Founding trial',
    price: 'R0',
    description: 'Two months of full access for early users getting started.',
    cta: { label: 'Start free', href: '/register' },
    features: ['Two months free', 'No credit card required', 'Tenant portal included'],
  },
  {
    id: 'landlord',
    name: 'Landlord',
    price: 'R299/month',
    description: 'For private landlords managing up to two properties.',
    cta: { label: 'Start free', href: '/register' },
    features: ['Rent reminders', 'Tenant portal', 'Maintenance', 'Documents', 'Reports'],
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    price: 'R299 + usage',
    description: 'For companies and growing portfolios with more properties and team workflows.',
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
      href: 'mailto:support@dominiondesk.com?subject=Agency%20early%20access',
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
```

- [ ] **Step 4: Run the content tests and verify they pass**

Run:

```bash
npm test -- app/components/landing/product-page-content.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add app/components/landing/product-page-content.ts app/components/landing/product-page-content.test.ts
git commit -m "feat: add product landing page content model"
```

---

### Task 2: Product Page Section Components

**Files:**

- Create: `app/components/landing/product-page-sections.tsx`
- Create: `app/components/landing/product-page-sections.test.tsx`

**Interfaces:**

- Consumes: `ProductHero`, `AudiencePath[]`, `LifecycleStage[]`, `FeatureSuite[]`, `PricingPlan[]`, `FaqItem[]`
- Produces: `HeroProductSurface`
- Produces: `AudiencePathGrid`
- Produces: `LifecycleRail`
- Produces: `FeatureSuiteSection`
- Produces: `PricingSection`
- Produces: `FaqSection`
- Produces: HTML/CSS product visuals that do not depend on old screenshot assets

- [ ] **Step 1: Write failing render tests for section components**

Create `app/components/landing/product-page-sections.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import {
  audiencePaths,
  faqItems,
  featureSuites,
  lifecycleStages,
  pricingPlans,
  productHero,
} from './product-page-content';
import {
  AudiencePathGrid,
  FaqSection,
  FeatureSuiteSection,
  HeroProductSurface,
  LifecycleRail,
  PricingSection,
} from './product-page-sections';

describe('product page sections', () => {
  it('renders the hero product surface with placement, management, and portal lanes', () => {
    render(<HeroProductSurface hero={productHero} />);

    expect(screen.getByText('Placement')).toBeInTheDocument();
    expect(screen.getByText('Management')).toBeInTheDocument();
    expect(screen.getByText('Tenant Portal')).toBeInTheDocument();
    expect(screen.getByText('Screening passed')).toBeInTheDocument();
  });

  it('does not render stale screenshot assets in product visuals', () => {
    const { container } = render(<HeroProductSurface hero={productHero} />);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain('/mockups/');
  });

  it('renders the three audience paths', () => {
    render(<AudiencePathGrid paths={audiencePaths} />);

    expect(screen.getByText('Private landlords')).toBeInTheDocument();
    expect(screen.getByText('Property companies')).toBeInTheDocument();
    expect(screen.getByText('Rental agents')).toBeInTheDocument();
  });

  it('renders every lifecycle stage', () => {
    render(<LifecycleRail stages={lifecycleStages} />);

    for (const stage of lifecycleStages) {
      expect(screen.getByText(stage.label)).toBeInTheDocument();
    }
  });

  it('renders a feature suite with its feature inventory', () => {
    const placementSuite = featureSuites.find((suite) => suite.id === 'placement');
    expect(placementSuite).toBeDefined();

    render(<FeatureSuiteSection suite={placementSuite!} />);

    expect(screen.getByText('From landlord mandate to tenant handoff')).toBeInTheDocument();
    expect(screen.getByText('Tenant portal activation handoff')).toBeInTheDocument();
  });

  it('renders pricing with agency early access', () => {
    render(<PricingSection plans={pricingPlans} />);

    expect(screen.getByText('Agency early access')).toBeInTheDocument();
    expect(screen.getByText('Talk to us')).toBeInTheDocument();
  });

  it('renders FAQ content without hiding answers by default', () => {
    render(<FaqSection items={faqItems} />);

    expect(screen.getByText('Who is DominionDesk for?')).toBeInTheDocument();
    expect(
      screen.getByText(/private landlords, property companies, and rental agents/i)
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the render tests and verify they fail**

Run:

```bash
npm test -- app/components/landing/product-page-sections.test.tsx
```

Expected: FAIL because `product-page-sections.tsx` does not exist.

- [ ] **Step 3: Implement the section components**

Create `app/components/landing/product-page-sections.tsx`:

```tsx
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  KeyRound,
  LayoutDashboard,
  MessageSquareText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type {
  AudiencePath,
  FaqItem,
  FeatureSuite,
  LifecycleStage,
  PricingPlan,
  ProductHero,
} from './product-page-content';

const laneData = [
  {
    title: 'Placement',
    icon: ClipboardCheck,
    rows: ['Mandate active', 'Viewing scheduled', 'Screening passed'],
  },
  {
    title: 'Management',
    icon: LayoutDashboard,
    rows: ['Rent due', 'Maintenance open', 'Report exported'],
  },
  {
    title: 'Tenant Portal',
    icon: KeyRound,
    rows: ['Invoice viewed', 'POP uploaded', 'Issue logged'],
  },
];

const audienceIcons = {
  'private-landlords': Building2,
  'property-companies': Users,
  'rental-agents': ClipboardCheck,
} as const;

const suiteIcons = {
  placement: ClipboardCheck,
  management: Building2,
  'tenant-portal': KeyRound,
  'financial-control': CircleDollarSign,
  operations: ShieldCheck,
  'bookings-inquiries': MessageSquareText,
  'south-african-trust': FileText,
} as const;

export function HeroProductSurface({ hero }: { hero: ProductHero }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-3 shadow-2xl shadow-slate-950/30 backdrop-blur md:p-4">
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-sky-200 uppercase">
            DominionDesk workspace
          </p>
          <p className="mt-1 text-sm text-slate-300">{hero.eyebrow}</p>
        </div>
        <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
          Live workflow
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {laneData.map((lane) => {
          const Icon = lane.icon;

          return (
            <div key={lane.title} className="rounded-md border border-white/10 bg-slate-950/55 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Icon className="h-4 w-4 text-sky-300" />
                <h3 className="text-sm font-semibold text-white">{lane.title}</h3>
              </div>
              <div className="space-y-2">
                {lane.rows.map((row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between rounded-md bg-white/[0.06] px-3 py-2 text-sm text-slate-200"
                  >
                    <span>{row}</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AudiencePathGrid({ paths }: { paths: AudiencePath[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {paths.map((path) => {
        const Icon = audienceIcons[path.id];

        return (
          <a
            key={path.id}
            href={path.anchor}
            className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-100"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-sky-50 text-sky-700">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-slate-950">{path.title}</h3>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{path.promise}</p>
            <ul className="mt-5 space-y-2 text-sm text-slate-700">
              {path.features.slice(0, 8).map((feature) => (
                <li key={feature} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
              {path.cta}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </a>
        );
      })}
    </div>
  );
}

export function LifecycleRail({ stages }: { stages: LifecycleStage[] }) {
  return (
    <ol className="grid gap-3 lg:grid-cols-9">
      {stages.map((stage, index) => (
        <li
          key={stage.label}
          className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
              {index + 1}
            </span>
            <h3 className="text-sm font-semibold text-slate-950">{stage.label}</h3>
          </div>
          <p className="text-xs leading-5 text-slate-600">{stage.description}</p>
        </li>
      ))}
    </ol>
  );
}

export function FeatureSuiteSection({ suite }: { suite: FeatureSuite }) {
  const Icon = suiteIcons[suite.id];

  return (
    <section id={suite.id} className="scroll-mt-24 border-t border-slate-200 py-16">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-slate-950 text-white">
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold tracking-[0.24em] text-sky-700 uppercase">
            {suite.label}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{suite.title}</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">{suite.summary}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {suite.features.map((feature) => (
            <div
              key={feature}
              className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingSection({ plans }: { plans: PricingPlan[] }) {
  return (
    <section id="pricing" className="scroll-mt-24 bg-slate-950 py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-bold tracking-[0.24em] text-sky-300 uppercase">Pricing</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">Start free. Scale by workflow.</h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-lg border border-white/10 bg-white/[0.06] p-6">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-3 text-3xl font-bold">{plan.price}</p>
              <p className="mt-3 min-h-16 text-sm leading-6 text-slate-300">{plan.description}</p>
              <Link
                href={plan.cta.href}
                className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-md bg-white text-sm font-semibold text-slate-950 transition hover:bg-sky-100"
              >
                {plan.cta.label}
              </Link>
              <ul className="mt-6 space-y-2 text-sm text-slate-300">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ items }: { items: FaqItem[] }) {
  return (
    <section id="faq" className="scroll-mt-24 bg-white py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-bold tracking-[0.24em] text-sky-700 uppercase">FAQ</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Common questions</h2>
        <div className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200">
          {items.map((item) => (
            <details key={item.question} className="group p-5" open>
              <summary className="cursor-pointer list-none text-base font-semibold text-slate-950">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run section tests and verify they pass**

Run:

```bash
npm test -- app/components/landing/product-page-sections.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add app/components/landing/product-page-sections.tsx app/components/landing/product-page-sections.test.tsx
git commit -m "feat: add product landing page sections"
```

---

### Task 3: Replace Landing Page Composition

**Files:**

- Modify: `app/components/LandingPageClient.tsx`
- Create: `app/components/LandingPageClient.test.tsx`

**Interfaces:**

- Consumes: `productHero`, `audiencePaths`, `lifecycleStages`, `featureSuites`, `pricingPlans`, `faqItems`
- Consumes: `HeroProductSurface`, `AudiencePathGrid`, `LifecycleRail`, `FeatureSuiteSection`, `PricingSection`, `FaqSection`
- Produces: refreshed public product page at `/`
- Produces: refreshed public product page at `/` with no stale screenshot references

- [ ] **Step 1: Write failing page composition tests**

Create `app/components/LandingPageClient.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { LandingPageClient } from './LandingPageClient';

describe('LandingPageClient product page', () => {
  it('renders the product positioning and main CTAs', () => {
    render(<LandingPageClient />);

    expect(
      screen.getByRole('heading', {
        name: /run the rental lifecycle from mandate to monthly rent/i,
      })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /start free/i })[0]).toHaveAttribute(
      'href',
      '/register'
    );
    expect(screen.getAllByRole('link', { name: /see product walkthrough/i })[0]).toHaveAttribute(
      'href',
      '/demo'
    );
  });

  it('renders the three audience paths and lifecycle rail', () => {
    render(<LandingPageClient />);

    expect(screen.getByText('Private landlords')).toBeInTheDocument();
    expect(screen.getByText('Property companies')).toBeInTheDocument();
    expect(screen.getByText('Rental agents')).toBeInTheDocument();
    expect(screen.getByText('Mandate')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('renders the placement, management, tenant portal, and financial suites', () => {
    render(<LandingPageClient />);

    expect(screen.getByText('From landlord mandate to tenant handoff')).toBeInTheDocument();
    expect(screen.getByText('Manage the property and the relationship')).toBeInTheDocument();
    expect(screen.getByText('Give every tenant a portal after handoff')).toBeInTheDocument();
    expect(
      screen.getByText('Know what is paid, overdue, profitable, and export-ready')
    ).toBeInTheDocument();
  });

  it('does not render unsupported production integration claims', () => {
    render(<LandingPageClient />);

    expect(screen.queryByText(/live Airbnb sync/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/live Paystack payments/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/guaranteed on-time payments/i)).not.toBeInTheDocument();
  });

  it('does not render stale screenshot paths from old mockups', () => {
    const { container } = render(<LandingPageClient />);

    expect(container.innerHTML).not.toContain('/mockups/');
  });
});
```

- [ ] **Step 2: Run the page tests and verify they fail on old copy**

Run:

```bash
npm test -- app/components/LandingPageClient.test.tsx
```

Expected: FAIL because the old page does not render the new product headline and section headings.

- [ ] **Step 3: Replace `LandingPageClient.tsx` with the product page composition**

Modify `app/components/LandingPageClient.tsx` to this structure:

```tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Menu, X } from 'lucide-react';
import {
  audiencePaths,
  faqItems,
  featureSuites,
  lifecycleStages,
  pricingPlans,
  productHero,
} from './landing/product-page-content';
import {
  AudiencePathGrid,
  FaqSection,
  FeatureSuiteSection,
  HeroProductSurface,
  LifecycleRail,
  PricingSection,
} from './landing/product-page-sections';

const navItems = [
  { label: 'Paths', href: '#paths' },
  { label: 'Lifecycle', href: '#lifecycle' },
  { label: 'Features', href: '#placement' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export function LandingPageClient() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-950 selection:bg-sky-200">
      <header
        className={`fixed top-0 right-0 left-0 z-50 transition ${
          scrolled
            ? 'border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <img
              src={scrolled ? '/logos/logo-light.svg' : '/logos/logo-dark.svg'}
              alt="DominionDesk"
              width={160}
              height={32}
              className="h-8 w-auto"
            />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`text-sm font-semibold transition ${
                  scrolled
                    ? 'text-slate-600 hover:text-slate-950'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className={`text-sm font-semibold ${scrolled ? 'text-slate-700' : 'text-white'}`}
            >
              Log in
            </Link>
            <Link
              href={productHero.primaryCta.href}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#F59E0B] px-4 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600"
            >
              {productHero.primaryCta.label}
            </Link>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            className={`rounded-md p-2 md:hidden ${scrolled ? 'text-slate-950' : 'text-white'}`}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white p-4 shadow-xl md:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Log in
              </Link>
              <Link
                href={productHero.primaryCta.href}
                className="inline-flex h-10 items-center justify-center rounded-md bg-sky-700 px-4 text-sm font-semibold text-white"
              >
                {productHero.primaryCta.label}
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#08233F] pt-28 text-white md:pt-36">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:pb-24">
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold tracking-[0.28em] text-sky-300 uppercase">
                {productHero.eyebrow}
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl leading-[1.02] font-bold tracking-tight md:text-6xl">
                {productHero.headline}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                {productHero.subheadline}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={productHero.primaryCta.href}
                  className="inline-flex h-12 items-center justify-center rounded-md bg-[#F59E0B] px-6 text-base font-semibold text-white shadow-xl shadow-amber-500/20 transition hover:bg-amber-600"
                >
                  {productHero.primaryCta.label}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href={productHero.secondaryCta.href}
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 px-6 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  {productHero.secondaryCta.label}
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-2">
                {productHero.trustSignals.map((signal) => (
                  <span
                    key={signal}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-slate-100"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {signal}
                  </span>
                ))}
              </div>
            </div>
            <HeroProductSurface hero={productHero} />
          </div>
        </section>

        <section id="paths" className="scroll-mt-24 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold tracking-[0.24em] text-sky-700 uppercase">
              Choose your workflow
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950">
              One product, three rental operations paths.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              DominionDesk adapts to how you operate: owning a few rentals, running a portfolio, or
              placing tenants for landlords.
            </p>
            <div className="mt-10">
              <AudiencePathGrid paths={audiencePaths} />
            </div>
          </div>
        </section>

        <section id="lifecycle" className="scroll-mt-24 bg-slate-100 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold tracking-[0.24em] text-sky-700 uppercase">
              Lifecycle rail
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950">
              From mandate to reports, every handoff stays visible.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Placement and management live in the same operational line, so agencies and landlords
              do not lose context when a prospect becomes a tenant.
            </p>
            <div className="mt-10">
              <LifecycleRail stages={lifecycleStages} />
            </div>
          </div>
        </section>

        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {featureSuites.map((suite) => (
              <FeatureSuiteSection key={suite.id} suite={suite} />
            ))}
          </div>
        </div>

        <PricingSection plans={pricingPlans} />
        <FaqSection items={faqItems} />

        <section className="bg-[#08233F] py-20 text-white">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-xs font-bold tracking-[0.24em] text-sky-300 uppercase">
              Founding access
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">
              Move DominionDesk from project to product with your first live workflows.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-200">
              Start with the workflows you use today, then grow into placement, portal, financial,
              and operations control as your portfolio or agency expands.
            </p>
            <Link
              href={productHero.primaryCta.href}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-[#F59E0B] px-6 text-base font-semibold text-white shadow-xl shadow-amber-500/20 transition hover:bg-amber-600"
            >
              {productHero.primaryCta.label}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-10 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 sm:px-6 md:flex-row lg:px-8">
          <Link href="/" className="flex items-center">
            <img
              src="/logos/logo-dark.svg"
              alt="DominionDesk"
              width={160}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
          <div className="flex flex-wrap justify-center gap-5 text-sm">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <a href="mailto:support@dominiondesk.com" className="hover:text-white">
              Contact
            </a>
          </div>
          <div className="text-sm">© {new Date().getFullYear()} DominionDesk CRM.</div>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 4: Run page tests and verify they pass**

Run:

```bash
npm test -- app/components/LandingPageClient.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add app/components/LandingPageClient.tsx app/components/LandingPageClient.test.tsx
git commit -m "feat: redesign public landing page as product page"
```

---

### Task 4: Metadata And CTA Integrity

**Files:**

- Modify: `app/page.tsx`
- Create: `app/page.metadata.test.ts`

**Interfaces:**

- Consumes: `metadata` export from `app/page.tsx`
- Produces: product-positioned metadata for search and social cards

- [ ] **Step 1: Write failing metadata tests**

Create `app/page.metadata.test.ts`:

```ts
import { metadata } from './page';

describe('public page metadata', () => {
  it('positions DominionDesk as a South African rental operations platform', () => {
    expect(metadata.title).toBe('DominionDesk | Rental Operations OS for South Africa');
    expect(metadata.description).toBe(
      'Run placement, tenant management, rent collection, maintenance, documents, and reports from one South African rental operations platform.'
    );
  });

  it('uses matching Open Graph metadata', () => {
    expect(metadata.openGraph).toMatchObject({
      title: 'DominionDesk | Rental Operations OS for South Africa',
      description:
        'A South African rental operations platform for landlords, property companies, and rental agents.',
      url: 'https://dominiondesk.com',
      siteName: 'DominionDesk',
      locale: 'en_ZA',
      type: 'website',
    });
  });
});
```

- [ ] **Step 2: Run metadata tests and verify they fail on old metadata**

Run:

```bash
npm test -- app/page.metadata.test.ts
```

Expected: FAIL because the current metadata is landlord-only.

- [ ] **Step 3: Update metadata**

Modify `app/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { LandingPageClient } from './components/LandingPageClient';

export const metadata: Metadata = {
  title: 'DominionDesk | Rental Operations OS for South Africa',
  description:
    'Run placement, tenant management, rent collection, maintenance, documents, and reports from one South African rental operations platform.',
  openGraph: {
    title: 'DominionDesk | Rental Operations OS for South Africa',
    description:
      'A South African rental operations platform for landlords, property companies, and rental agents.',
    url: 'https://dominiondesk.com',
    siteName: 'DominionDesk',
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DominionDesk | Rental Operations OS for South Africa',
    description:
      'Manage placement, tenants, rent, maintenance, documents, and reports from one product.',
  },
};

export default function Page() {
  return <LandingPageClient />;
}
```

- [ ] **Step 4: Run metadata tests and verify they pass**

Run:

```bash
npm test -- app/page.metadata.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 4**

Run:

```bash
git add app/page.tsx app/page.metadata.test.ts
git commit -m "feat: update landing page product metadata"
```

---

### Task 5: Responsive And Build Verification

**Files:**

- Modify: `docs/PROJECT_STATUS.md`

**Interfaces:**

- Consumes: product landing page implemented in Tasks 1-4
- Produces: verified local landing page and updated project tracking note

- [ ] **Step 1: Run the focused landing-page tests**

Run:

```bash
npm test -- app/components/landing app/components/LandingPageClient.test.tsx app/page.metadata.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run type-check**

Run:

```bash
npm run type-check
```

Expected: PASS.

- [ ] **Step 3: Run focused lint on touched files**

Run:

```bash
npx eslint app/components/landing/product-page-content.ts app/components/landing/product-page-content.test.ts app/components/landing/product-page-sections.tsx app/components/landing/product-page-sections.test.tsx app/components/LandingPageClient.tsx app/components/LandingPageClient.test.tsx app/page.tsx app/page.metadata.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. Existing warnings unrelated to the landing page can be reported, but new errors from touched files must be fixed before continuing.

- [ ] **Step 5: Start local dev server**

Run:

```bash
npm run dev
```

Expected: the server prints a local URL, normally `http://localhost:3000`.

- [ ] **Step 6: Manually verify the page at the local URL**

Open `/` and confirm:

- Hero shows "Run the rental lifecycle from mandate to monthly rent."
- Product surface has Placement, Management, and Tenant Portal lanes.
- No stale `public/mockups/*` screenshots are visible on the page.
- Audience paths show Private landlords, Property companies, and Rental agents.
- Lifecycle rail appears as connected stage cards on desktop.
- On mobile width, the lifecycle reads vertically without text overlap.
- Placement suite includes mandates, applications, viewings, screening, placement completion, and portal handoff.
- Pricing shows Agency early access with "Talk to us".
- FAQ includes account types, tenant portal, EFT, multi-tenant units, reports, and external integration honesty.
- Main CTA links to `/register`.
- Walkthrough CTA links to `/demo`.

- [ ] **Step 7: Update project status**

Modify `docs/PROJECT_STATUS.md` by adding this audit note near the existing audit notes:

```md
- ✅ Public landing page redesigned as a product-led DominionDesk page for private landlords, property companies, and rental agents, including the new placement journey and tenant portal handoff.
```

Also update the Executive Summary sentence that describes the rental agent placement journey so it includes:

```md
The public product page now positions DominionDesk around the full rental lifecycle from mandate and application through tenant portal, rent collection, maintenance, documents, and reports.
```

- [ ] **Step 8: Commit Task 5**

Run:

```bash
git add docs/PROJECT_STATUS.md
git commit -m "docs: update status for product landing page"
```

---

## Self-Review

Spec coverage:

- Hero/product thesis: Task 3 and Task 4.
- Audience paths for private, company, and agent: Task 1, Task 2, Task 3.
- Lifecycle rail: Task 1, Task 2, Task 3.
- Placement suite: Task 1, Task 2, Task 3.
- Management suite: Task 1, Task 2, Task 3.
- Tenant portal: Task 1, Task 2, Task 3.
- Financial control and reports: Task 1, Task 2, Task 3.
- Operations layer: Task 1, Task 2, Task 3.
- Booking and inquiry workflows: Task 1, Task 2, Task 3.
- South African trust section: Task 1, Task 2, Task 3.
- Pricing and early access: Task 1, Task 2, Task 3.
- FAQ: Task 1, Task 2, Task 3.
- Honesty constraints: Task 1 tests and Task 3 tests.
- Verification: Task 5.
- Stale screenshot exclusion: Global constraints, Task 1, Task 2, Task 3, Task 5.

Placeholder scan:

- No `TBD`, `TODO`, "implement later", or unspecified edge handling appears in the implementation steps.

Type consistency:

- `ProductHero`, `AudiencePath`, `LifecycleStage`, `FeatureSuite`, `PricingPlan`, and `FaqItem` are defined in Task 1 and consumed by Task 2 and Task 3 with matching names.
