# Architecture Guide

This guide describes the patterns used in the current codebase. Treat it as the source of truth for new feature work.

## Application Shape

- App framework: Next.js App Router
- API routes: `app/api/**/route.ts`
- Dashboard pages: `app/(dashboard)/**/page.tsx`
- Public pages: `app/(public)/**/page.tsx`
- Tenant portal: `app/portal/**`
- Feature modules: `lib/features/**`
- Shared utilities: `lib/shared/**`, `lib/utils/**`, and selected `lib/services/**`
- Database schema: `prisma/schema.prisma`

The schema currently contains 40 models and the app has more than 150 API route files, so consistency matters more than clever local shortcuts.

## Preferred Feature Structure

Use the three-layer feature pattern when adding or materially changing a feature:

```text
lib/features/[feature]/
├── repositories/
│   └── [feature].repository.ts
├── services/
│   └── [feature].service.ts
├── dtos/
│   └── [feature].dto.ts
├── __tests__/
│   └── [feature].service.test.ts
└── index.ts
```

Current examples include bookings, properties, tenants, payments, expenses, maintenance, messaging, team, and placement.

## Layer Responsibilities

### API Routes

API routes should handle HTTP concerns:

- Read request data
- Authenticate the user/session
- Parse DTOs with Zod
- Call service methods
- Log audit events after mutations
- Return `NextResponse`
- Delegate errors to the shared handler

API routes should not contain business rules, pricing logic, direct multi-step Prisma workflows, or cross-entity orchestration.

### Services

Services own business logic:

- Permission and ownership checks
- Cross-entity validation
- Pricing, payment, lease, booking, and scheduling rules
- Transaction coordination
- Notification or automation side effects
- Calling one or more repositories

Use custom app errors instead of returning inconsistent ad hoc error objects.

### Repositories

Repositories own data access:

- Prisma queries
- Includes/selects
- Query-specific filtering
- Transactions where the query itself needs them

Repositories should avoid HTTP/session concepts and business-policy decisions.

## Validation

- Use Zod DTOs for route input validation.
- Put durable business rules in services.
- Keep UI validation aligned with API validation, but do not rely on UI-only checks.
- Prefer reusable date and money helpers where they exist.

Lease assignment currently enforces these important rules:

- `leaseEndDate` is required when assigning an active tenant to a property.
- `leaseEndDate` must be after `leaseStartDate`.
- Active leases must keep an end date.
- Single-tenant properties cannot have more than one active tenant assignment.
- Multi-tenant properties can have multiple active assignments, separated by optional `unitLabel`.

## Authentication And Tenancy

Use the existing auth helpers instead of manually parsing sessions.

- Standard authenticated access: `requireAuth()`
- Resource access and team-member permission checks: enhanced helpers in `lib/auth-helpers-enhanced`
- Workspace scope: use `session.user.organizationId` for owner-scoped queries.

Do not use `session.user.id` as the data owner unless you have confirmed that the route intentionally needs the raw user ID.

Team members use role and permission records rather than a separate organization model. Permission gates should be explicit for sensitive areas such as financials, reports, team settings, and property operations.

## Error Handling

Use shared app errors where possible:

- `ValidationError`
- `NotFoundError`
- `UnauthorizedError`
- `ForbiddenError`
- `AvailabilityError`
- `PaymentError`
- `RateLimitError`
- `SubscriptionLimitError`
- `ExternalServiceError`

API routes should catch errors and pass them to `handleApiError(error)` unless an existing local route pattern requires otherwise.

## Audit Logging

Log create, update, delete, and sensitive status changes after successful mutations.

Audit entries should capture:

- Actor/session
- Action
- Entity type
- Entity ID
- Meaningful before/after changes for updates
- Request context where available

## Feature Notes

### Payments

- Rent generation should operate per active `PropertyTenant` lease, not only per tenant.
- Use lease-level `monthlyRent`.
- Include `propertyId` and `tenantId` when preventing duplicate monthly payments.
- Include `unitLabel` in descriptions and invoices when present.
- Paystack/Stripe flows are not production-ready and should not be used as proof of live card payment support.

### PayFast Billing

- PayFast subscriptions are separate from tenant rent collection.
- Keep signature verification timing-safe.
- Verify ITN source and amount before activating or marking invoices paid.
- Treat sandbox validation as required before launch.

### Messaging

- Automations are event-driven and create `ScheduledMessage` records.
- Email is implemented.
- SMS and WhatsApp are stubs/future channels.
- Scheduled processing requires a cron schedule plus `CRON_SECRET`.

### Reports

Reports currently use direct Prisma in several routes. Keep fixes local unless you are explicitly migrating a report to the service/repository pattern.

### Placement

Placement features are agency-only. Individual and company landlord accounts should keep standard management workflows unless access rules are intentionally changed.

## Testing Expectations

- Add or update unit tests for DTOs and services when business rules change.
- Add focused integration or route tests for risky API behavior where the repo has existing patterns.
- Run `npm run type-check`, `npm test -- --run`, and `npm run build` for broad changes when feasible.
- For docs-only edits, verify links and inventory with shell checks.
