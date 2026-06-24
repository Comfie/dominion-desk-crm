# Placement Completion Design

**Date:** June 24, 2026

## Goal

Complete an agency rental placement by converting or linking an approved applicant to a tenant, creating the property lease assignment, and marking the rental application as placed.

Tenant portal access is mandatory for the completed onboarding journey, but activation is a required follow-up action after placement rather than part of the placement database transaction.

## Scope

This task adds:

- An agency-only placement completion API.
- A transactional service that resolves the tenant, creates the lease assignment, links the application, and marks it placed.
- A completion dialog in the placement application queue.
- A placement success state that directs the agent to activate tenant portal access.
- A visible portal-pending status until the tenant account is activated.

This task does not add:

- Automatic portal account creation inside the placement transaction.
- A welcome email without portal access.
- Commission or fee reporting.
- Screening overrides.
- Lease document generation or e-signature.

## Eligibility Rules

An application can be completed only when:

- The authenticated account is an `AGENCY`.
- The application belongs to the agency workspace.
- Applicant screening has an overall status of `PASSED`.
- The application is not already `PLACED`, `REJECTED`, or `WITHDRAWN`.
- A lease start date and positive monthly rent are supplied.
- The lease end date, when supplied, is after the lease start date.
- The target property can accept the tenant under its single-tenant or multi-tenant rules.
- The tenant does not already have an active lease for the same property and unit.

There is no screening override in this task.

## API

Add:

`POST /api/placement/applications/[id]/complete`

The request body contains:

- `leaseStartDate`
- `leaseEndDate` (optional)
- `monthlyRent`
- `depositPaid`
- `moveInDate` (optional)
- `unitLabel` (optional)

The response returns:

- The placed rental application.
- The resolved tenant ID.
- Whether the tenant was created or reused.
- Whether portal access is active.
- The next required action when portal access is pending.

The route uses the existing session workspace ID convention and rejects non-agency accounts.

## Tenant Resolution

The service resolves the tenant in this order:

1. Reuse the tenant already linked by `rentalApplication.tenantId`, after verifying workspace ownership.
2. Reuse a tenant in the same workspace whose email case-insensitively matches the applicant email.
3. Create a new active tenant from the applicant details.

New tenants are created without portal access and without sending email. Applicant name, email, phone, and ID number are copied into the tenant record. Screening income may be copied into `monthlyIncome` when available.

The application is linked to the resolved tenant during completion.

## Placement Transaction

Database writes occur in one Prisma transaction:

1. Lock the logical workflow by re-reading and validating the application state inside the transaction.
2. Resolve or create the tenant.
3. Validate property capacity and duplicate lease rules.
4. Create the active `PropertyTenant` lease assignment.
5. Update the rental application with the tenant ID and `PLACED` status. The existing `updatedAt` field records when the transition occurred.

Portal account creation and email delivery are intentionally outside this transaction. A portal or email failure must not roll back a valid tenant lease placement.

Repeated completion requests must not create duplicate tenants or leases. An already placed application returns a validation error and exposes its existing tenant for navigation.

## Portal Activation

After placement succeeds, the UI shows:

- `View tenant`
- `Activate tenant portal`

Portal activation uses the existing tenant portal-access endpoint. It:

- Creates the `TENANT` user account.
- Links `Tenant.portalUserId`.
- Generates a temporary password.
- Sends the existing welcome email containing portal credentials and property/lease details.

The existing endpoint will be aligned with the workspace ID convention so agency team members operate on tenants owned by their organization rather than only tenants owned directly by their login user.

All placed tenants are expected to receive portal access. Until activation succeeds, the placement application and tenant handoff UI show `Portal pending`. Once linked to a tenant portal user, the state becomes `Portal active`.

Portal activation remains an explicit action so the agent controls when credentials are issued. The UI keeps the pending state prominent and actionable.

## User Interface

The placement application queue adds a `Complete placement` action only for eligible applications.

The completion dialog:

- Prefills lease start, end, move-in date, monthly rent, and deposit from the application where available.
- Allows an optional unit label for multi-tenant properties.
- Explains validation failures inline or through the existing toast pattern.
- Disables duplicate submission while the request is running.

After success, the confirmation state shows the resolved tenant and requires the agent to either activate portal access immediately or navigate to the tenant profile. Applications already placed show tenant and portal status actions instead of the completion form.

## Error Handling

- `401`: unauthenticated.
- `403`: authenticated account is not an agency.
- `400`: validation, screening, application-state, capacity, or duplicate-lease failure.
- `404`: application, linked tenant, or property is outside the workspace or missing.
- `500`: unexpected server failure with no internal details exposed.

Portal activation failure leaves the placement completed and the portal state pending. The agent can retry from the placement queue or tenant profile.

## Testing

Add focused tests for:

- Completion DTO date and monetary validation.
- Rejection when screening is not passed.
- Rejection for final or invalid application states.
- Reuse of an explicitly linked workspace tenant.
- Reuse of an existing tenant by case-insensitive email.
- Creation of a tenant when no match exists.
- Rejection of duplicate active property/unit leases.
- Enforcement of single-tenant property capacity.
- Atomic creation of the lease and application placement update.
- Portal-pending and portal-active response state.
- Agency-only route access.

Run placement tests, tenant regression tests, Prisma validation, TypeScript checking, and the production build.

## Documentation

Add Task 8 to the placement implementation plan and update `docs/PROJECT_STATUS.md` with:

- Placement completion workflow.
- Tenant reuse and lease assignment.
- Mandatory portal activation handoff.
- Remaining placement roadmap items.
