# Landing Page Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Overhaul the DominionDesk landing page to be honest, removing all fabricated metrics and fake testimonials, rewrite sections per spec, and create Terms, Privacy, and Demo pages.

**Architecture:** The main landing page lives at `app/page.tsx` as a client component. We'll split it into a server component (`page.tsx`) that exports metadata + a client component (`LandingPageClient.tsx`). Legal/demo pages go in `app/(public)/` route group with a shared layout containing the nav + footer extracted from the landing page.

**Tech Stack:** Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons

---

## Key Facts About Current Codebase

- **Landing page:** `app/page.tsx` — `'use client'`, 1575 lines, uses `app/components/Button.tsx` and `app/components/Card.tsx`
- **Logo:** `<img src={scrolled ? '/logos/logo-light.svg' : '/logos/logo-dark.svg'} />`
- **Color system:** `brand-600` (navy #0A2D67), `accent-500` (amber), Tailwind + custom
- **No existing (public) route group** — needs to be created
- **No existing terms/privacy/demo pages**

## What Must Be REMOVED (per spec)

- Animated counter bar: `R4.2M+`, `90%`, `13hrs`, `500+` (the entire stats bar section)
- Hero badge: "Join 500+ SA Property Managers Saving 13+ Hours/Week"
- Fake testimonials: Nombuso M., David K., Sarah V.
- Mobile app mention (Before/After section)
- "real-time calendar sync" / "zero double-bookings via sync" claims
- `'use client'` must move to child component so page.tsx can export `metadata`

## What Must Be FIXED

- "See How It Works" → links to `/contact` → change to `/demo`
- Footer Privacy Policy `#` → `/privacy`
- Footer Terms of Service `#` → `/terms`
- Footer Contact Support `#` → `mailto:support@dominiondesk.com`
- Sticky CTA "Start Free Trial" → links to `/contact` → change to `/register`

---

## Task 1: Split page.tsx into server + client components

**Files:**

- Create: `app/components/LandingPageClient.tsx` (move all client code here)
- Modify: `app/page.tsx` (server component with metadata + render client)

**Step 1:** Create `app/components/LandingPageClient.tsx` — copy entire current `app/page.tsx` content (keep `'use client'` at top), rename export from `App` to `LandingPageClient`

**Step 2:** Replace `app/page.tsx` with:

```tsx
import type { Metadata } from 'next';
import { LandingPageClient } from './components/LandingPageClient';

export const metadata: Metadata = {
  title: 'DominionDesk | Property Management Software for SA Landlords',
  description:
    'Stop chasing rent. DominionDesk is the all-in-one property management platform built specifically for South Africa. Automate rent reminders, manage tenants, and generate tax-ready reports.',
  openGraph: {
    title: 'DominionDesk | Property Management Software for SA Landlords',
    description:
      'The all-in-one property management platform built specifically for South African landlords.',
    url: 'https://dominiondesk.com',
    siteName: 'DominionDesk',
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DominionDesk | Property Management Software for SA Landlords',
    description:
      'Automate rent reminders, manage tenants, and track maintenance from one dashboard.',
  },
};

export default function Page() {
  return <LandingPageClient />;
}
```

---

## Task 2: Overhaul LandingPageClient.tsx — Remove dishonest content

**File:** `app/components/LandingPageClient.tsx`

Removals (find and delete each section):

1. The entire `testimonials` array at top (Nombuso, David, Sarah)
2. The `AnimatedCounter` and `useCountUp` and `TextReveal` and `ParallaxSection` components (no longer needed)
3. The **Stats Bar** section (lines ~607-654): "Social Proof / Stats Bar" section with animated counters
4. Hero badge: `"Join 500+ SA Property Managers Saving 13+ Hours/Week"`
5. The **Before/After Visual Comparison** section (~lines 962-1115) that includes mobile app and "real-time calendar sync" / "zero double-bookings via sync"
6. The **Testimonials** section (~lines 1257-1298)
7. Nav item "Testimonials" from nav array
8. Fix hero "See How It Works" button: `href="/contact"` → `href="/demo"`
9. Fix footer links: `#` → `/privacy`, `#` → `/terms`, `#` → `mailto:support@dominiondesk.com`
10. Fix sticky CTA "Start Free Trial" button: `href="/contact"` → `href="/register"`

---

## Task 3: Rewrite hero section and add pain section

**File:** `app/components/LandingPageClient.tsx`

### Hero changes:

- Replace hero badge with: `"Be one of our founding members — free access for 2 months"`
- Replace H1 with: "Stop Chasing Rent. Start Building Wealth."
- Replace subheadline with spec text
- Replace "Get 2 Months Free — Start Now" stays (already correct)
- Replace "See How It Works" with "See a 2-Minute Demo" → `/demo`
- Replace trust badges: "No credit card required", "Up to 2 properties free", "Built for South Africa"

### Pain section (replace current "You Didn't Become a Landlord" 2-column layout):

Replace with 6 pain point cards in 2x3 grid:

1. 📱 Chasing tenants on WhatsApp every month for rent
2. 📊 Managing your portfolio on Excel spreadsheets
3. 🔧 Maintenance requests getting lost in your inbox
4. 📄 Scrambling to find documents at tax time
5. ⏰ Sending manual payment reminders one by one
6. 😤 No idea which property is actually profitable

Heading: "You Didn't Become a Landlord to Become a Full-Time Admin"
Subheading: "If this sounds familiar, DominionDesk was built for you."

---

## Task 4: Update features, SA section, pricing, and FAQ

**File:** `app/components/LandingPageClient.tsx`

### Features section:

- Update heading: "Everything a South African Landlord Actually Needs"
- Update subheading: "No bloat. No features you'll never use. Just the tools that save you time and money."
- Update `featuresList.longTerm` with 6 items from spec
- Update `featuresList.shortTerm` with 6 items from spec

### Replace testimonials section with honest fact cards:

3 blockquote-style cards attributed to features (not people), plus early-access note below.

### SA section:

Update the 3 existing feature items to 4 items per spec:

1. Native ZAR Support
2. EFT-First Workflow
3. POPIA-Aware Data Handling
4. Local Support

### Pricing section:

Add pricing example callout box below the 3 cards.

### FAQ:

Replace 4 questions with 7 questions from spec.

### Final CTA:

- Update heading to spec text
- Update subheading to spec text
- Add 3 trust badges below the button

---

## Task 5: Create (public) route group and layout

**Files:**

- Create: `app/(public)/layout.tsx`

Simple layout that wraps children (the legal pages are standalone, with their own minimal nav+footer — reuse the same header/footer pattern from LandingPageClient as a SharedLayout component):

```tsx
// app/(public)/layout.tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

Note: Each legal page will include its own nav/footer directly, keeping things simple.

---

## Task 6: Create Terms of Service page

**File:** `app/(public)/terms/page.tsx`

Server component. Include a minimal shared nav (logo + login link) and footer. Full content from spec.

---

## Task 7: Create Privacy Policy page

**File:** `app/(public)/privacy/page.tsx`

Same structure as terms page. Full content from spec.

---

## Task 8: Create Demo page

**File:** `app/(public)/demo/page.tsx`

Same structure. Content:

- Heading: "See DominionDesk in Action"
- Subheading from spec
- 16:9 placeholder div with navy background + Play icon + TODO comment
- Primary CTA: "Start Your Free Trial" → `/register`
- Secondary CTA: "Book a 15-Min Walkthrough" → `mailto:support@dominiondesk.com?subject=Book%20a%20Walkthrough`

---

## Task 9: Final verification

1. Search codebase for "500+", "Nombuso", "David K", "Sarah V" — confirm none on public pages
2. Search for "0.0M", "0hrs", "0%" — confirm counters removed
3. Confirm `/privacy`, `/terms`, `/demo` resolve to actual pages
4. Confirm hero primary CTA links to `/register`
5. Run `npx tsc --noEmit` to check for TypeScript errors
