# Testing Guide

Use this guide for release checks, UAT, and focused verification of historically risky areas.

## Standard Commands

```bash
npm run type-check
npm test -- --run
npm run build
```

Use focused test commands when working on one module, for example:

```bash
npm test -- --run lib/features/tenants/__tests__/tenant.service.test.ts
```

## UAT Checklist

### Authentication

- [ ] Register a new account with valid details.
- [ ] Confirm invalid signup data shows validation errors.
- [ ] Log in with valid credentials.
- [ ] Confirm invalid login data is rejected.
- [ ] Reset password through email flow.
- [ ] Change password from settings.

### Dashboard And Navigation

- [ ] Dashboard cards load correct totals.
- [ ] Charts render without client errors.
- [ ] Sidebar links route correctly.
- [ ] Mobile navigation works.
- [ ] Active navigation state is correct.

### Properties

- [ ] Create, edit, view, and delete a test property.
- [ ] Upload and display property images.
- [ ] Search and filter properties.
- [ ] Import and export property data where enabled.
- [ ] Confirm property status badges and occupancy display correctly.

### Tenants And Leases

- [ ] Create a tenant.
- [ ] Assign tenant to a property with lease start date, lease end date, rent, and deposit.
- [ ] Confirm missing lease end date is rejected.
- [ ] Confirm lease end date before start date is rejected.
- [ ] Edit tenant and assignment details.
- [ ] Move out or archive a test tenant.
- [ ] Confirm lease expiration report includes valid leases.

### Multi-Tenant Properties

- [ ] Enable `allowsMultipleTenants` on a property.
- [ ] Assign multiple tenants to the same property with different unit labels.
- [ ] Confirm single-tenant properties reject a second active assignment.
- [ ] Confirm duplicate tenant/property/unit assignment is rejected.
- [ ] Generate monthly payments and confirm one payment per active lease.
- [ ] Confirm invoice descriptions include unit labels.

### Financials

- [ ] Generate monthly rent payments.
- [ ] Open rent collection grid and verify expected/collected/outstanding totals.
- [ ] Filter rent collection by month, property, and status.
- [ ] Record a manual payment.
- [ ] Upload and verify proof of payment.
- [ ] Send a payment reminder.
- [ ] Create a manual invoice with one line item.
- [ ] Create a manual invoice with multiple line items.
- [ ] Open tenant payment ledger and verify statistics.
- [ ] Export rent collection and ledger CSV files.

### Reports

- [ ] Tax summary report loads.
- [ ] Revenue report loads.
- [ ] Tenant payments report loads.
- [ ] Aging receivables report loads.
- [ ] Maintenance costs report loads.
- [ ] Occupancy report loads.
- [ ] Lease expiration report loads.
- [ ] Cash flow report loads.
- [ ] Analytics report loads.
- [ ] CSV export works for each report that exposes export.

### Maintenance And Inspections

- [ ] Create a maintenance request.
- [ ] Upload maintenance photos.
- [ ] Update maintenance status through the workflow.
- [ ] Confirm notification/email behavior where configured.
- [ ] Create an inspection.
- [ ] Add inspection items.
- [ ] Confirm inspection status and details display correctly.

### Documents

- [ ] Upload a document.
- [ ] Create, rename, and delete a folder.
- [ ] Move a document between folders.
- [ ] Download a document.
- [ ] Delete a test document.
- [ ] Confirm property-specific folder filtering works.

### Messaging

- [ ] Send a direct message.
- [ ] Confirm read/unread status.
- [ ] Create an email automation.
- [ ] Insert template variables.
- [ ] Test automation preview/send behavior.
- [ ] Confirm scheduled message records are created.
- [ ] Process scheduled messages manually or via cron in a controlled environment.

### Team And Admin

- [ ] Invite a team member.
- [ ] Accept an invitation.
- [ ] Confirm role preset permissions.
- [ ] Confirm restricted users cannot access blocked areas.
- [ ] Super admin can view and manage users.
- [ ] Admin subscription dashboard loads.

### PayFast Billing

- [ ] Initiate subscription in sandbox.
- [ ] Confirm callback/success handling.
- [ ] Validate ITN webhook with a public tunnel or test deployment.
- [ ] Confirm invoice is marked paid only after verified ITN.
- [ ] Cancel subscription and confirm access is retained until period end.
- [ ] Confirm billing history displays records.

## Payment Feature Seed Data

The repo includes a payment feature seed script:

```bash
npm run seed:payment-features
```

Use it to test:

- Rent collection grid
- Mixed payment statuses
- Multi-tenant property rent collection
- Tenant ledgers
- Manual invoice creation
- Payment health badges

Do not use seeded demo credentials in production.

## Launch Smoke Test

Run this scenario before inviting beta landlords:

1. Create a landlord.
2. Create one property.
3. Create one tenant.
4. Assign the tenant to the property with a valid lease.
5. Generate rent for the month.
6. Log in as tenant and view payment.
7. Upload proof of payment.
8. Log in as landlord and verify proof.
9. View invoice/receipt.
10. Confirm rent collection dashboard updates.
11. Create a maintenance request from portal.
12. Confirm landlord can process the maintenance request.
13. Export one financial report.

## Known Risk Areas To Re-Test

- Cron-protected endpoints when `vercel.json` schedules are enabled.
- Any flow that exposes Paystack/Stripe, because those providers are not production-ready.
- Calendar sync and integration status screens.
- Lease date validation after tenant assignment UI changes.
- Multi-tenant payment generation after any payment repository changes.
- Team member permission checks after settings or navigation changes.
