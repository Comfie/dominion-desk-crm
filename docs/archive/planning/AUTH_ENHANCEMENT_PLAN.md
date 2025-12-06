# NextAuth Enhancement Plan for Multi-Tenancy

## Current State

- ✅ NextAuth v4 with Credentials Provider
- ✅ JWT sessions with user ID, role, accountType
- ✅ Basic role-based routing (middleware.ts)
- ✅ Helper functions (requireAuth, requireCustomer, etc.)

## Enhancements Needed (Stay with NextAuth)

### 1. Add Organization/Workspace Context

**Problem:** Right now, users only have `userId`. For team collaboration, you need workspace context.

**Solution:** Extend session to include current workspace/organization.

```typescript
// lib/auth.ts - Enhanced callbacks
callbacks: {
  async jwt({ token, user, trigger, session }) {
    if (user) {
      token.id = user.id;
      token.role = user.role;
      token.accountType = user.accountType;

      // Add default organization ID (user's own workspace)
      token.organizationId = user.id; // Each user is their own org by default
    }

    // Allow switching organizations (for team members)
    if (trigger === 'update' && session?.organizationId) {
      token.organizationId = session.organizationId;
    }

    return token;
  },

  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.accountType = token.accountType;
      session.user.organizationId = token.organizationId; // 🆕 Organization context
    }
    return session;
  },
}
```

### 2. Enhance Authorization Helpers

**Current:** Only check if user is authenticated
**Needed:** Check if user has access to specific resources

```typescript
// lib/shared/middleware/auth.middleware.ts
export async function requireAuth(): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return session;
}

// 🆕 Check resource ownership OR team access
export async function requireResourceAccess(resourceUserId: string): Promise<Session> {
  const session = await requireAuth();

  // User owns the resource
  if (session.user.id === resourceUserId) {
    return session;
  }

  // Check if user is a team member with access
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      userId: resourceUserId, // The resource owner
      email: session.user.email,
      status: 'ACCEPTED',
    },
  });

  if (!teamMember) {
    throw new ForbiddenError('You do not have access to this resource');
  }

  return session;
}

// 🆕 Check specific permission
export async function requirePermission(
  resourceUserId: string,
  permission:
    | 'canManageProperties'
    | 'canManageBookings'
    | 'canManageTenants'
    | 'canManageFinancials'
): Promise<Session> {
  const session = await requireAuth();

  // Owner has all permissions
  if (session.user.id === resourceUserId) {
    return session;
  }

  // Check team member permissions
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      userId: resourceUserId,
      email: session.user.email,
      status: 'ACCEPTED',
      [permission]: true, // Must have specific permission
    },
  });

  if (!teamMember) {
    throw new ForbiddenError(`You do not have permission to perform this action`);
  }

  return session;
}
```

### 3. Add Organization Switcher

For team members who belong to multiple organizations:

```typescript
// app/api/auth/switch-organization/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = await request.json();

  // Verify user has access to this organization
  const teamMember = await prisma.teamMember.findFirst({
    where: {
      userId: organizationId,
      email: session.user.email,
      status: 'ACCEPTED',
    },
  });

  if (!teamMember && organizationId !== session.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Update session
  await fetch('/api/auth/session', {
    method: 'POST',
    body: JSON.stringify({ organizationId }),
  });

  return NextResponse.json({ success: true });
}
```

### 4. Update Queries to Respect Organization Context

**Current:**

```typescript
// ❌ Only checks user ownership
const properties = await prisma.property.findMany({
  where: { userId: session.user.id },
});
```

**Enhanced:**

```typescript
// ✅ Checks ownership OR team access
const properties = await prisma.property.findMany({
  where: {
    userId: session.user.organizationId, // Use organization context
  },
});
```

### 5. Add Audit Trail

Track who did what in which organization:

```typescript
// lib/shared/audit.ts
export async function logAudit(
  session: Session,
  action: string,
  entity: string,
  entityId: string,
  changes?: unknown
) {
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action,
      entity,
      entityId,
      changes,
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    },
  });
}

// Usage in API routes
await logAudit(session, 'updated', 'property', propertyId, {
  before: oldData,
  after: newData,
});
```

---

## Migration to Better Auth (Future - 6 Months)

When you're ready, here's the migration plan:

### Phase 1: Preparation (Week 1)

- [ ] Review Better Auth documentation
- [ ] Create migration plan
- [ ] Set up Better Auth in development
- [ ] Test with existing database

### Phase 2: Parallel Run (Week 2-3)

- [ ] Keep NextAuth as primary
- [ ] Add Better Auth alongside
- [ ] Migrate sessions gradually
- [ ] Test all auth flows

### Phase 3: Cutover (Week 4)

- [ ] Switch to Better Auth
- [ ] Monitor for issues
- [ ] Keep NextAuth as fallback
- [ ] Remove NextAuth after stable

### Better Auth Features You'll Get

```typescript
// Built-in organization management
import { createOrganization, addMember } from 'better-auth';

// Built-in role system
import { assignRole, checkPermission } from 'better-auth/roles';

// Built-in impersonation
import { impersonate } from 'better-auth/admin';

// Built-in 2FA
import { enable2FA, verify2FA } from 'better-auth/2fa';
```

---

## Decision Matrix

| Feature            | NextAuth (Now)    | Better Auth (Future) | Effort    |
| ------------------ | ----------------- | -------------------- | --------- |
| Basic auth         | ✅ Working        | ✅ Better            | Low       |
| Role-based access  | ⚠️ Manual         | ✅ Built-in          | Medium    |
| Multi-tenant       | ⚠️ Custom         | ✅ Built-in          | High      |
| Team collaboration | ❌ Build yourself | ✅ Built-in          | High      |
| 2FA/Passkeys       | ❌ Build yourself | ✅ Built-in          | Medium    |
| Impersonation      | ❌ Build yourself | ✅ Built-in          | Medium    |
| Migration cost     | -                 | -                    | 2-3 weeks |

---

## Recommendation Timeline

### Now (Phase 1-2: Weeks 1-8)

- ✅ **Stay with NextAuth**
- ✅ Enhance with organization context
- ✅ Add permission helpers
- ✅ Focus on architecture foundations

### Later (Phase 3-4: Months 3-6)

- ⏭️ **Evaluate Better Auth** when you need:
  - Built-in organization management
  - Advanced RBAC
  - 2FA/Passkeys
  - Impersonation for support

### Trigger Points for Migration

Migrate to Better Auth when you hit **2 or more** of these:

1. ✅ You need granular permissions (beyond current 4 flags)
2. ✅ You need organization/workspace switching UI
3. ✅ Support team needs to impersonate users
4. ✅ Customers demand 2FA for compliance
5. ✅ You're building team invitation flows from scratch
6. ✅ Session management becomes complex

---

## Summary

**Current Recommendation:** **Stick with NextAuth**

**Why:**

- Working auth is valuable
- Focus on higher-priority refactoring
- NextAuth can be enhanced for your needs
- Migration is risky during architecture changes

**Future Plan:**

- Enhance NextAuth with organization context (2 weeks)
- Migrate to Better Auth in 6 months when you need advanced features

**ROI:**

- Enhancing NextAuth: 2 weeks, gets you 80% there
- Migrating to Better Auth: 3 weeks, gets you 100% + future features

**Decision:** Enhance now, migrate later when justified by feature needs.
