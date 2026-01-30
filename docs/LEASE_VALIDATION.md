# Lease End Date Validation

## Overview

This document describes the validation rules added to prevent PropertyTenant records from being created without a lease end date.

## Problem

Previously, tenants could be assigned to properties without a lease end date, causing:

- Lease expiration reports to show no data
- Tenant detail pages to not display lease information
- Difficulty in tracking lease renewals

## Solution

Multi-layered validation has been implemented at the backend, frontend, and business logic levels.

---

## Backend API Validation

### 1. Create Property Assignment (`POST /api/tenants/[id]/properties`)

**File:** `/app/api/tenants/[id]/properties/route.ts`

**Validation Rules:**

- `leaseEndDate` is **required** (cannot be empty or null)
- `leaseEndDate` must be **after** `leaseStartDate`

**Schema:**

```typescript
const assignPropertySchema = z
  .object({
    propertyId: z.string().min(1, 'Property is required'),
    leaseStartDate: z.string().min(1, 'Lease start date is required'),
    leaseEndDate: z.string().min(1, 'Lease end date is required'), // ← Required
    monthlyRent: z.number().min(0, 'Monthly rent must be a positive number'),
    // ... other fields
  })
  .refine(
    (data) => {
      const startDate = new Date(data.leaseStartDate);
      const endDate = new Date(data.leaseEndDate);
      return endDate > startDate; // ← Date validation
    },
    {
      message: 'Lease end date must be after lease start date',
      path: ['leaseEndDate'],
    }
  );
```

### 2. Update Property Assignment (`PATCH /api/tenants/[id]/properties/[propertyId]`)

**File:** `/app/api/tenants/[id]/properties/[propertyId]/route.ts`

**Validation Rules:**

- `leaseEndDate` cannot be set to empty/null
- If updating dates, `leaseEndDate` must be after `leaseStartDate`
- Active leases must always have an end date

**Additional Business Logic:**

```typescript
// Validates against both new and existing dates
const newStartDate = validatedData.leaseStartDate
  ? new Date(validatedData.leaseStartDate)
  : assignment.leaseStartDate;
const newEndDate = validatedData.leaseEndDate
  ? new Date(validatedData.leaseEndDate)
  : assignment.leaseEndDate;

if (newEndDate && newEndDate <= newStartDate) {
  return error('Lease end date must be after lease start date');
}

if (!newEndDate && assignment.isActive) {
  return error('Active leases must have an end date');
}
```

---

## Frontend Validation

### 1. Tenant Detail Page (`/tenants/[id]`)

**File:** `/app/(dashboard)/tenants/[id]/page.tsx`

**Changes:**

- Lease End Date field marked as required with `*` indicator
- Added `required` attribute to input fields
- Client-side validation before API call

**Assign Property Dialog:**

```typescript
const handleAssignPropertySubmit = () => {
  // Check all required fields
  if (!selectedProperty || !leaseStartDate || !leaseEndDate || !monthlyRent) {
    alert('Please fill in all required fields...');
    return;
  }

  // Validate date order
  const startDate = new Date(leaseStartDate);
  const endDate = new Date(leaseEndDate);
  if (endDate <= startDate) {
    alert('Lease end date must be after lease start date');
    return;
  }

  // Proceed with API call
};
```

**Edit Property Dialog:**

- Same validation logic applied
- Prevents removing lease end date from existing assignments

### 2. New Tenant Page (`/tenants/new`)

**File:** `/app/(dashboard)/tenants/new/page.tsx`

**Changes:**

- Updated Zod schema to require `leaseEndDate` when `assignProperty` is true
- Added date comparison validation
- Field marked as required in UI

**Schema Refinements:**

```typescript
.refine(
  (data) => {
    if (data.assignProperty && !data.leaseEndDate) {
      return false; // ← Required when assigning property
    }
    return true;
  },
  {
    message: 'Property, lease start date, lease end date, and monthly rent are required when assigning property',
    path: ['propertyId'],
  }
)
.refine(
  (data) => {
    // Validate date order
    if (data.assignProperty && data.leaseStartDate && data.leaseEndDate) {
      const startDate = new Date(data.leaseStartDate);
      const endDate = new Date(data.leaseEndDate);
      return endDate > startDate;
    }
    return true;
  },
  {
    message: 'Lease end date must be after lease start date',
    path: ['leaseEndDate'],
  }
);
```

---

## Service Layer (Not Modified)

**File:** `/lib/features/tenants/services/tenant.service.ts`

The `assignToProperty` method signature was kept flexible with optional `leaseEndDate` to maintain backward compatibility with other parts of the system. The API layer enforces the requirement instead.

---

## Error Messages

### Backend Errors

- `"Lease end date is required"` - When leaseEndDate is empty
- `"Lease end date must be after lease start date"` - When end date ≤ start date
- `"Active leases must have an end date"` - When trying to clear end date on active lease

### Frontend Errors

- Alert: "Please fill in all required fields (Property, Lease Start Date, Lease End Date, and Monthly Rent are required)"
- Alert: "Lease end date must be after lease start date"

---

## Testing Checklist

### Manual Testing

- [ ] Try to create property assignment without lease end date (should fail)
- [ ] Try to create with end date before start date (should fail)
- [ ] Create valid assignment with proper dates (should succeed)
- [ ] Try to edit and remove lease end date (should fail)
- [ ] Edit with valid dates (should succeed)
- [ ] Create new tenant with property assignment (test all validations)
- [ ] Verify lease expiration report shows data for valid leases
- [ ] Verify tenant detail page displays lease dates

### API Testing

```bash
# Should fail - missing leaseEndDate
curl -X POST /api/tenants/[id]/properties \
  -H "Content-Type: application/json" \
  -d '{"propertyId":"xxx","leaseStartDate":"2026-01-01","monthlyRent":1000}'

# Should fail - end date before start date
curl -X POST /api/tenants/[id]/properties \
  -H "Content-Type: application/json" \
  -d '{"propertyId":"xxx","leaseStartDate":"2026-06-01","leaseEndDate":"2026-01-01","monthlyRent":1000}'

# Should succeed
curl -X POST /api/tenants/[id]/properties \
  -H "Content-Type: application/json" \
  -d '{"propertyId":"xxx","leaseStartDate":"2026-01-01","leaseEndDate":"2027-01-01","monthlyRent":1000}'
```

---

## Migration Notes

### Existing Data

This validation does NOT affect existing PropertyTenant records with null `leaseEndDate`. However:

- Such records will not appear in lease expiration reports
- They can be updated through the UI to add lease end dates
- The system will prevent new records from being created without end dates

### Recommendations

- Run a query to identify PropertyTenant records with null leaseEndDate
- Update them through the UI or database migration
- Consider adding a warning banner for records without end dates

---

## Files Modified

1. `/app/api/tenants/[id]/properties/route.ts` - POST validation
2. `/app/api/tenants/[id]/properties/[propertyId]/route.ts` - PATCH/PUT validation
3. `/app/(dashboard)/tenants/[id]/page.tsx` - UI validation for assign & edit
4. `/app/(dashboard)/tenants/new/page.tsx` - UI validation for new tenants

---

## Related Issues

- Fixed: Lease expiration reports showing no data
- Fixed: Tenant detail pages not showing lease dates
- Prevented: Future creation of incomplete lease records

---

**Last Updated:** 2026-01-31
**Author:** Claude Sonnet 4.5
