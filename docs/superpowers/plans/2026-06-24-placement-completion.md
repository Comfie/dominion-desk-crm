# Placement Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete a screened rental application by resolving a tenant, creating the lease assignment, marking the application placed, and requiring portal activation as the next onboarding action.

**Architecture:** Add a placement completion DTO, a service for eligibility rules, and a repository-owned Prisma transaction for tenant resolution and lease creation. Expose the workflow through an agency-only route and a client dialog in the application queue; reuse the existing portal-access endpoint after aligning it with organization workspace ownership.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma 7, PostgreSQL, NextAuth.js, Vitest, shadcn/ui, Tailwind CSS.

## Global Constraints

- Placement completion is available only to `AGENCY` accounts.
- Screening must be `PASSED`; no override is supported.
- Reuse the linked tenant first, then a case-insensitive workspace email match, then create a tenant.
- Placement writes must be atomic.
- Placement does not create portal credentials or send email.
- Portal activation is the required next action and uses the existing welcome email with credentials.
- Existing single-tenant, multi-tenant, lease-date, and duplicate-unit rules remain enforced.

---

### Task 8.1: Completion DTO

**Files:**

- Create: `lib/features/placement/dtos/placement-completion.dto.ts`
- Test: `lib/features/placement/__tests__/placement-completion.dto.test.ts`
- Modify: `lib/features/placement/index.ts`

**Interfaces:**

- Produces: `completePlacementSchema`
- Produces: `CompletePlacementDTO`

- [ ] **Step 1: Write failing DTO tests**

Cover a valid lease, required start date, positive monthly rent, non-negative deposit, and lease end date after lease start date.

- [ ] **Step 2: Run the focused DTO test and verify RED**

Run: `npm test -- lib/features/placement/__tests__/placement-completion.dto.test.ts`

Expected: FAIL because `placement-completion.dto.ts` does not exist.

- [ ] **Step 3: Implement the completion schema**

Use `isValidLeaseDateRange` and `LEASE_END_DATE_ERROR` from `lib/features/tenants/lease-dates.ts`. Normalize optional empty strings to `null` for `leaseEndDate`, `moveInDate`, and `unitLabel`.

- [ ] **Step 4: Export the DTO and verify GREEN**

Run: `npm test -- lib/features/placement/__tests__/placement-completion.dto.test.ts`

Expected: all DTO tests pass.

### Task 8.2: Transactional Placement Completion

**Files:**

- Create: `lib/features/placement/repositories/placement-completion.repository.ts`
- Create: `lib/features/placement/services/placement-completion.service.ts`
- Test: `lib/features/placement/__tests__/placement-completion.repository.test.ts`
- Test: `lib/features/placement/__tests__/placement-completion.service.test.ts`
- Modify: `lib/features/placement/index.ts`

**Interfaces:**

- Produces: `placementCompletionRepository.findApplication(userId, applicationId)`
- Produces: `placementCompletionRepository.complete(userId, applicationId, data)`
- Produces: `placementCompletionService.completePlacement(userId, applicationId, data)`
- Returns:

```ts
type PlacementCompletionResult = {
  application: {
    id: string;
    status: 'PLACED';
    tenantId: string;
  };
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tenantResolution: 'LINKED' | 'EMAIL_MATCH' | 'CREATED';
  portalAccessActive: boolean;
  nextAction: 'ACTIVATE_PORTAL' | null;
};
```

- [ ] **Step 1: Write failing service eligibility tests**

Test missing applications, non-passed screening, and `PLACED`, `REJECTED`, or `WITHDRAWN` states. Verify the repository transaction is called only for eligible applications.

- [ ] **Step 2: Run service tests and verify RED**

Run: `npm test -- lib/features/placement/__tests__/placement-completion.service.test.ts`

Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement minimal service eligibility rules**

Load the workspace application through the repository, throw `NotFoundError` when absent, throw `ValidationError` for screening or application state failures, then delegate to `complete`.

- [ ] **Step 4: Run service tests and verify GREEN**

Run: `npm test -- lib/features/placement/__tests__/placement-completion.service.test.ts`

Expected: service tests pass.

- [ ] **Step 5: Write failing repository transaction tests**

Mock `prisma.$transaction` and its transaction client. Cover:

- linked tenant reuse,
- case-insensitive email reuse,
- new active long-term tenant creation,
- screening income copied to `monthlyIncome`,
- single-tenant capacity rejection,
- duplicate active property/unit lease rejection,
- lease creation and application update,
- portal active/pending response.

- [ ] **Step 6: Run repository tests and verify RED**

Run: `npm test -- lib/features/placement/__tests__/placement-completion.repository.test.ts`

Expected: FAIL because the repository does not exist.

- [ ] **Step 7: Implement the Prisma transaction**

Inside `prisma.$transaction`:

1. Re-read the application by `id` and `userId`, including screening, property capacity data, and linked tenant.
2. Revalidate screening and final-state rules to protect against concurrent changes.
3. Resolve the tenant in the approved priority order.
4. Reject active property capacity and duplicate property/unit conflicts.
5. Create `PropertyTenant` with decimal rent/deposit values.
6. Update the application to `PLACED` and link the tenant.
7. Return tenant resolution and portal state.

- [ ] **Step 8: Run repository and service tests and verify GREEN**

Run:

```bash
npm test -- \
  lib/features/placement/__tests__/placement-completion.repository.test.ts \
  lib/features/placement/__tests__/placement-completion.service.test.ts
```

Expected: all completion tests pass.

### Task 8.3: Agency Completion API

**Files:**

- Create: `app/api/placement/applications/[id]/complete/route.ts`
- Test: `app/api/placement/applications/[id]/complete/route.test.ts`

**Interfaces:**

- Consumes: `completePlacementSchema`
- Consumes: `placementCompletionService.completePlacement`
- Produces: `POST /api/placement/applications/[id]/complete`

- [ ] **Step 1: Write failing route tests**

Cover `401` unauthenticated, `403` non-agency, `400` validation/business errors, `404` missing workspace application, and `200` successful placement using `organizationId`.

- [ ] **Step 2: Run route tests and verify RED**

Run: `npm test -- 'app/api/placement/applications/[id]/complete/route.test.ts'`

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement the agency-only POST route**

Follow the existing placement route authentication pattern. Parse the body with `completePlacementSchema`, call the service with `session.user.organizationId || session.user.id`, and map known errors to the specified status codes.

- [ ] **Step 4: Run route tests and verify GREEN**

Run: `npm test -- 'app/api/placement/applications/[id]/complete/route.test.ts'`

Expected: all route tests pass.

### Task 8.4: Portal Access Workspace Alignment

**Files:**

- Modify: `app/api/tenants/[id]/portal-access/route.ts`
- Test: `app/api/tenants/[id]/portal-access/route.test.ts`

**Interfaces:**

- Existing: `POST /api/tenants/[id]/portal-access`
- Existing: `GET /api/tenants/[id]/portal-access`
- New behavior: tenant ownership uses `session.user.organizationId || session.user.id`

- [ ] **Step 1: Write failing workspace ownership tests**

Test that an agency team member can query and create portal access for a tenant owned by the organization workspace.

- [ ] **Step 2: Run route tests and verify RED**

Run: `npm test -- 'app/api/tenants/[id]/portal-access/route.test.ts'`

Expected: FAIL because the route currently queries with `session.user.id`.

- [ ] **Step 3: Align GET and POST with organization workspace ownership**

Calculate `userId` once after authentication and use it for tenant ownership, landlord details, and related portal operations.

- [ ] **Step 4: Run route tests and verify GREEN**

Run: `npm test -- 'app/api/tenants/[id]/portal-access/route.test.ts'`

Expected: portal route tests pass.

### Task 8.5: Placement Completion UI

**Files:**

- Create: `app/(dashboard)/placement/applications/placement-completion-dialog.tsx`
- Modify: `app/(dashboard)/placement/applications/page.tsx`

**Interfaces:**

- Consumes: completion API result from Task 8.3.
- Consumes: `POST /api/tenants/[tenantId]/portal-access` with `{ action: 'create' }`.
- Produces: completion form, placement success state, `Portal pending`, `Portal active`, tenant navigation, and portal activation action.

- [ ] **Step 1: Add serialized application lease and tenant portal data to the page**

Select the linked tenant and `portalUserId`, serialize Prisma decimals and dates, and show completion only when screening is passed and the application is not final.

- [ ] **Step 2: Implement the completion dialog**

Prefill lease dates, rent, deposit, and move-in date. Submit to the completion API, prevent duplicate submission, display server validation errors with the existing toast pattern, and refresh the route after success.

- [ ] **Step 3: Implement the portal handoff state**

After completion, show icon buttons/links for tenant navigation and portal activation. Call the existing portal endpoint explicitly; keep placement successful if activation fails and retain `Portal pending`.

- [ ] **Step 4: Verify UI types**

Run: `npm run type-check`

Expected: no TypeScript errors.

### Task 8.6: Documentation And Full Verification

**Files:**

- Modify: `docs/superpowers/plans/2026-06-22-agent-placement-journey.md`
- Modify: `docs/PROJECT_STATUS.md`

**Interfaces:**

- Documents Task 8 completion and the remaining portal/email limitations.

- [ ] **Step 1: Add Task 8 to the placement journey plan**

Record DTO, service/repository transaction, completion API, UI, tenant reuse, lease assignment, and portal activation handoff as completed only after verification passes.

- [ ] **Step 2: Update project status**

Document the placement completion workflow, mandatory portal handoff, and remove placement completion from remaining roadmap work. Keep commission reporting explicitly skipped/deferred.

- [ ] **Step 3: Run focused and regression tests**

Run:

```bash
npm test -- \
  lib/features/placement \
  'app/api/placement/applications/[id]/complete/route.test.ts' \
  'app/api/tenants/[id]/portal-access/route.test.ts' \
  lib/features/tenants/__tests__/tenant.service.test.ts
```

Expected: all tests pass.

- [ ] **Step 4: Validate Prisma and types**

Run:

```bash
npx prisma validate
npm run type-check
```

Expected: both commands pass.

- [ ] **Step 5: Run the production build**

Run: `npm run build`

Expected: build completes successfully. If Google Fonts are blocked by sandbox networking, rerun with network approval.

## Self-Review

- Spec coverage: DTO validation, screening gate, tenant resolution, atomic lease placement, agency API protection, portal-pending state, explicit activation, organization workspace ownership, UI, tests, and docs are covered.
- Placeholder scan: No `TBD`, `TODO`, or undefined implementation names remain.
- Type consistency: `CompletePlacementDTO`, `PlacementCompletionResult`, repository/service names, API paths, and portal actions match across tasks.
