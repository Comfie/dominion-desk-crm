# Manual Invoice History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show manually generated invoice history on `/financials/rent-collection` so landlords can review, follow up, and record payment from the same workflow.

**Architecture:** Reuse the existing `Payment` model because manual invoices are already persisted as payment rows with `invoiceNumber` prefixed by `INV-MANUAL-`. The rent collection API will return a `manualInvoices` array filtered by the current month/year/property/status filters, and the page will render it in a focused table below the rent grid.

**Tech Stack:** Next.js App Router, Prisma, React, Vitest.

---

### Task 1: API Manual Invoice History

**Files:**

- Modify: `app/api/rent-collection/route.ts`
- Test: `app/api/rent-collection/route.test.ts`

- [ ] **Step 1: Write failing route test**

Create a route test that mocks `paymentService.getRentCollectionData`, `prisma.task.findMany`, and `prisma.payment.findMany`. Assert that `GET /api/rent-collection?month=6&year=2026&propertyId=all&status=all` returns a `manualInvoices` array containing an invoice with `invoiceNumber: "INV-MANUAL-123"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/api/rent-collection/route.test.ts --run`
Expected: FAIL because `manualInvoices` is missing.

- [ ] **Step 3: Implement API query**

In `app/api/rent-collection/route.ts`, query `prisma.payment.findMany` for rows owned by the current user with `invoiceNumber` starting `INV-MANUAL-`, `dueDate` inside the selected month, optional property filter, and optional status filter. Include tenant and property names, then map Decimal amounts to numbers.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- app/api/rent-collection/route.test.ts --run`
Expected: PASS.

### Task 2: Rent Collection UI History Table

**Files:**

- Create: `components/financials/manual-invoice-history.tsx`
- Modify: `app/(dashboard)/financials/rent-collection/page.tsx`

- [ ] **Step 1: Create history component**

Create `ManualInvoiceHistory` with columns for invoice number, tenant, property, due date, amount, status, notes, and actions. Actions should link to `/financials/payments/[id]`, send reminder for pending/overdue invoices, and open record payment for unpaid invoices.

- [ ] **Step 2: Wire component into rent collection page**

Render `ManualInvoiceHistory` after `RentCollectionGrid` and before `CollectionTrendChart`. Pass `data.manualInvoices || []`, `handleSendReminder`, and `handleRecordPayment`.

- [ ] **Step 3: Run focused verification**

Run: `npm test -- app/api/rent-collection/route.test.ts --run`
Expected: PASS.

- [ ] **Step 4: Run type check**

Run: `npm run type-check`
Expected: No new errors from manual invoice history. Existing expense errors may still fail the command.
