# Agent Placement Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an agency-only rental placement journey from enquiry through viewing, application, screening, mandate tracking, and tenant placement.

**Architecture:** Use existing Next.js App Router, Prisma, NextAuth session account types, and dashboard shell. Keep placement as an agency-only module that extends existing properties, inquiries, tenants, documents, messages, and tasks instead of replacing them.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma 7, PostgreSQL, NextAuth.js, Vitest, shadcn/ui, Tailwind CSS.

## Global Constraints

- Account types are `INDIVIDUAL`, `COMPANY`, `AGENCY`, and `TENANT`.
- Placement features are agency-only.
- Individual and company users keep access to standard property-management workflows.
- Tenant users remain restricted to the tenant portal.
- Follow existing dashboard, API, Prisma, and testing patterns.

---

### Task 1: Account-Type Capability Foundation

**Files:**

- Create: `lib/account-capabilities.ts`
- Test: `lib/account-capabilities.test.ts`
- Modify: `components/dashboard/navigation.ts`
- Test: `components/dashboard/navigation.test.ts`
- Modify: `components/dashboard/sidebar.tsx`
- Modify: `components/dashboard/dashboard-layout.tsx`

**Interfaces:**

- Produces: `canAccessPlacementFeatures(accountType: string | null | undefined): boolean`
- Produces: `getAccountCapabilities(accountType: string | null | undefined): AccountCapabilities`
- Produces: `getDashboardNavigationSections(accountType: string | null | undefined): NavSection[]`

- [x] **Step 1: Write failing account capability tests**
- [x] **Step 2: Run `npm test -- lib/account-capabilities.test.ts` and verify missing helper failure**
- [x] **Step 3: Implement `lib/account-capabilities.ts`**
- [x] **Step 4: Run focused capability tests and verify pass**
- [x] **Step 5: Write failing dashboard navigation tests**
- [x] **Step 6: Run `npm test -- components/dashboard/navigation.test.ts` and verify missing helper failure**
- [x] **Step 7: Implement account-aware navigation and pass session account type into `Sidebar`**
- [x] **Step 8: Run focused navigation tests and verify pass**

### Task 2: Placement Data Foundation

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260622205000_add_agent_placement_foundation/migration.sql`

**Interfaces:**

- Produces: `LandlordOwner`
- Produces: `RentalMandate`
- Produces: `Viewing`
- Produces: `RentalApplication`
- Produces: `ApplicantScreening`

- [x] **Step 1: Add placement models and enums to Prisma schema**
- [x] **Step 2: Run `npx prisma validate` and verify schema validity**
- [x] **Step 3: Add matching migration SQL**
- [x] **Step 4: Run `npx prisma generate` and verify Prisma Client generation**

### Task 3: Agency Placement Shell

**Files:**

- Create: `app/(dashboard)/placement/layout.tsx`
- Create: `app/(dashboard)/placement/page.tsx`
- Create: `app/(dashboard)/placement/applications/page.tsx`
- Create: `app/(dashboard)/placement/viewings/page.tsx`
- Create: `app/(dashboard)/placement/landlords/page.tsx`

**Interfaces:**

- Consumes: `canAccessPlacementFeatures`
- Consumes: Prisma models from Task 2
- Produces: guarded agency pages for `/placement`, `/placement/applications`, `/placement/viewings`, and `/placement/landlords`

- [x] **Step 1: Add nested placement layout that redirects non-agency accounts**
- [x] **Step 2: Add placement dashboard counts**
- [x] **Step 3: Add application queue page**
- [x] **Step 4: Add viewing schedule page**
- [x] **Step 5: Add landlord register page**

### Task 4: Application Intake Workflow

**Files:**

- Create: `lib/features/placement/dtos/rental-application.dto.ts`
- Create: `lib/features/placement/repositories/rental-application.repository.ts`
- Create: `lib/features/placement/services/rental-application.service.ts`
- Create: `app/api/placement/applications/route.ts`
- Modify: `app/(dashboard)/placement/applications/page.tsx`

**Interfaces:**

- Consumes: `RentalApplication`, `ApplicantScreening`, `Inquiry`, `Property`
- Produces: application create/list API and UI action entry point

- [x] **Step 1: Add DTO tests for required applicant, property, and agency-only fields**
- [x] **Step 2: Implement DTO validation**
- [x] **Step 3: Add service tests for inquiry-to-application creation**
- [x] **Step 4: Implement service and repository**
- [x] **Step 5: Add POST/GET API route guarded by `canAccessPlacementFeatures`**
- [x] **Step 6: Add application creation UI from an inquiry or property**

### Task 5: Viewing Workflow

**Files:**

- Create: `lib/features/placement/dtos/viewing.dto.ts`
- Create: `lib/features/placement/repositories/viewing.repository.ts`
- Create: `lib/features/placement/services/viewing.service.ts`
- Create: `app/api/placement/viewings/route.ts`
- Modify: `app/(dashboard)/placement/viewings/page.tsx`

**Interfaces:**

- Consumes: `Viewing`, `Inquiry`, `RentalApplication`, `Property`
- Produces: viewing create/list/update workflow with attendance states

- [x] **Step 1: Add DTO tests for scheduling and attendee validation**
- [x] **Step 2: Implement DTO validation**
- [x] **Step 3: Add service tests for schedule conflicts and attendance updates**
- [x] **Step 4: Implement service and repository**
- [x] **Step 5: Add API routes guarded by `canAccessPlacementFeatures`**
- [x] **Step 6: Add viewing create/update UI**

### Task 6: Mandates And Commissions

**Files:**

- Create: `lib/features/placement/dtos/mandate.dto.ts`
- Create: `lib/features/placement/repositories/mandate.repository.ts`
- Create: `lib/features/placement/services/mandate.service.ts`
- Create: `app/api/placement/landlords/route.ts`
- Create: `app/api/placement/mandates/route.ts`
- Modify: `app/(dashboard)/placement/landlords/page.tsx`

**Interfaces:**

- Consumes: `LandlordOwner`, `RentalMandate`, `Property`
- Produces: landlord register, mandate register, and fee fields for placement and management mandates

- [x] **Step 1: Add DTO tests for landlord and mandate fields**
- [x] **Step 2: Implement DTO validation**
- [x] **Step 3: Add service tests for agency-only mandate creation**
- [x] **Step 4: Implement service and repository**
- [x] **Step 5: Add API routes guarded by `canAccessPlacementFeatures`**
- [x] **Step 6: Add create/edit UI for landlords and mandates**

### Task 7: Screening Checklist

**Files:**

- Create: `lib/features/placement/dtos/screening.dto.ts`
- Create: `lib/features/placement/services/screening.service.ts`
- Create: `app/api/placement/applications/[id]/screening/route.ts`
- Modify: `app/(dashboard)/placement/applications/page.tsx`

**Interfaces:**

- Consumes: `ApplicantScreening`, `Document`, `RentalApplication`
- Produces: screening status updates for credit, affordability, references, FICA, and consent

- [x] **Step 1: Add service tests for screening status transitions**
- [x] **Step 2: Implement screening status transition logic**
- [x] **Step 3: Add API route guarded by `canAccessPlacementFeatures`**
- [x] **Step 4: Add screening checklist UI**

### Task 8: Placement Completion And Portal Handoff

**Files:**

- Create: `lib/features/placement/dtos/placement-completion.dto.ts`
- Create: `lib/features/placement/repositories/placement-completion.repository.ts`
- Create: `lib/features/placement/services/placement-completion.service.ts`
- Create: `app/api/placement/applications/[id]/complete/route.ts`
- Create: `app/(dashboard)/placement/applications/placement-completion-dialog.tsx`
- Modify: `app/(dashboard)/placement/applications/page.tsx`
- Modify: `app/api/tenants/[id]/portal-access/route.ts`

**Interfaces:**

- Consumes: `RentalApplication`, `ApplicantScreening`, `Tenant`, `PropertyTenant`
- Produces: transactional tenant resolution, lease assignment, placed application state, and mandatory portal activation handoff

- [x] **Step 1: Add completion DTO tests and validation**
- [x] **Step 2: Add service tests for screening and application-state eligibility**
- [x] **Step 3: Add repository tests for tenant resolution and atomic lease placement**
- [x] **Step 4: Implement the placement completion service and transaction**
- [x] **Step 5: Add agency-only completion API and route tests**
- [x] **Step 6: Align tenant portal access with organization workspace ownership**
- [x] **Step 7: Add completion, tenant navigation, and portal activation UI**

### Self-Review

- Spec coverage: Tasks 1-8 cover account-type enforcement, the placement data foundation, application intake, viewings, landlord and mandate management, fee capture, applicant screening, tenant placement, and portal handoff.
- Placeholder scan: No `TBD` or undefined function names are used in completed tasks.
- Type consistency: The produced model and helper names match the code implemented in the first slice.
