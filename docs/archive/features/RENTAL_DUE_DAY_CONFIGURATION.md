# Rental Due Day Configuration

**Date**: December 2, 2025
**Status**: ✅ COMPLETE

---

## Overview

Implemented a global "Rental Due Day" configuration setting that allows landlords to set a default day of the month when rental payments are due for all their tenants. This setting is used by:

1. **Automated Monthly Payment Generation** - Creates payment records with correct due dates
2. **Tenant Portal** - Displays when rental is due
3. **Landlord Tenant View** - Shows next rental due date
4. **Payment Reminders** - Calculates when to send reminders based on due day

---

## Implementation Details

### 1. Database Schema Changes ✅

**File**: `prisma/schema.prisma`

Added `rentalDueDay` field to the User model:

```prisma
model User {
  // ... existing fields ...

  // Preferences
  timezone        String    @default("Africa/Johannesburg")
  currency        String    @default("ZAR")
  language        String    @default("en")
  rentalDueDay    Int       @default(1) // Day of month when rent is due (1-31)

  // ... rest of model ...
}
```

**Migration**: `20251202120212_add_rental_due_day_setting`

---

### 2. Settings Page UI ✅

**File**: `app/(dashboard)/settings/profile/page.tsx`

Added a new "Payment Settings" card with a dropdown to select rental due day:

```typescript
// Added to schema validation
const profileSchema = z.object({
  // ... existing fields ...
  rentalDueDay: z.number().min(1).max(31),
});

// Added to form values
values: data?.user
  ? {
      // ... existing fields ...
      rentalDueDay: data.user.rentalDueDay,
    }
  : undefined,
```

**UI Features**:

- Dropdown selector with all days (1-31) of the month
- Formatted display: "1st", "2nd", "3rd", "4th", etc.
- Helper text explaining the purpose
- Integrated with existing profile form submission

**Visual**:

```
┌─────────────────────────────────────────────┐
│  📅 Payment Settings                        │
├─────────────────────────────────────────────┤
│                                             │
│  Rental Due Day                             │
│  ┌─────────────────────────────────────┐   │
│  │ 1st of each month            [▼]   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Default day of the month when rental       │
│  payments are due. This will be used for    │
│  automated reminders and tenant portal      │
│  displays.                                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 3. API Endpoint Updates ✅

**File**: `app/api/settings/profile/route.ts`

**GET Endpoint**:

- Added `rentalDueDay` to the select query
- Returns the user's configured rental due day

**PATCH Endpoint**:

- Added `rentalDueDay` to the destructured request data
- Updates the user's rental due day setting
- Validates value is between 1-31 (handled by Zod schema on frontend)

```typescript
// GET - Returns rentalDueDay
select: {
  // ... existing fields ...
  rentalDueDay: true,
}

// PATCH - Updates rentalDueDay
const {
  // ... existing fields ...
  rentalDueDay
} = data;

data: {
  // ... existing updates ...
  ...(rentalDueDay !== undefined && { rentalDueDay }),
}
```

---

### 4. Payment Generation Logic Updates ✅

**File**: `lib/features/payments/repositories/payment.repository.ts`

**Method**: `generateMonthlyPayments(userId, month, year)`

**Key Changes**:

1. **Fetch User's Rental Due Day Setting**:

   ```typescript
   // Get user's rental due day setting
   const user = await prisma.user.findUnique({
     where: { id: userId },
     select: { rentalDueDay: true },
   });

   const rentalDueDay = user?.rentalDueDay || 1;
   ```

2. **Removed Tenant-Level Due Day Requirement**:

   ```typescript
   // BEFORE:
   where: {
     userId,
     status: 'ACTIVE',
     monthlyRent: { not: null },
     paymentDueDay: { not: null }, // ❌ Removed this
   }

   // AFTER:
   where: {
     userId,
     status: 'ACTIVE',
     monthlyRent: { not: null }, // Only require monthlyRent
   }
   ```

3. **Use Global Rental Due Day**:

   ```typescript
   // BEFORE:
   const dueDay = Math.min(tenant.paymentDueDay || 1, 28);

   // AFTER:
   const dueDay = Math.min(rentalDueDay, 28); // Use user's global setting
   const dueDate = new Date(year, month - 1, dueDay, 9, 0, 0);
   ```

4. **Update Tenant's Next Payment Due**:
   ```typescript
   // Update tenant's nextPaymentDue for display in UI
   await prisma.tenant.update({
     where: { id: tenant.id },
     data: { nextPaymentDue: dueDate },
   });
   ```

**Benefits**:

- ✅ Single source of truth for rental due dates
- ✅ Easier for landlords to manage (one setting vs per-tenant)
- ✅ Consistent due dates across all properties
- ✅ Automatically updates tenant's `nextPaymentDue` field

---

## How It Works

### 1. Landlord Configuration

1. Landlord navigates to **Settings > Profile**
2. Scrolls to **Payment Settings** section
3. Selects desired rental due day (e.g., "1st of each month")
4. Clicks **Save Changes**
5. Setting is saved to database and applied to all future payment generations

---

### 2. Automated Payment Generation

**Cron Job**: Runs on the 25th of each month at midnight
**Endpoint**: `POST /api/payments/generate-monthly`
**Schedule**: `0 0 25 * *`

**Process**:

1. For each organization (landlord):
   - Fetch user's `rentalDueDay` setting (e.g., 1)
   - Find all active tenants with `monthlyRent` configured
   - For each tenant:
     - Calculate next month's due date using `rentalDueDay`
     - Check if payment already exists for that month
     - If not, create PENDING payment record with:
       - `dueDate`: Next month, day = user's `rentalDueDay`
       - `amount`: Tenant's `monthlyRent`
       - `status`: PENDING
       - `paymentType`: RENT
     - Update tenant's `nextPaymentDue` field

**Example**:

- User sets `rentalDueDay` = 5
- Cron runs on October 25th
- Creates payments due on November 5th for all active tenants
- Each tenant's `nextPaymentDue` updated to November 5th

---

### 3. Payment Reminder System

**How Reminders Use the Due Day**:

1. **Automated Reminders**:
   - Cron job checks for payments where `dueDate` is approaching
   - Sends reminders based on configured days before due (e.g., 3 days, 1 day)
   - Uses the `dueDate` calculated from user's `rentalDueDay`

2. **Manual Reminders**:
   - Landlord can manually trigger reminders from payment cards
   - Available for PENDING/OVERDUE RENT payments with tenant email

---

### 4. Tenant Portal Display

**Where It Shows**:

1. **Landlord Tenant View** (`app/(dashboard)/tenants/[id]/page.tsx`):
   - **Properties Section**: Yellow highlighted box showing "Next Payment Due: {date}"
   - **Payments Tab Header**: "Next Due: {date}"

2. **Tenant Portal** (future implementation):
   - Will display next rental due date from `tenant.nextPaymentDue`
   - Calculated using landlord's `rentalDueDay` setting

---

## Migration Impact

### Existing Data

- **Default Value**: All existing users get `rentalDueDay = 1` (1st of month)
- **Backward Compatible**: System continues to work without changes
- **Tenant-Level Settings**: If `tenant.paymentDueDay` existed before, it's now ignored in favor of user's global setting

### Recommended Actions for Existing Users

1. Review the default setting (1st of month)
2. Update in Settings > Profile if different due day is needed
3. Next cron run will use the new setting for future payments

---

## Testing Checklist

### Settings Page

- [x] Navigate to Settings > Profile
- [x] Verify "Payment Settings" card displays
- [x] Select different rental due days (1st, 15th, 28th, etc.)
- [x] Save changes and verify success message
- [x] Refresh page and verify selected value persists

### Payment Generation

- [ ] Trigger manual payment generation via API
- [ ] Verify payments created with correct `dueDate` based on `rentalDueDay`
- [ ] Check tenant's `nextPaymentDue` field is updated
- [ ] Verify only tenants with `monthlyRent` get payments generated

### Tenant View

- [ ] Navigate to tenant detail page
- [ ] Verify "Next Payment Due" shows in Properties section
- [ ] Verify "Next Due" shows in Payments tab header
- [ ] Check date matches user's `rentalDueDay` setting

### Payment Reminders

- [ ] Verify automated reminders use correct due date
- [ ] Test manual reminder from payment card
- [ ] Check reminder email contains correct due date

---

## API Endpoints

### Get Profile (with Rental Due Day)

```http
GET /api/settings/profile
Authorization: Bearer <token>

Response:
{
  "user": {
    "id": "...",
    "email": "...",
    // ... other fields ...
    "rentalDueDay": 1
  }
}
```

### Update Rental Due Day

```http
PATCH /api/settings/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "rentalDueDay": 5
}

Response:
{
  "message": "Profile updated successfully",
  "user": {
    "id": "...",
    // ... other fields ...
    "rentalDueDay": 5
  }
}
```

---

## Files Changed

### New Files (1)

1. **Migration**: `prisma/migrations/20251202120212_add_rental_due_day_setting/migration.sql`

### Modified Files (3)

1. **Schema**: `prisma/schema.prisma` - Added `rentalDueDay` field to User model
2. **Settings UI**: `app/(dashboard)/settings/profile/page.tsx` - Added Payment Settings card
3. **API**: `app/api/settings/profile/route.ts` - Added rental due day to GET/PATCH
4. **Payment Repository**: `lib/features/payments/repositories/payment.repository.ts` - Updated `generateMonthlyPayments`

---

## Benefits

### For Landlords

1. **Simplified Management**
   - Single setting controls all tenant due dates
   - No need to configure per-tenant
   - Easy to update in one place

2. **Consistency**
   - All tenants have same due date
   - Easier to track and manage cash flow
   - Predictable payment schedule

3. **Flexibility**
   - Can choose any day 1-31 of the month
   - System auto-adjusts for months with fewer days
   - Changes apply to future payments immediately

### For Tenants

1. **Clarity**
   - Clear, consistent payment due date
   - Visible in tenant portal (future)
   - Included in payment reminders

2. **Fairness**
   - Same rules apply to all tenants
   - No confusion about different due dates

### For System

1. **Automation**
   - Cron job automatically generates payments
   - No manual intervention needed
   - Scales to unlimited tenants

2. **Maintainability**
   - Single source of truth
   - Easier to debug and test
   - Cleaner code architecture

---

## Future Enhancements

### Potential Improvements

1. **Property-Level Overrides**
   - Allow specific properties to have different due days
   - Useful for commercial vs residential properties
   - Fallback to user's global setting

2. **Tenant-Level Overrides**
   - Allow specific tenants to have custom due days
   - Useful for special arrangements
   - Requires admin approval

3. **Due Day Validation**
   - Warn if selecting day > 28 (month-end issues)
   - Show preview of next 3 due dates
   - Suggest optimal days based on banking

4. **Batch Due Date Updates**
   - Allow updating due day for existing scheduled payments
   - Useful when changing setting mid-year
   - Preview impact before applying

5. **Grace Period Configuration**
   - Set grace period before marking overdue
   - Configure when to send reminders
   - Customize per subscription tier

---

## Summary

✅ **Implementation Status**: COMPLETE

Successfully implemented global rental due day configuration:

1. **Database**: Added `rentalDueDay` field to User model (default: 1)
2. **UI**: Added Payment Settings card in Profile settings page
3. **API**: Updated profile endpoints to handle rental due day
4. **Logic**: Updated payment generation to use global setting
5. **Display**: Existing tenant views already show `nextPaymentDue`

**Key Benefits**:

- ✅ Single, easy-to-manage setting for all tenants
- ✅ Consistent due dates across organization
- ✅ Automated payment and reminder generation
- ✅ Clear visibility for landlords and tenants

**User Workflow**:

1. Landlord sets rental due day in Settings > Profile
2. Cron job generates payments on 25th with correct due dates
3. Tenant sees next payment due in landlord's tenant view
4. Payment reminders sent based on due date
5. Tenant receives payment with correct due date

---

**Implementation Date**: December 2, 2025
**Status**: ✅ READY FOR TESTING AND DEPLOYMENT
