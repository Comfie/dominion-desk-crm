Add a Super Admin portal to this property management CRM for platform administration and monitoring.

IMPORTANT CONTEXT:
This app has THREE user types with different portals:

1. SUPER_ADMIN (platform owner) → /admin/\* → manages entire platform
2. CUSTOMER (landlords/property managers) → /dashboard/\* → manages properties & tenants
3. TENANT (renters) → /tenant/\* → views lease, pays rent, submits maintenance requests

The tenant portal already exists. DO NOT modify it. Only add the super admin portal.

REQUIREMENTS:

1.  DATABASE CHANGES (prisma/schema.prisma):
    - Add 'role' field to User model:
      role UserRole @default(CUSTOMER)
    - Add enum:
      enum UserRole {
      SUPER_ADMIN
      CUSTOMER  
       TENANT
      }
    - Update seed file to create super admin user:
      - Email: admin@propertycrm.com
      - Password: Admin@123
      - Role: SUPER_ADMIN
      - firstName: Super
      - lastName: Admin

2.  CREATE ADMIN PORTAL STRUCTURE (app/admin/):

    Create these pages:

    a) app/admin/users/page.tsx - User Management Dashboard
    Display all CUSTOMER role users (landlords) with:
    - Full name
    - Email address
    - Subscription tier (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
    - Subscription status (TRIAL, ACTIVE, PAST_DUE, CANCELLED, EXPIRED)
    - Number of properties they manage
    - MRR (Monthly Recurring Revenue) from this user
    - Join date (createdAt)
    - Last login
    - Account status (active/inactive)

    Features:
    - Search by name or email
    - Filter by subscription tier
    - Filter by subscription status
    - Sort by MRR, join date, properties count
    - Pagination (20 users per page)
    - Action buttons: View Details, Edit Subscription, Deactivate/Activate

    b) app/admin/analytics/page.tsx - Platform Analytics Dashboard
    Display key metrics:

    Top Cards:
    - Total MRR (sum of all active subscriptions)
    - Total Landlords (CUSTOMER role users)
    - Active Landlords (subscriptionStatus = ACTIVE)
    - Trial Users (subscriptionStatus = TRIAL)
    - Total Properties (across all landlords)
    - Total Bookings (across all landlords)
    - Total Tenants (across all landlords)
    - Churn Rate (cancelled in last 30 days / total active)

    Charts/Breakdowns:
    - Revenue by subscription tier (pie chart or bar chart)
    - User growth over last 12 months (line chart)
    - Recent signups (last 7 days) - list
    - Recent cancellations (last 7 days) - list

    c) app/admin/subscriptions/page.tsx - Subscription Management
    Display all subscriptions with:
    - User name
    - Subscription tier
    - Status
    - Next billing date (subscriptionEndsAt)
    - Last payment date
    - MRR

    Features:
    - Filter by status (ACTIVE, TRIAL, PAST_DUE, etc.)
    - Search by user name
    - Sort by next billing date
    - Actions: Change Plan, Extend Trial, Cancel Subscription

    d) app/admin/layout.tsx - Admin Layout
    Create admin-specific layout with:
    - Different sidebar from /dashboard
    - Navigation menu items:
      - Users
      - Analytics
      - Subscriptions
      - Settings (placeholder for future)
    - User info showing "Super Admin" role
    - Logout button
    - DO NOT reuse /dashboard layout

3.  API ROUTES (app/api/admin/):

    Create these endpoints:

    a) app/api/admin/users/route.ts
    GET - List all users with role = CUSTOMER
    Response should include:
    - User basic info (id, name, email, role)
    - Subscription details (tier, status, dates)
    - Counts: properties, bookings, tenants
    - Calculated MRR

    Security: Check session.user.role === 'SUPER_ADMIN'

    b) app/api/admin/analytics/route.ts
    GET - Platform-wide analytics
    Calculate:
    - Total MRR
    - User counts by status
    - Total properties/bookings/tenants across platform
    - Revenue breakdown by tier
    - Growth metrics

    Security: Check session.user.role === 'SUPER_ADMIN'

    c) app/api/admin/subscriptions/route.ts
    GET - All subscriptions list
    PUT - Update subscription (change tier, extend trial, cancel)

    Security: Check session.user.role === 'SUPER_ADMIN'

    d) app/api/admin/users/[id]/route.ts
    GET - Single user details
    PUT - Update user (activate/deactivate, change subscription)

    Security: Check session.user.role === 'SUPER_ADMIN'

4.  AUTHENTICATION & AUTHORIZATION:

    a) Update middleware.ts:
    Add route protection for /admin/\*

        Three-way redirect logic after login:
        - if (role === 'SUPER_ADMIN') → redirect to /admin/users
        - if (role === 'CUSTOMER') → redirect to /dashboard
        - if (role === 'TENANT') → redirect to /tenant/dashboard

        Route protection:
        - /admin/* → only SUPER_ADMIN
        - /dashboard/* → only CUSTOMER
        - /tenant/* → only TENANT

        If user tries to access unauthorized route → redirect to their home

    b) Add role check helper (lib/auth-helpers.ts):

    c) Use in all admin API routes:

    export async function GET(request: Request) {
    const session = await requireSuperAdmin();
    // ... admin logic
    }

5.  UI COMPONENTS (components/admin/):

Create reusable admin components:

- components/admin/user-table.tsx - Table for users list
- components/admin/stats-card.tsx - Metric cards for analytics
- components/admin/subscription-badge.tsx - Status badges
- components/admin/revenue-chart.tsx - Chart component for revenue

Use existing shadcn/ui components:

- Table, Card, Badge, Button, Select, Input
- Keep consistent with app design

6. SECURITY REQUIREMENTS:
   - ALL /api/admin/\* routes MUST check role === SUPER_ADMIN
   - Return 403 Forbidden if not authorized
   - Never expose sensitive data (passwords, API keys) in admin responses
   - Add audit logging for admin actions (optional but recommended):
     - Log when admin changes user subscription
     - Log when admin activates/deactivates user
   - Prevent CUSTOMER or TENANT from accessing admin routes
   - Prevent SUPER_ADMIN from accessing /tenant/\* routes

7. DATA ISOLATION:

   Admin portal shows:
   - ✅ All landlords (CUSTOMER role)
   - ✅ Platform-wide statistics
   - ✅ Subscription data

   Admin portal does NOT show:
   - ❌ Individual tenant details (tenants belong to landlords)
   - ❌ Individual property details (managed by landlords)
   - ❌ Individual bookings (managed by landlords)

   Admin sees aggregated data only, not detailed property/tenant info.

8. STYLING & UX:
   - Use Tailwind CSS
   - Use existing shadcn/ui component library
   - Match overall app design language
   - Mobile responsive
   - Loading states for data fetching
   - Error states for failed API calls
   - Success/error toasts for actions
   - Confirmation dialogs for destructive actions (deactivate user, cancel subscription)

9. MIGRATION:

   Create Prisma migration for:
   - Adding 'role' field to User table
   - Setting default role = CUSTOMER for existing users
   - Run: npx prisma migrate dev --name add_user_roles

10. TESTING CHECKLIST:

    After implementation, verify:
    - [ ] Super admin can login and access /admin
    - [ ] Landlords CANNOT access /admin (403 or redirect)
    - [ ] Tenants CANNOT access /admin (403 or redirect)
    - [ ] Admin can see all landlords in user list
    - [ ] Analytics show correct totals
    - [ ] MRR calculation is accurate
    - [ ] Subscription changes work
    - [ ] Search and filters work
    - [ ] Mobile responsive
    - [ ] No existing functionality broken

CRITICAL REMINDERS:

- Keep /dashboard/\* (landlord portal) completely unchanged
- Keep /tenant/\* (tenant portal) completely unchanged
- Admin sees landlords, NOT individual tenants/properties
- Three completely separate portals in one app
- All admin routes protected by role check
- Use existing UI components and styling

DELIVERABLES:

1. Updated Prisma schema with UserRole enum
2. Migration file for adding role field
3. Seed file with super admin user
4. Complete /admin portal with all pages
5. All API routes with proper authorization
6. Updated middleware with three-way routing
7. Admin layout and components
8. TypeScript types for all new code

Please implement the complete super admin portal following these specifications.
