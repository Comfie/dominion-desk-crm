# Claude Code Prompt — DominionDesk Landing Page Overhaul

Paste this entire prompt into Claude Code.

---

## CONTEXT

You are working on the DominionDesk property management CRM — a Next.js 15 SaaS application for South African landlords. The public-facing landing page lives at the root route. The app is live at dominiondesk.com.

I need you to overhaul the landing page to be highly converting and honest, then create the missing legal pages. Work through each task in order. Do not skip any section.

---

## TASK 1 — AUDIT THE LANDING PAGE

First, locate and read the current landing page file. It is likely at one of these paths:

- `app/pitch/page.tsx`
- `app/page.tsx`
- `app/(marketing)/page.tsx`

Also check for any related components in:

- `components/landing/`
- `components/marketing/`
- `components/home/`

Read ALL of these files before making any changes. Understand the full current structure.

---

## TASK 2 — REMOVE EVERYTHING DISHONEST OR UNBUILT

Make the following removals/fixes. These are CRITICAL — fake social proof destroys trust:

**Remove entirely:**

- All metric counters that are zero or fabricated: "R0.0M+ Rent Collected", "0% On-Time Payments", "0hrs Saved", "0+ Properties Managed"
- The "Join 500+ SA Property Managers" claim (we have no users yet)
- All three testimonials from "Nombuso M.", "David K.", and "Sarah V." — these are fictional
- Any mention of a "mobile app" — we do not have one
- Any claim about "real-time calendar sync" or "zero double-bookings via sync" — Airbnb/Booking.com sync is not yet implemented
- The "500+ SA Property Managers Saving 13+ Hours/Week" badge in the hero

**Fix broken links:**

- "See How It Works" currently links to `/contact` — change it to open a mailto: or link to a `/demo` page we will create
- Privacy Policy footer link currently goes to `#` — update to `/privacy`
- Terms of Service footer link currently goes to `#` — update to `/terms`
- Contact Support footer link — update to `mailto:support@dominiondesk.com`

---

## TASK 3 — REWRITE THE LANDING PAGE

Rebuild the landing page with the following sections in this exact order. Use the existing design system (shadcn/ui, Tailwind CSS, existing color scheme with navy #0A2D67 and bright blue #3B82F6). Keep all existing mockup images. Make it mobile-first.

### PAGE METADATA (SEO)

Before building the layout sections, ensure the `page.tsx` file exports a Next.js `metadata` object optimized for the South African market. Add or update the metadata export at the top of the file to match this exactly:

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DominionDesk | Property Management Software for SA Landlords",
  description: "Stop chasing rent. DominionDesk is the all-in-one property management platform built specifically for South Africa. Automate rent reminders, manage tenants, and generate tax-ready reports.",
  openGraph: {
    title: "DominionDesk | Property Management Software for SA Landlords",
    description: "The all-in-one property management platform built specifically for South African landlords.",
    url: "[https://dominiondesk.com](https://dominiondesk.com)",
    siteName: "DominionDesk",
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DominionDesk | Property Management Software for SA Landlords",
    description: "Automate rent reminders, manage tenants, and track maintenance from one dashboard.",
  },
};

---

### SECTION 1 — HERO

**Headline (H1):**
Stop Chasing Rent. Start Building Wealth.

**Subheadline:**
DominionDesk is the all-in-one property management platform built specifically for South African landlords. Automate rent reminders, manage tenants, track maintenance, and generate tax-ready reports — all from one dashboard.

**Two CTA buttons:**
- Primary (filled): "Get 2 Months Free — No Card Needed" → links to `/register`
- Secondary (outlined): "See a 2-Minute Demo" → links to `https://dominiondesk.com/demo` (placeholder, we will add this later)

**Three trust badges below the buttons:**
- ✓ No credit card required
- ✓ Up to 2 properties free
- ✓ Built for South Africa

**Remove the animated counters entirely. Replace with a single honest badge:**
> "Be one of our founding members — free access for 2 months"

---

### SECTION 2 — PAIN SECTION (THE PROBLEM)

**Heading:** You Didn't Become a Landlord to Become a Full-Time Admin

**Subheading:** If this sounds familiar, DominionDesk was built for you.

**Six pain point cards in a 2x3 grid (icon + short text):**
1. 📱 Chasing tenants on WhatsApp every month for rent
2. 📊 Managing your portfolio on Excel spreadsheets
3. 🔧 Maintenance requests getting lost in your inbox
4. 📄 Scrambling to find documents at tax time
5. ⏰ Sending manual payment reminders one by one
6. 😤 No idea which property is actually profitable

---

### SECTION 3 — SOLUTION / HOW IT WORKS

Keep the existing 6-step "From Setup to Success in Minutes" section with its mockup images. Just update the heading to:

**Heading:** Everything Running in Under 10 Minutes

**Subheading:** No technical skills. No long setup. Just add your properties and go.

Keep the 6 steps as-is (they are good).

---

### SECTION 4 — FEATURES (WHAT'S ACTUALLY BUILT)

**Heading:** Everything a South African Landlord Actually Needs

**Subheading:** No bloat. No features you'll never use. Just the tools that save you time and money.

Show two tabs: "Long-Term Rentals" and "Short-Term / Airbnb"

**Long-Term Rentals tab — 6 feature cards:**
1. **Automated Rent Reminders** — Set it once. DominionDesk sends payment reminders via email automatically, 7 days before and on due date. No more awkward "just checking in" messages.
2. **Tenant Portal** — Tenants get their own login. They view invoices, upload proof of payment, log maintenance, and access their lease documents. You get less admin. They get transparency.
3. **Proof of Payment Upload** — Tenants upload their EFT proof directly. You see it instantly and mark the payment as received. No more emailing back and forth.
4. **Expense & Tax Tracking** — Log every expense per property. Mark items as tax-deductible. Generate a full annual tax summary report with one click.
5. **Document Vault** — Store leases, FICA docs, inspection reports, and insurance documents per property and per tenant. Organised, searchable, always accessible.
6. **9 Financial Reports** — Revenue, payments, cash flow, maintenance costs, occupancy, aging, leases, and more. All exportable to CSV for your accountant.

**Short-Term / Airbnb tab — 6 feature cards:**
1. **Booking Management** — Create and manage bookings with full guest details, pricing calculation, and status tracking (pending → confirmed → checked-in → completed).
2. **Availability & Conflict Detection** — The system automatically blocks conflicting dates and warns you before a double-booking can happen.
3. **Guest Communication** — Send booking confirmations, check-in instructions, and follow-up messages. Set up automation rules to send messages triggered by booking events.
4. **Inquiry Pipeline** — Track every inquiry from every source (direct, Airbnb, WhatsApp). Convert inquiries to bookings in one click. Never lose a lead again.
5. **Cleaning Fee & Pricing Rules** — Configure base rates, cleaning fees, and seasonal pricing per property. Automatic total calculation for every booking.
6. **Booking Reports** — Revenue per property, occupancy rates, booking sources breakdown, and average daily rate. Know exactly what's working.

---

### SECTION 5 — SOCIAL PROOF (HONEST VERSION)

**Heading:** Built for the South African Rental Reality

**Subheading:** No fluff. No made-up numbers. Here's what DominionDesk actually does.

Replace the fake testimonials with three honest "fact cards" that highlight real product capabilities:

**Card 1:**
> "Automated rent reminders go out automatically — on whatever day of the month you configure, to every tenant, with a full invoice attached. No manual work."
> — Payment Reminder System

**Card 2:**
> "Tenants upload proof of payment directly through their portal. You get notified. No more WhatsApp attachments or email threads just to confirm an EFT."
> — Tenant Payment Portal

**Card 3:**
> "Full expense tracking per property with tax-deductible flags. Export a complete tax summary at year-end. No more spreadsheet chaos in February."
> — Financial Reporting Module

Add a small note below the cards:
> *We're in early access. Be one of our first founding members and help shape the product — free for 2 months, no card needed.*

---

### SECTION 6 — SOUTH AFRICA SECTION

Keep this section but update the copy. Replace "POPIA Compliant" details with more specific and honest content:

**Heading:** Built for the South African Reality

**Four cards:**
1. **Native ZAR Support** — Every report, invoice, and payment is in Rand. No currency conversion. No dollar pricing. Built for local portfolios.
2. **EFT-First Workflow** — SA landlords run on EFT. Our system is built around it. Tenants upload proof of payment. Landlords confirm. Done.
3. **POPIA-Aware Data Handling** — Tenant data is stored securely with access controls. You control who sees what. No data sold to third parties. Ever.
4. **Local Support** — We're based in South Africa. Same timezone. We understand load shedding, municipal billing, and the SA rental housing act.

---

### SECTION 7 — PRICING

Keep the existing pricing section structure but make these changes:

**Heading:** Simple, Transparent Pricing

**Subheading:** Start free. Pay only when you're ready to grow.

**Three cards:**

**Card 1 — Free Trial**
- Title: "Free Trial"
- Price: R0 / 2 months
- Subtext: "Up to 2 properties. Full access. No card."
- CTA: "Start Free Trial" → `/register`
- Features:
  - Up to 2 properties
  - Full feature access
  - Tenant portal included
  - Financial reports included
  - No credit card required

**Card 2 — Starter (MOST POPULAR badge)**
- Title: "Starter"
- Price: R299/month
- Subtext: "Everything you need for up to 2 properties"
- CTA: "Get Started" → `/register`
- Features:
  - Up to 2 properties
  - Automated payment reminders
  - Tenant portal with proof of payment upload
  - 9 financial reports + CSV export
  - Document vault
  - Maintenance request tracking
  - Email support

**Card 3 — Growth**
- Title: "Growth"
- Price: R299 + 4% per property/month
- Subtext: "Min R99 · Max R999 per additional property"
- CTA: "Get Started" → `/register`
- Features:
  - Everything in Starter
  - Unlimited properties
  - First 2 properties free (base fee only)
  - Multi-tenant per property (room rentals)
  - Team member access
  - Priority support
  - Booking & Airbnb management

Add a simple pricing example below the cards:
> **Example:** 5 properties at R8,000/month avg rent = R299 base + (3 × R320) = **R1,259/month total**. That's less than R252 per property.

---

### SECTION 8 — FAQ

Replace current FAQ with these 7 questions:

**Q: Do I need technical skills to set up DominionDesk?**
A: None at all. If you can use WhatsApp or Excel, you can use DominionDesk. Most landlords are fully set up within 10 minutes. We also offer email support if you need a hand.

**Q: How does the 2-month free trial work?**
A: Sign up, add up to 2 properties, and use every feature completely free for 2 months. No credit card required. At the end of your trial, you can subscribe to continue or export all your data and leave — no hard feelings.

**Q: What happens to my data if I cancel?**
A: It's yours. You can export all tenant information, payment history, documents, and reports at any time in CSV format. We will never hold your data hostage or delete it without notice.

**Q: Does it work for both Airbnb and long-term rentals?**
A: Yes — that's exactly what it's built for. You can manage short-term bookings and long-term leases from the same dashboard. Each property can be configured for its rental type.

**Q: How does the tenant portal work?**
A: Tenants receive an email invitation to create their own login. From their portal, they can view invoices, upload proof of EFT payment, log maintenance requests, and access their lease documents. You stay in control of what they can see.

**Q: Is my data secure?**
A: Yes. All data is stored on encrypted, cloud-hosted servers. Access is role-based — only you and the team members you invite can see your data. We comply with South Africa's POPIA regulations.

**Q: What payment methods do tenants use?**
A: Currently EFT (the standard in SA). Tenants transfer rent to your bank account and upload proof of payment through their portal. You confirm receipt and the system updates automatically. Online card payments are coming soon.

---

### SECTION 9 — FINAL CTA BANNER

**Heading:** Your Tenants Won't Pay Themselves. But DominionDesk Can Remind Them.

**Subheading:** Join the founding member group. Get 2 months completely free — no credit card, no commitment. Be one of the first landlords to manage their entire portfolio from one dashboard built for South Africa.

**CTA Button:** "Get 2 Months Free — Start Now" → `/register`

**Three badges:**
- No credit card required
- Set up in under 10 minutes
- Cancel anytime, export your data

---

## TASK 4 — CREATE THE TERMS OF SERVICE PAGE

Create the file at `app/(public)/terms/page.tsx` (or wherever public routes live in this project).

Use the existing layout wrapper (navbar + footer) that the landing page uses.

**Page title:** Terms of Service

**Effective date:** 1 March 2026

**Content:**

---

# Terms of Service

**Last updated: 1 March 2026**

Please read these Terms of Service ("Terms") carefully before using DominionDesk ("the Service"), operated by DominionDesk (Pty) Ltd ("we", "us", or "our").

By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.

## 1. The Service

DominionDesk is a property management software platform designed to help landlords manage properties, tenants, payments, maintenance, and financial records. The Service is provided on a subscription basis.

## 2. Eligibility

You must be at least 18 years old and have the legal capacity to enter into a binding agreement to use this Service. By registering, you confirm that you meet these requirements.

## 3. Account Registration

You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and current information during registration and to update this information when it changes. You are responsible for all activity that occurs under your account.

## 4. Subscription & Billing

- The Service is offered on a free trial basis (2 months, up to 2 properties) and on paid subscription plans.
- After the trial period, continued use of the Service beyond 2 properties requires a paid subscription.
- Subscription fees are billed monthly in South African Rand (ZAR) via PayFast.
- Fees are non-refundable except as required by South African consumer protection law.
- We reserve the right to change pricing with 30 days' written notice to existing subscribers.

## 5. Acceptable Use

You agree not to:
- Use the Service for any unlawful purpose
- Attempt to gain unauthorised access to any part of the Service
- Upload malicious files or content
- Impersonate any person or entity
- Use the Service to store data unrelated to property management

## 6. Your Data

You retain ownership of all data you upload or create in the Service. We do not sell your data to third parties. You can export your data at any time. See our Privacy Policy for full details on how we handle your data.

## 7. Tenant Data & POPIA Compliance

You, as the landlord/account holder, are the responsible party for any personal information you collect and store about your tenants within the Service. You must ensure you have lawful grounds to collect and process tenant personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA).

## 8. Intellectual Property

The DominionDesk platform, including all software, design, and content, is the intellectual property of DominionDesk (Pty) Ltd. You are granted a limited, non-exclusive, non-transferable licence to use the Service for its intended purpose.

## 9. Uptime & Availability

We aim for maximum uptime but do not guarantee uninterrupted availability. We will not be liable for temporary downtime due to maintenance, hosting issues, or circumstances beyond our control.

## 10. Limitation of Liability

To the maximum extent permitted by South African law, DominionDesk shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount you paid in the 3 months preceding the claim.

## 11. Termination

You may cancel your subscription at any time from your account settings. We may suspend or terminate your account if you breach these Terms, with or without notice depending on the severity of the breach. Upon termination, you have 30 days to export your data.

## 12. Changes to These Terms

We may update these Terms from time to time. We will notify you by email at least 14 days before material changes take effect. Continued use of the Service after the effective date constitutes acceptance.

## 13. Governing Law

These Terms are governed by the laws of the Republic of South Africa. Any disputes shall be subject to the jurisdiction of the South African courts.

## 14. Contact

If you have questions about these Terms, contact us at:
**Email:** legal@dominiondesk.com
**Website:** dominiondesk.com

---

## TASK 5 — CREATE THE PRIVACY POLICY PAGE

Create the file at `app/(public)/privacy/page.tsx`.

Use the same layout wrapper.

**Page title:** Privacy Policy

**Content:**

---

# Privacy Policy

**Last updated: 1 March 2026**

DominionDesk (Pty) Ltd ("we", "us", "our") is committed to protecting your personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA). This Privacy Policy explains what information we collect, how we use it, and your rights.

## 1. Who This Applies To

This policy applies to:
- Landlords and property managers who use DominionDesk ("Users")
- Tenants who access the Tenant Portal
- Visitors to dominiondesk.com

## 2. Information We Collect

**From Users (Landlords):**
- Name, email address, and password (hashed)
- Company name and contact details
- Banking details (stored encrypted, used for invoice generation only)
- Property information, lease data, expense records

**From Tenants (via the Tenant Portal):**
- Name, email address, phone number
- South African ID number (optional, stored for FICA compliance)
- Employment information (optional, for lease applications)
- Proof of payment documents uploaded

**Automatically collected:**
- Browser type, IP address, and usage logs (for security and performance)
- Session data via secure cookies

## 3. How We Use Your Information

We use personal information to:
- Provide and operate the DominionDesk service
- Send automated rent reminders and invoices on your behalf
- Generate financial reports and tax summaries
- Send service-related notifications (e.g. payment received, maintenance updates)
- Provide customer support
- Improve the platform based on usage patterns

We do NOT:
- Sell your data to any third party
- Use your data for advertising
- Share tenant data with any party other than the account-holding landlord

## 4. Data Storage & Security

- All data is stored on encrypted, cloud-hosted servers
- Passwords are hashed using industry-standard algorithms and never stored in plain text
- Access to data is role-based — only you and team members you authorise can see your data
- File uploads (documents, proof of payment) are stored via UploadThing on secure cloud storage
- We use HTTPS for all data transmission

## 5. Data Retention

- Your data is retained for as long as your account is active
- If you cancel, your data is retained for 30 days to allow export, then securely deleted
- Audit logs may be retained for up to 12 months for security purposes

## 6. Your Rights Under POPIA

As a data subject, you have the right to:
- **Access** — Request a copy of the personal information we hold about you
- **Correction** — Request correction of inaccurate information
- **Deletion** — Request deletion of your personal information (subject to legal retention requirements)
- **Objection** — Object to the processing of your personal information
- **Export** — Export all your data from the platform at any time

To exercise these rights, contact us at privacy@dominiondesk.com.

## 7. Tenant Data — Landlord Responsibility

When you use DominionDesk to store your tenants' personal information, you are the responsible party under POPIA. You must:
- Have a lawful basis for collecting tenant information
- Inform tenants that their information is stored on DominionDesk
- Ensure you do not collect more information than is necessary
- Respond to any tenant requests regarding their personal information

## 8. Cookies

We use essential cookies for session management and authentication. We do not use advertising or tracking cookies. You can disable cookies in your browser settings, but this may affect your ability to log in.

## 9. Third-Party Services

We use the following third-party services to operate the platform:
- **Vercel** — Hosting and deployment
- **Railway** — Database hosting
- **UploadThing** — File storage
- **Resend** — Transactional email delivery
- **PayFast** — Payment processing (subscription billing)

Each of these providers has their own privacy policies and data processing agreements.

## 10. Children's Privacy

DominionDesk is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from minors.

## 11. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you by email when material changes are made. The "Last updated" date at the top of this page will always reflect the most recent version.

## 12. Contact Us

For any privacy-related questions or to exercise your rights:

**Email:** privacy@dominiondesk.com
**Information Officer:** DominionDesk (Pty) Ltd
**Website:** dominiondesk.com

To lodge a complaint about how we handle your personal information, you may also contact the Information Regulator of South Africa at inforeg.org.za.

---

## TASK 6 — CREATE A CONVERTING DEMO PAGE

Create `app/(public)/demo/page.tsx`.

**Content:**
- Heading: "See DominionDesk in Action"
- Subheading: "Watch this quick walkthrough to see how South African landlords manage their portfolios, or book a personalized tour."
- **Video Section:** Create a responsive 16:9 placeholder `div` for a video embed. Give it a subtle navy background (`bg-[#0A2D67]`) and center a Play icon in the middle. Add a comment in the code: `// TODO: Replace with Loom or YouTube iframe`.
- **CTA Section (below the video):**
  - Primary Button (Filled): "Start Your Free Trial" → `/register`
  - Secondary Button (Outlined): "Book a 15-Min Walkthrough" → `mailto:support@dominiondesk.com?subject=Book%20a%20Walkthrough` (Add a code comment here noting this can be swapped for a Calendly link later).

---

## TASK 7 — PRICING (WITH CLARIFIED CALCULATION)

Keep the existing pricing section structure but make these changes:

**Heading:** Simple, Transparent Pricing

**Subheading:** Start free. Pay only when you're ready to grow.

**Three cards:**

**Card 1 — Free Trial**
- Title: "Free Trial"
- Price: R0 / 2 months
- Subtext: "Up to 2 properties. Full access. No card."
- CTA: "Start Free Trial" → `/register`
- Features:
  - Up to 2 properties
  - Full feature access
  - Tenant portal included
  - Financial reports included
  - No credit card required

**Card 2 — Starter (MOST POPULAR badge)**
- Title: "Starter"
- Price: R299/month
- Subtext: "Everything you need for up to 2 properties"
- CTA: "Get Started" → `/register`
- Features:
  - Up to 2 properties
  - Automated payment reminders
  - Tenant portal with proof of payment upload
  - 9 financial reports + CSV export
  - Document vault
  - Maintenance request tracking
  - Email support

**Card 3 — Growth**
- Title: "Growth"
- Price: R299 + 4% of rental income
- Subtext: "Per additional property/month (Min R99 · Max R999)"
- CTA: "Get Started" → `/register`
- Features:
  - Everything in Starter
  - Unlimited properties
  - First 2 properties free (base fee only)
  - Multi-tenant per property (room rentals)
  - Team member access
  - Priority support
  - Booking & Airbnb management

Add a simple pricing example below the cards. Place this inside a subtle, slightly darker UI box or callout so it stands out:
> **Example:** You have 5 properties with an average rental income of R8,000/month.
> R299 base + (3 additional properties × R320 [which is 4% of R8k]) = **R1,259/month total**.
> That's less than R252 per property to automate your entire portfolio.

---

## TASK 8 — FINAL CHECK

After all changes are made:

1. Search the entire codebase for the strings "500+" and "Nombuso" and "David K" and "Sarah V" — confirm none remain on any public-facing page.
2. Search for "0.0M" and "0hrs" and "0%" — confirm counters are removed.
3. Confirm all three footer links (`/privacy`, `/terms`, `/demo`) resolve to actual pages.
4. Confirm the hero CTA primary button links to `/register`.
5. Check that no TypeScript errors were introduced in the files you touched — run a quick type check if possible.

---

## IMPORTANT NOTES FOR CLAUDE CODE

- Do NOT invent new UI components if existing shadcn/ui components cover the need.
- Preserve the existing color scheme: navy `#0A2D67`, bright blue `#3B82F6`.
- Keep all existing mockup images (`.svg` and `.jpg` files) — do not remove them.
- All new pages must use the same layout wrapper (navbar + footer) as the existing landing page.
- The tone across all pages is: professional, direct, SA-market aware. No hype, no fake metrics.
- If you encounter a component or import you're unsure about, read the file first before modifying.
```
