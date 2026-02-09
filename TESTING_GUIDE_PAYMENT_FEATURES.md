# Testing Guide: Payment Tracking & Invoicing Features

**Created**: February 8, 2026
**Features**: Rent Collection Hub, Manual Invoicing, Payment Ledger, Payment Health Badges

---

## 🚀 Quick Start

### 1. Run the Seed Script

```bash
# Install dependencies if needed
npm install bcryptjs @types/bcryptjs

# Compile TypeScript seed file
npx tsx prisma/seed-payment-features.ts

# Or add to package.json and run
npm run seed:payments
```

### 2. Login Credentials

```
Email: landlord@test.com
Password: password123
```

### 3. Test Data Overview

**4 Properties Created:**

- **12 Ocean View Apartments** (Cape Town) - Single tenant, all paid
- **45 Student House** (Stellenbosch) - Multi-tenant (3 rooms), mixed payment status
- **7 Sunset Townhouse** (Johannesburg) - Single tenant, overdue
- **22 Garden Cottage** (Durban) - Single tenant, pending verification

**6 Tenants with Different Payment Behaviors:**

1. **Sarah Johnson** - Excellent payer (always early/on-time)
2. **Michael Brown** - Good payer (Room A, paid current month)
3. **Emma Davis** - Pending payment (Room B)
4. **James Wilson** - Overdue payment (Room C)
5. **Robert Taylor** - Chronic late payer (many overdue)
6. **Lisa Anderson** - New tenant (proof pending verification)

**Payment History:** 6 months of payment data + current month

---

## 📋 Feature Testing Checklist

### ✅ Phase 1: Rent Collection Hub

#### Test 1: Access Rent Collection Page

- [ ] Navigate to **Financials → Rent Collection** from sidebar
- [ ] Page loads without errors
- [ ] Defaults to current month/year
- [ ] Summary cards display correct totals

**Expected Results:**

```
Total Expected: R36,500 (current month)
Total Collected: R18,500
Collection Rate: 50.7%
Outstanding: R18,000
Overdue Count: 2
```

#### Test 2: Rent Collection Grid View

- [ ] All 4 properties appear in the grid
- [ ] Properties are expandable/collapsible
- [ ] Tenant rows show under each property
- [ ] Payment status badges display correctly:
  - ✅ **PAID** (green) - Sarah Johnson, Michael Brown
  - ⏳ **PENDING** (gray) - Emma Davis
  - ❌ **OVERDUE** (red) - James Wilson, Robert Taylor
  - 👁️ **PENDING_VERIFICATION** (yellow) - Lisa Anderson

#### Test 3: Property Subtotals

- [ ] **12 Ocean View**: Shows "1/1 Paid" (R8,500 collected)
- [ ] **45 Student House**: Shows "1/3 Paid" (R5,000 of R15,000 collected)
- [ ] **7 Sunset Townhouse**: Shows "0/1 Paid" (R0 of R12,000 collected)
- [ ] **22 Garden Cottage**: Shows "0/1 Paid" (pending verification)

#### Test 4: Multi-Tenant Property Display

- [ ] "45 Student House" shows 3 separate tenant rows
- [ ] Each tenant has unit label (Room A, Room B, Room C)
- [ ] Each tenant has separate payment status
- [ ] Individual rent amounts shown (R5,000 each)

#### Test 5: Collection Trend Chart

- [ ] Chart displays 6-month trend
- [ ] Shows expected vs collected lines
- [ ] Collection rate percentage line visible
- [ ] Tooltips show detailed breakdown on hover

#### Test 6: Filtering

- [ ] **Month Filter**: Change to previous month
  - Grid updates with previous month's data
  - Summary cards recalculate
- [ ] **Property Filter**: Select "45 Student House"
  - Only shows that property
  - Summary shows R15,000 expected
- [ ] **Status Filter**: Select "OVERDUE"
  - Shows only James Wilson and Robert Taylor
  - Other tenants hidden

#### Test 7: Quick Actions - Record Payment

- [ ] Click "Record Payment" for Emma Davis (Room B, PENDING)
- [ ] Modal opens with pre-filled amount (R5,000)
- [ ] Amount field is disabled (greyed out)
- [ ] Select payment method: EFT
- [ ] Select payment date: Today
- [ ] Enter reference: "TEST-REF-001"
- [ ] Click "Record Payment"
- [ ] Success toast appears
- [ ] Grid refreshes automatically
- [ ] Emma's status changes to PAID
- [ ] Collection rate updates

#### Test 8: Quick Actions - Send Reminder

- [ ] Click "Send Reminder" for overdue payment
- [ ] Success toast confirms email sent
- [ ] (Check server logs for email delivery)

#### Test 9: Quick Actions - Verify Proof

- [ ] Click "Verify Proof" for Lisa Anderson (PENDING_VERIFICATION)
- [ ] Redirects to payment detail page
- [ ] Proof of payment information visible
- [ ] Can approve or reject proof

#### Test 10: Export CSV

- [ ] Click "Export CSV" button
- [ ] CSV file downloads
- [ ] Contains current filtered data
- [ ] Filename format: `rent-collection-YYYY-MM.csv`

---

### ✅ Phase 2: Manual Invoice Creation

#### Test 11: Create Simple Invoice

- [ ] Navigate to **Financials → Rent Collection**
- [ ] Click "Create Invoice" button
- [ ] Redirects to `/financials/invoices/new`
- [ ] **Select Tenant**: Choose "Sarah Johnson"
- [ ] **Property**: Auto-selects "12 Ocean View Apartments"
- [ ] **Due Date**: Set to 2 weeks from now
- [ ] **Line Item 1**:
  - Description: "Water and Electricity"
  - Amount: 350
  - Type: Utilities
- [ ] **Notes**: "Actual usage for January"
- [ ] **Send invoice email**: Checked
- [ ] Click "Create Invoice"
- [ ] Success toast appears
- [ ] Redirects to payment detail page
- [ ] Invoice displays correctly

#### Test 12: Multi-Line Item Invoice

- [ ] Return to create invoice page
- [ ] Select tenant with multiple properties
- [ ] Click "Add Item" button 3 times
- [ ] Fill in multiple line items:
  1. Utilities - R350
  2. Late Fee - R500
  3. Maintenance Repair - R750
- [ ] Total shows R1,600
- [ ] Create invoice
- [ ] Verify all line items in description

#### Test 13: Validation Tests

- [ ] Try submitting without selecting tenant → Error
- [ ] Try submitting without property → Error
- [ ] Try submitting without due date → Error
- [ ] Try submitting with empty line item → Error
- [ ] Try submitting with zero amount → Error
- [ ] Remove all line items except one → Can't delete last item

#### Test 14: Multi-Tenant Property Invoice

- [ ] Select tenant from "45 Student House"
- [ ] Property dropdown shows "45 Student House - Room A/B/C"
- [ ] Unit label displayed in property selection
- [ ] Invoice description includes unit label

---

### ✅ Phase 3: Tenant Payment Ledger

#### Test 15: Access Payment Ledger

- [ ] Navigate to **Tenants**
- [ ] Click on "Sarah Johnson"
- [ ] Sidebar shows "Payment History" card
- [ ] Click "View Payment History"
- [ ] Redirects to `/tenants/[id]/payments`

#### Test 16: Payment Summary Cards

- [ ] **Total Paid**: Shows 6 months of rent (R51,000)
- [ ] **On-Time Rate**: Shows ~100% (excellent payer)
- [ ] **Avg Days to Pay**: Shows negative number (pays early)
- [ ] **Current Balance**: Shows R0 (all paid)
- [ ] Color indicators match performance:
  - Green for excellent
  - Good payment behavior shown

#### Test 17: Payment History Table

- [ ] All 6 months + current month payments visible
- [ ] Table shows:
  - Date (payment date or due date)
  - Description with month/year
  - Property name
  - Amount (R8,500 per month)
  - Status badges
  - Days Late (negative for early, 0 for on-time)
  - Payment Method (EFT)
- [ ] "View" button links to payment details

#### Test 18: Compare Different Payment Behaviors

- [ ] View **Robert Taylor's** ledger (chronic late payer):
  - On-Time Rate: Low (~30%)
  - Avg Days to Pay: High (15-20 days)
  - Current Balance: High (outstanding payments)
  - Many payments marked OVERDUE or paid late
  - Days Late column shows high numbers (5-30 days)

#### Test 19: Year Filtering

- [ ] Select previous year from dropdown
- [ ] Table filters to show only that year's payments
- [ ] Summary cards recalculate for selected year
- [ ] Select "All Years"
- [ ] Full history displays

#### Test 20: Export Payment History

- [ ] Click "Export" button
- [ ] Downloads tenant payment history
- [ ] Includes all visible filtered data

---

### ✅ Phase 4: Property Card Payment Badges

#### Test 21: Property List View

- [ ] Navigate to **Properties**
- [ ] Each property card shows payment health badge:
  - **12 Ocean View**: Green "All Paid" badge
  - **45 Student House**: Red "2 Overdue" badge
  - **7 Sunset Townhouse**: Red "1 Overdue" badge
  - **22 Garden Cottage**: Yellow "1 Pending" badge (verification)

#### Test 22: Badge Updates

- [ ] Record payment for an overdue tenant
- [ ] Return to properties page
- [ ] Badge updates automatically (may need refresh)
- [ ] Overdue count decreases

#### Test 23: Multi-Tenant Badge Logic

- [ ] "45 Student House" shows:
  - Occupied badge: "Occupied · 3"
  - Payment badge: "2 Overdue" or "1 Paid"
- [ ] Badge accurately reflects mixed payment status

---

### ✅ Phase 5: Integration Testing

#### Test 24: End-to-End Workflow

1. [ ] Start at **Rent Collection** page
2. [ ] Identify overdue tenant (James Wilson - Room C)
3. [ ] Click "Send Reminder"
4. [ ] Tenant receives reminder email (check logs)
5. [ ] Later: Click "Record Payment"
6. [ ] Fill in payment details
7. [ ] Submit payment
8. [ ] Grid updates: Status changes to PAID
9. [ ] Navigate to **Properties**
10. [ ] "45 Student House" badge updates: "1 Overdue" → "All Paid" (if others paid)
11. [ ] Navigate to tenant detail page
12. [ ] Payment History shows new payment
13. [ ] Current Balance updates

#### Test 25: Manual Invoice to Payment Flow

1. [ ] Create manual invoice for utilities (R350)
2. [ ] Invoice email sent to tenant
3. [ ] Payment record created with PENDING status
4. [ ] Payment appears in Rent Collection grid
5. [ ] Tenant can view invoice in portal
6. [ ] Record payment for the invoice
7. [ ] Status updates to PAID
8. [ ] Reflects in payment ledger

#### Test 26: Proof Verification Workflow

1. [ ] View Lisa Anderson's payment (PENDING_VERIFICATION)
2. [ ] Click "Verify Proof" from rent collection grid
3. [ ] View proof of payment image/PDF
4. [ ] Approve or reject proof
5. [ ] Status updates accordingly
6. [ ] Email notification sent (if configured)

---

### ✅ Phase 6: Performance & Edge Cases

#### Test 27: Large Data Sets

- [ ] Filter to previous months with full payment history
- [ ] Page loads quickly (<2 seconds)
- [ ] Charts render smoothly
- [ ] No lag when expanding/collapsing properties

#### Test 28: No Data Scenarios

- [ ] Filter to future month (no payments generated)
- [ ] Shows "No properties with active leases" message
- [ ] Summary cards show zeros
- [ ] No errors in console

#### Test 29: Mobile Responsiveness

- [ ] Open rent collection page on mobile/tablet
- [ ] Table scrolls horizontally
- [ ] Summary cards stack vertically
- [ ] Buttons are tappable
- [ ] Modals display correctly

#### Test 30: Error Handling

- [ ] Try to record payment with invalid data
- [ ] Appropriate error messages display
- [ ] Network errors handled gracefully
- [ ] Loading states shown during API calls

---

## 🔍 Additional Manual Tests

### Test Collection Rate Calculations

**Formula**: `(Total Collected / Total Expected) × 100`

**Current Month Expected:**

```
12 Ocean View: R8,500
45 Student House: R15,000 (R5,000 × 3)
7 Sunset Townhouse: R12,000
22 Garden Cottage: R6,000
Total Expected: R41,500
```

**Current Month Collected:**

```
Sarah Johnson: R8,500 (PAID)
Michael Brown: R5,000 (PAID)
Total Collected: R13,500
```

**Collection Rate**: `(13,500 / 41,500) × 100 = 32.5%`

Verify this matches the summary card.

---

### Test Payment Behavior Analytics

**Sarah Johnson (Excellent Payer):**

- All 6 payments made 1-2 days EARLY
- On-Time Rate: 100%
- Avg Days to Pay: -1.5 days (negative = early)

**Robert Taylor (Poor Payer):**

- 4 of 6 payments made 15-30 days LATE
- 2 payments still OVERDUE
- On-Time Rate: 0%
- Avg Days to Pay: +20 days

Verify these stats match the payment ledger summary cards.

---

## 📊 Expected Dashboard State

After seeding, your **Rent Collection Dashboard** should show:

### Current Month View

| Property           | Total Rent  | Collected   | Outstanding | Status      |
| ------------------ | ----------- | ----------- | ----------- | ----------- |
| 12 Ocean View      | R8,500      | R8,500      | R0          | 1/1 Paid ✅ |
| 45 Student House   | R15,000     | R5,000      | R10,000     | 1/3 Paid ⚠️ |
| 7 Sunset Townhouse | R12,000     | R0          | R12,000     | 0/1 Paid ❌ |
| 22 Garden Cottage  | R6,000      | R0          | R6,000      | 0/1 Paid 👁️ |
| **TOTAL**          | **R41,500** | **R13,500** | **R28,000** | **32.5%**   |

### 6-Month Trend

- Months with declining collection rate (students late, Robert Taylor issues)
- Visual trend showing payment reliability over time
- Identifies problem tenants

---

## 🐛 Known Issues to Watch For

1. **Time Zone Issues**: Payment dates may shift based on server timezone
2. **Cache Staleness**: May need to refresh to see updates after recording payments
3. **Large Grids**: Performance degrades with 50+ properties (pagination needed)
4. **Email Delivery**: Requires SMTP configuration to send actual emails

---

## ✅ Success Criteria

All features working if:

- ✅ Rent collection grid displays all properties and tenants
- ✅ Payment statuses are accurate and color-coded
- ✅ Summary cards calculate correctly
- ✅ Collection trend chart renders with 6 months data
- ✅ Quick actions (record payment, send reminder) function
- ✅ Manual invoices can be created with multiple line items
- ✅ Tenant payment ledger shows complete history with stats
- ✅ Property cards display payment health badges
- ✅ Multi-tenant properties show individual unit payments
- ✅ Proof verification workflow operates correctly

---

## 🔧 Troubleshooting

### Seed Script Fails

```bash
# Ensure Prisma client is generated
npx prisma generate

# Run migrations
npx prisma migrate dev

# Re-run seed
npx tsx prisma/seed-payment-features.ts
```

### No Data Appearing

- Check browser console for errors
- Verify user is logged in as `landlord@test.com`
- Confirm database has seed data: `npx prisma studio`
- Check API responses in Network tab

### Payment Grid Empty

- Verify current month/year filter matches seed data
- Check that properties have active leases
- Confirm payments exist for selected period

### Collection Rate Wrong

- Manually calculate expected vs collected
- Check for duplicate payment records
- Verify payment statuses are correct

---

## 📞 Support

If tests fail:

1. Check console for errors
2. Review network requests in DevTools
3. Verify seed data in Prisma Studio
4. Check server logs for API errors
5. Confirm all migrations are applied

---

**Happy Testing! 🎉**
