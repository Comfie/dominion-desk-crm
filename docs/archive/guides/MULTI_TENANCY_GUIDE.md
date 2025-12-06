# Multi-Tenancy Implementation Guide

## Overview

The Property Management CRM now supports **workspace-based multi-tenancy** with team collaboration. Each landlord (CUSTOMER) has their own workspace, and can invite team members to collaborate with granular permissions.

---

## Key Concepts

### 1. Organizations (Workspaces)

- **Organization = User's workspace**
- Each user (landlord) is automatically their own organization owner
- Organization ID = User ID
- Team members can access multiple organizations

### 2. Session Context

Every authenticated session now includes:

```typescript
session.user.id; // The logged-in user's ID
session.user.organizationId; // Current active workspace ID
session.user.isTeamMember; // true if accessing via team membership
session.user.organizationName; // Display name of current workspace
```

### 3. Access Control Hierarchy

```
1. Owner (organizationId === userId)
   ├─ Full access to everything
   └─ Can invite team members

2. Team Member (via TeamMember table)
   ├─ Access based on permissions
   ├─ canManageProperties
   ├─ canManageBookings
   ├─ canManageTenants
   ├─ canManageFinancials
   └─ canViewReports
```

---

## Usage Examples

### 1. Basic Authentication

```typescript
// app/api/properties/route.ts
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  const session = await requireAuth();

  // Fetch properties for current organization
  const properties = await prisma.property.findMany({
    where: {
      userId: session.user.organizationId, // ✅ Uses organization context
    },
  });

  return NextResponse.json(properties);
}
```

### 2. Resource Access Control

```typescript
// app/api/properties/[id]/route.ts
import { requireResourceAccess } from '@/lib/auth-helpers-enhanced';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Get the property
  const property = await prisma.property.findUnique({
    where: { id: params.id },
  });

  if (!property) {
    throw new NotFoundError('Property', params.id);
  }

  // ✅ Check if user has access (owner OR team member)
  await requireResourceAccess(property.userId);

  return NextResponse.json(property);
}
```

### 3. Permission-Based Access

```typescript
// app/api/properties/[id]/route.ts
import { requirePermission } from '@/lib/auth-helpers-enhanced';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
  });

  if (!property) {
    throw new NotFoundError('Property', params.id);
  }

  // ✅ Requires specific permission to edit properties
  const session = await requirePermission(property.userId, 'canManageProperties');

  const data = await request.json();
  const updated = await prisma.property.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(updated);
}
```

### 4. Audit Logging

```typescript
// app/api/bookings/route.ts
import { requireAuth } from '@/lib/auth-helpers';
import { logAudit } from '@/lib/shared/audit';

export async function POST(request: Request) {
  const session = await requireAuth();
  const data = await request.json();

  const booking = await prisma.booking.create({
    data: {
      ...data,
      userId: session.user.organizationId,
    },
  });

  // ✅ Log the action
  await logAudit(session, 'created', 'booking', booking.id, undefined, request);

  return NextResponse.json(booking);
}
```

### 5. Update Audit Trail

```typescript
// app/api/properties/[id]/route.ts
import { logAudit } from '@/lib/shared/audit';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await requirePermission(property.userId, 'canManageProperties');

  // Get current data
  const oldProperty = await prisma.property.findUnique({
    where: { id: params.id },
  });

  // Update
  const data = await request.json();
  const newProperty = await prisma.property.update({
    where: { id: params.id },
    data,
  });

  // ✅ Log with before/after
  await logAudit(
    session,
    'updated',
    'property',
    params.id,
    {
      before: { name: oldProperty?.name },
      after: { name: newProperty.name },
    },
    request
  );

  return NextResponse.json(newProperty);
}
```

---

## Frontend Integration

### 1. Organization Switcher Component

```typescript
// components/dashboard/organization-switcher.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function OrganizationSwitcher() {
  const { data: session, update } = useSession();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch available organizations
    fetch('/api/auth/switch-organization')
      .then((res) => res.json())
      .then((data) => setOrganizations(data.data));
  }, []);

  const switchOrganization = async (orgId: string) => {
    setLoading(true);

    try {
      // Call API to validate and prepare switch
      await fetch('/api/auth/switch-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId }),
      });

      // Update session
      await update({ organizationId: orgId });

      // Reload page to refresh all data
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch organization:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="organization-switcher">
      <label>Current Workspace:</label>
      <select
        value={session?.user?.organizationId}
        onChange={(e) => switchOrganization(e.target.value)}
        disabled={loading}
      >
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name} {org.isOwner ? '(Owner)' : `(${org.role})`}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### 2. Using Session in Client Components

```typescript
'use client';

import { useSession } from 'next-auth/react';

export function Dashboard() {
  const { data: session } = useSession();

  if (!session) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Organization: {session.user.organizationName}</p>
      <p>
        {session.user.isTeamMember
          ? 'You are viewing as a team member'
          : 'You are the owner'}
      </p>
    </div>
  );
}
```

---

## Team Member Invitation Flow

### 1. Create Invitation API

```typescript
// app/api/team/invitations/route.ts
import { requireAuth } from '@/lib/auth-helpers';
import { logAudit } from '@/lib/shared/audit';

export async function POST(request: Request) {
  const session = await requireAuth();
  const { email, role, permissions } = await request.json();

  // Create team member invitation
  const invitation = await prisma.teamMember.create({
    data: {
      userId: session.user.organizationId, // Owner's ID
      email,
      firstName: '', // To be filled when accepted
      lastName: '',
      role,
      canManageProperties: permissions.canManageProperties,
      canManageBookings: permissions.canManageBookings,
      canManageTenants: permissions.canManageTenants,
      canManageFinancials: permissions.canManageFinancials,
      canViewReports: permissions.canViewReports,
      status: 'PENDING',
    },
  });

  // Log the invitation
  await logAudit(
    session,
    'created',
    'team_member',
    invitation.id,
    { email, role, permissions },
    request
  );

  // TODO: Send invitation email
  // await sendInvitationEmail(email, invitation.id);

  return NextResponse.json(invitation);
}
```

### 2. Accept Invitation

When a user signs in with the invited email, check for pending invitations:

```typescript
// lib/auth.ts - Add to authorize callback
async authorize(credentials) {
  // ... existing auth logic ...

  // Check for pending team invitations
  const pendingInvitations = await prisma.teamMember.count({
    where: {
      email: user.email,
      status: 'PENDING',
    },
  });

  if (pendingInvitations > 0) {
    // Store in session to show invitation modal
    // Or auto-accept based on your UX flow
  }

  return {
    id: user.id,
    email: user.email,
    // ...
  };
}
```

---

## Migration Guide (Existing Data)

If you have existing data, all queries will automatically use `organizationId`:

```typescript
// Before (implicit)
const properties = await prisma.property.findMany({
  where: { userId: session.user.id },
});

// After (explicit organization context)
const properties = await prisma.property.findMany({
  where: { userId: session.user.organizationId },
});
```

**No database migration needed!** The `organizationId` defaults to the user's own ID.

---

## Testing Multi-Tenancy

### 1. Test Own Workspace

```typescript
// Create a user and access their own data
const session = await signIn({ email: 'landlord@example.com' });
// session.user.organizationId === session.user.id (owner)
```

### 2. Test Team Member Access

```typescript
// 1. Create team member
await prisma.teamMember.create({
  data: {
    userId: 'landlord-user-id',
    email: 'assistant@example.com',
    status: 'ACCEPTED',
    canManageBookings: true,
    canViewReports: true,
  },
});

// 2. Sign in as team member
const session = await signIn({ email: 'assistant@example.com' });

// 3. Switch to landlord's organization
await fetch('/api/auth/switch-organization', {
  method: 'POST',
  body: JSON.stringify({ organizationId: 'landlord-user-id' }),
});

// Now session.user.organizationId === 'landlord-user-id'
// And session.user.isTeamMember === true
```

### 3. Test Permission Enforcement

```typescript
// Team member with only canViewReports = true
const session = await requirePermission(propertyUserId, 'canManageProperties');
// Throws ForbiddenError

const session = await requirePermission(propertyUserId, 'canViewReports');
// Succeeds ✅
```

---

## Security Considerations

### 1. Always Use organizationId

```typescript
// ❌ BAD - Allows access to any user's data
const properties = await prisma.property.findMany({
  where: { userId: request.query.userId },
});

// ✅ GOOD - Scoped to current organization
const properties = await prisma.property.findMany({
  where: { userId: session.user.organizationId },
});
```

### 2. Verify Resource Ownership

```typescript
// ❌ BAD - No ownership check
const property = await prisma.property.findUnique({
  where: { id: params.id },
});

// ✅ GOOD - Verify access
const property = await prisma.property.findUnique({
  where: { id: params.id },
});
await requireResourceAccess(property.userId);
```

### 3. Check Permissions for Mutations

```typescript
// ✅ GOOD - Require specific permission for updates
await requirePermission(property.userId, 'canManageProperties');
```

---

## API Reference

### Session Object

```typescript
interface Session {
  user: {
    id: string; // Logged-in user's ID
    organizationId: string; // Current workspace ID
    organizationName?: string; // Workspace display name
    isTeamMember?: boolean; // true if team member
    role: UserRole; // CUSTOMER, TENANT, SUPER_ADMIN
    accountType: string; // INDIVIDUAL, COMPANY, etc.
    email: string;
    name: string;
  };
}
```

### Auth Helpers

```typescript
// Basic auth
requireAuth(): Promise<Session>
requireCustomer(): Promise<Session>
requireTenant(): Promise<Session>
requireSuperAdmin(): Promise<Session>

// Multi-tenancy
requireResourceAccess(resourceUserId: string): Promise<Session>
requirePermission(resourceUserId: string, permission: Permission): Promise<Session>
getUserOrganizations(): Promise<Organization[]>
```

### Audit Functions

```typescript
logAudit(session, action, entity, entityId, changes?, request?): Promise<void>
logBulkAudit(session, entries[], request?): Promise<void>
getEntityAuditHistory(entityId, limit?): Promise<AuditLog[]>
getUserAuditHistory(userId, limit?): Promise<AuditLog[]>
getOrganizationRecentActivity(organizationId, limit?): Promise<AuditLog[]>
```

---

## Summary

✅ **Implemented:**

- Organization context in sessions
- Team member access control
- Permission-based authorization
- Organization switcher API
- Audit logging system

✅ **Backward Compatible:**

- Existing code works (organizationId = userId by default)
- No database migration needed
- Opt-in enhancement

✅ **Ready for:**

- Team collaboration
- Multi-workspace access
- Granular permissions
- Audit trails

**Next Steps:**

1. Add organization switcher to UI
2. Build team invitation flow
3. Add permission UI in team settings
4. Display audit logs in admin panel
