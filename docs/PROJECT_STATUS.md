# Project Status

Last updated: 2026-07-06

Property CRM is a Next.js application for South African landlords, property managers, and rental agencies. It covers property operations, rent collection, tenants, maintenance, documents, reporting, subscriptions, and an agency rental placement workflow.

## Current Snapshot

- Core landlord workflows are implemented: properties, tenants, bookings, rent collection, maintenance, expenses, documents, inspections, reports, dashboard, and settings.
- PayFast subscription billing is implemented in the app, including subscription initiation, ITN handling, cancellation, billing history, and admin subscription monitoring.
- Team member management is implemented with invitations, roles, permission presets, and `/settings/team`.
- Messaging automation UI and backend services exist, with email delivery implemented and SMS/WhatsApp left as future channels.
- Multi-tenant property support is implemented with unit labels and per-lease payment generation.
- Rental agency placement has an implemented foundation: agency-only access, landlord owners, mandates, viewings, applications, applicant screening, transactional placement completion, and tenant portal activation handoff.
- Several integrations and payment providers are placeholders or partial, especially Airbnb, Booking.com, Google Calendar sync, Paystack, Stripe, SMS, and WhatsApp.
- `vercel.json` currently has no active cron schedules. Automation endpoints exist, but production scheduling must be enabled before relying on automatic jobs.

## Tech Stack

- Next.js 16 App Router, React 19, TypeScript
- PostgreSQL with Prisma 7
- NextAuth.js
- Tailwind CSS and shadcn-style Radix components
- Vitest, Testing Library, jsdom
- UploadThing for uploaded files
- Nodemailer/SMTP for email
- PayFast for subscription billing
- Vercel hosting target

## Implemented Product Areas

### Foundation

- Authentication with roles: `SUPER_ADMIN`, `CUSTOMER`, and `TENANT`
- Password reset and forced first-login password change
- Workspace scoping through `organizationId`
- Audit logging for mutations
- Shared error classes and API error handler
- Service/repository pattern for the main feature modules

### Property Management

- Property CRUD, search, status, images, rental type, pricing, amenities, and import/export utilities
- Multi-tenant property mode via `allowsMultipleTenants`
- Optional unit labels on leases
- Property valuation records and summary cards
- Property-specific document folders and default folder templates

### Tenant And Lease Management

- Tenant profiles, documents, emergency contacts, employment details, and portal access
- Tenant-to-property assignments with lease start/end dates, rent, deposit, and unit label
- Lease end date validation in API and UI flows
- Tenant payment history pages and portal payment history

### Financials

- Payment tracking, invoice numbers, rent collection grid, tenant ledger, payment reminders, and payment proof flow
- Manual invoice creation with line items
- Expenses with categories, paid status, tax deductible tracking, and property linkage
- Reports for tax summary, revenue, tenant payments, aging receivables, maintenance costs, occupancy, lease expiration, cash flow, and analytics
- CSV export on reports, rent collection, and tenant payment ledger

### Billing

- PayFast recurring subscription billing
- Dynamic subscription calculation
- Subscription status, billing history, cancellation, and admin monitoring
- PayFast transaction records and invoice records

### Maintenance, Inspections, Tasks

- Maintenance request CRUD, categories, priority, workflow status, photos, contractor assignment, cost tracking, and email notifications
- Inspection list/detail/create flows and inspection items
- Task management with status, priority, type, due dates, and related entities

### Messaging

- Direct messages, read/unread state, search, and message records
- Automation rules with 15 trigger types, property/rental filters, offsets, time-of-day scheduling, template variables, and scheduled queue UI
- Email channel implemented; SMS/WhatsApp stubs remain future work

### Admin And Team

- Super admin user management
- System settings
- Team member invitations, roles, permissions, and statistics
- Admin subscription monitoring

### Agency Placement

- Agency-only capability gating through account type checks, dashboard navigation, and placement route guard.
- Placement data foundation in Prisma:
  - `LandlordOwner`
  - `RentalMandate`
  - `Viewing`
  - `RentalApplication`
  - `ApplicantScreening`
- Placement UI pages:
  - `/placement`
  - `/placement/applications`
  - `/placement/applications/new`
  - `/placement/viewings`
  - `/placement/viewings/new`
  - `/placement/landlords`
  - `/placement/landlords/new`
  - `/placement/landlords/[id]/edit`
  - `/placement/mandates`
  - `/placement/mandates/new`
  - `/placement/mandates/[id]/edit`
- Placement APIs:
  - `/api/placement/applications`
  - `/api/placement/applications/[id]/screening`
  - `/api/placement/applications/[id]/complete`
  - `/api/placement/viewings`
  - `/api/placement/viewings/[id]`
  - `/api/placement/landlords`
  - `/api/placement/landlords/[id]`
  - `/api/placement/mandates`
  - `/api/placement/mandates/[id]`
- Landlord owner and mandate management includes owner details, mandate type, exclusivity, status, start/end dates, placement fee percentage, management fee percentage, VAT flag, notes, and mandate document URL.
- Viewing workflow supports inquiry/application-linked scheduling, status updates, attendee contact details, assignment, feedback, and follow-up notes.
- Application workflow supports applicant intake, inquiry-to-application conversion, requested/proposed lease details, assignment, and workflow statuses from new application through placed/withdrawn.
- Applicant screening checklist tracks credit, affordability, employer reference, landlord reference, FICA, income, rent-to-income ratio, risk score, consent, and notes.
- Placement completion is transactional: screening must pass, the applicant is linked to an existing tenant or converted into a tenant, the lease assignment is created, and the application moves to `PLACED`.
- Tenant portal activation is an explicit post-placement handoff through the existing tenant portal access flow.
- Focused tests exist for account capabilities, dashboard navigation, placement DTOs/services/repositories, placement completion API, and tenant portal activation.
- Remaining placement work:
  - Commission and placement fee reporting
  - Placement analytics and agent performance reporting
  - End-to-end QA with real agency users, tenant portal activation, and sample placement data
  - Optional notification automation for viewing confirmations, screening updates, approval/rejection, and placement completion

## Partial Or Risky Areas

- `vercel.json` has an empty `crons` array, so scheduled jobs are not active in deployment until configured.
- Paystack and Stripe payment endpoints are mocked or placeholder-style flows.
- Airbnb, Booking.com, Google Calendar, and other integration syncs are not production-grade.
- Calendar export routes exist under `/api/calendar/*`, but real external sync should be treated as incomplete.
- SMS and WhatsApp automation delivery are not implemented.
- AI message enhancement has UI/model support but no complete processing flow.
- Several API routes still use Prisma directly instead of feature services/repositories, including reports, documents, inquiries, tasks, inspections, integrations, templates, and some admin routes.
- Public API endpoints exist under `/api/public/*`; public-facing consumers should be verified before launch.
- PayFast needs real sandbox/production validation before billing is treated as launch-ready.
- Agency placement should be treated as a beta/preview workflow until full end-to-end QA, sample data review, and commission/fee reporting are complete.

## Beta Launch Scope

Position the beta as an operations-first landlord CRM for long-term rentals:

- Rent collection
- Arrears visibility
- Lease tracking
- Tenant self-service
- Maintenance coordination
- Documents and inspections

Do not position beta around these until they are production-ready:

- Agency placement as a primary promise outside a controlled agency preview
- Live online card payments outside PayFast subscriptions
- Airbnb or Booking.com direct sync
- SMS or WhatsApp automation
- Mock/demo payment flows

## P0 Before Inviting Testers

- Remove demo and mock exposure from production flows.
- Decide whether cron jobs should be enabled in `vercel.json`; if yes, add schedules and verify `CRON_SECRET`.
- Validate tenant portal identity resolution end to end.
- Validate the agency placement journey end to end with an `AGENCY` account, including owner, mandate, viewing, application, screening, placement completion, tenant lease assignment, and portal activation.
- Validate rent generation, proof upload, landlord verification, reminders, and invoice viewing with one landlord and one tenant.
- Run type-check, tests, and production build.
- Validate PayFast subscription initiation and ITN handling in sandbox.
- Configure production environment variables and secrets.

## P1 First Tester Cohort

- 3 to 5 landlords
- 1 to 20 properties each
- Primarily long-term rental workflows
- Concierge onboarding and data import support
- Weekly feedback calls

## Success Metrics

- 80% of testers use rent collection weekly.
- 60% of testers use tenant portal features.
- 50% of testers log or track maintenance inside the system.
- At least 3 testers say they would be materially worse off without the product.

## Product Direction

Focus near-term roadmap work on:

- Late fee rules, promise-to-pay tracking, arrears escalation, and notice templates
- Lease renewal pipeline, vacancy planning, deposit reconciliation, and move-in/move-out inspection comparison
- Vendor directory, quote capture, completion evidence, and maintenance SLA tracking
- Landlord command center for today’s collections, overdue tenants, expiring leases, vacancies, and unresolved maintenance
