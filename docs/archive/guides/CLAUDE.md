# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

DISTILLED_AESTHETICS_PROMPT = """
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:

- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>

## Project Overview

A multi-tenant Property Management CRM built with Next.js 16, supporting property management, bookings (short-term and long-term), tenant management, financial tracking, and document management. The system supports three user roles: SUPER_ADMIN, CUSTOMER (landlords), and TENANT with workspace-based multi-tenancy.

## Development Commands

### Core Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes Prisma migrate deploy & generate)
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### Testing

- `npm test` - Run tests in watch mode (Vitest)
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Open Vitest UI

### Database

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database (development)
- `npm run db:migrate` - Create and apply migration
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database
- `npm run db:reset` - Reset database and migrations (WARNING: destructive)

### Git Hooks

The project uses Husky for git hooks. Pre-commit runs lint-staged with linting and formatting.

## Architecture

### Three-Layer Architecture Pattern

The codebase follows a structured three-layer pattern for scalability and maintainability:

#### 1. API Layer (`app/api/**/route.ts`)

- HTTP request/response handling
- Input validation using Zod schemas (DTOs)
- Session authentication via `requireAuth()` and related helpers
- Error handling via `handleApiError()` global handler
- Audit logging via `logAudit()`
- **NEVER** contains business logic or direct database queries

#### 2. Service Layer (`lib/features/[feature]/services/*.service.ts`)

- Business logic and validation rules
- Orchestration of multiple operations
- Transaction coordination
- Notification triggers
- Complex calculations and aggregations
- **NEVER** handles HTTP concerns

#### 3. Repository Layer (`lib/features/[feature]/repositories/*.repository.ts`)

- Data access abstraction
- Prisma query construction
- Database operations (CRUD)
- Query optimization
- **NEVER** contains business logic

### Feature Structure

Each feature follows this consistent structure:

```
lib/features/[feature]/
├── dtos/              # Zod validation schemas
├── services/          # Business logic
├── repositories/      # Data access
└── index.ts          # Public exports
```

Implemented features with full architecture:

- `bookings` - Booking management (reference implementation)
- `payments` - Payment processing
- `expenses` - Expense tracking
- `tenants` - Tenant management
- `properties` - Property management
- `maintenance` - Maintenance requests

### Multi-Tenancy & Authentication

#### Organization Context

Every authenticated session includes:

- `session.user.id` - The logged-in user's ID
- `session.user.organizationId` - Current active workspace ID (defaults to user's own ID)
- `session.user.isTeamMember` - Boolean indicating team member access
- `session.user.organizationName` - Display name of current workspace
- `session.user.role` - UserRole enum: SUPER_ADMIN, CUSTOMER, TENANT

#### Key Auth Patterns

**Basic Authentication:**

```typescript
import { requireAuth } from '@/lib/auth-helpers';

const session = await requireAuth();
// Always use session.user.organizationId for data queries
```

**Resource Access Control:**

```typescript
import { requireResourceAccess } from '@/lib/auth-helpers-enhanced';

const property = await prisma.property.findUnique({ where: { id } });
await requireResourceAccess(property.userId); // Verifies owner or team member
```

**Permission-Based Access:**

```typescript
import { requirePermission } from '@/lib/auth-helpers-enhanced';

// Requires specific permission (canManageProperties, canManageBookings, etc.)
const session = await requirePermission(resourceUserId, 'canManageProperties');
```

#### Critical Security Rules

1. **ALWAYS** use `session.user.organizationId` for data queries, NEVER user-provided IDs
2. **ALWAYS** verify resource ownership with `requireResourceAccess()` before operations
3. **ALWAYS** check permissions for mutations using `requirePermission()`
4. **ALWAYS** log mutations using `logAudit()`

### Routing & Role-Based Access

#### Three User Roles with Distinct Routes

- **SUPER_ADMIN**: `/admin/*` - System administration
- **CUSTOMER** (landlords): `/dashboard/*`, `/properties/*`, `/bookings/*`, etc.
- **TENANT**: `/portal/*` - Limited tenant-facing portal

Routing is enforced in `middleware.ts` using NextAuth middleware.

### File Upload System

Two storage backends supported:

- **UploadThing** (development/staging) - Uses `UPLOADTHING_TOKEN`
- **AWS S3** (production) - Uses `AWS_*` environment variables

Configuration in `lib/uploadthing.ts` and `lib/s3.ts`.

### Database Schema

PostgreSQL with Prisma ORM. Key models:

- **User** - Multi-role users (SUPER_ADMIN, CUSTOMER, TENANT)
- **Property** - Properties with LONG_TERM, SHORT_TERM, or BOTH rental types
- **Booking** - Reservations with guest and payment tracking
- **Tenant** - Tenant records with employment/document tracking
- **PropertyTenant** - Junction table for long-term leases
- **TeamMember** - Team collaboration with granular permissions
- **Document/DocumentFolder** - Hierarchical document management
- **AuditLog** - Full audit trail for all mutations

All main entities have a `userId` field representing the organization owner.

### Shared Libraries

#### Error Handling (`lib/shared/errors/`)

- Custom error classes: `NotFoundError`, `ForbiddenError`, `ValidationError`, `UnauthorizedError`
- Global error handler: `handleApiError()` - normalizes error responses
- Use custom errors for better API responses

#### Audit System (`lib/shared/audit.ts`)

Functions:

- `logAudit(session, action, entity, entityId, changes?, request?)` - Log single action
- `logBulkAudit(session, entries[], request?)` - Log multiple actions
- `getEntityAuditHistory(entityId)` - Retrieve entity history
- `getUserAuditHistory(userId)` - Retrieve user actions
- `getOrganizationRecentActivity(organizationId)` - Organization activity feed

#### Logging (`lib/shared/logger.ts`)

Context-aware logging utilities for development debugging.

### State Management

- **NextAuth** for authentication state
- **Zustand** for client-side state management (store patterns in components/features)
- **TanStack Query** for server state caching and mutations

### UI Components

- **Radix UI** primitives for accessible components
- **shadcn/ui** design system in `components/ui/`
- **Tailwind CSS** v4 for styling
- **Lucide React** for icons

Component organization:

- `components/ui/` - Base UI components (buttons, inputs, dialogs, etc.)
- `components/dashboard/` - Customer dashboard components
- `components/admin/` - Admin panel components
- `components/documents/` - Document management components
- `components/shared/` - Shared components across roles

### Path Aliases

All imports use `@/` alias pointing to project root:

```typescript
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
```

## Important Implementation Notes

### API Route Pattern

```typescript
// app/api/[feature]/route.ts
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { logAudit } from '@/lib/shared/audit';
import { featureService, createFeatureSchema } from '@/lib/features/[feature]';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const validatedData = createFeatureSchema.parse(body);

    const result = await featureService.create(session.user.organizationId, validatedData);

    await logAudit(session, 'created', 'feature', result.id, undefined, request);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Document Management

Documents are organized in a hierarchical folder structure with:

- Color coding and icons for visual organization
- Multi-level nesting support
- Association with properties, tenants, or standalone
- Soft delete via `deletedAt` timestamp

See `lib/document-folders.ts` for folder utilities.

### Calendar Integration

The system supports iCal calendar syncing for Airbnb/Booking.com integration.

- Calendar sync logic in `lib/calendar-sync.ts`
- Supports multiple calendar URLs per property
- Automatic booking conflict detection

### Subscription Tiers

- **FREE**: 1 property (trial period)
- **STARTER**: 5 properties - R199/month
- **PROFESSIONAL**: 20 properties - R499/month
- **ENTERPRISE**: Unlimited - R999/month

Subscription logic should enforce property limits based on `user.propertyLimit`.

## TypeScript Configuration

- Strict mode enabled except `noImplicitAny: false`
- React JSX runtime (no React imports needed)
- Module resolution: bundler
- Target: ES2017

## Testing Guidelines

- Tests use Vitest with React Testing Library
- Setup file: `vitest.setup.tsx`
- Run tests before committing changes
- Aim for coverage of service layer business logic

## Migration Notes

When adding new features:

1. Create feature folder structure in `lib/features/[feature]/`
2. Implement DTOs (Zod schemas) first
3. Build repository layer (data access)
4. Build service layer (business logic)
5. Create API routes (thin HTTP layer)
6. Add to appropriate dashboard/admin UI
7. Update audit logging if needed
8. Write tests for service layer

Refer to `lib/features/bookings/` as the reference implementation.

## Environment Variables

Required variables (see `.env.example`):

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Auth secret (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Base URL for NextAuth
- `UPLOADTHING_TOKEN` - UploadThing secret (dev/staging)
- `AWS_*` - AWS S3 credentials (production file uploads)

## Additional Documentation

For deeper understanding, refer to:

- `ARCHITECTURE_GUIDE.md` - Detailed architecture patterns and examples
- `MULTI_TENANCY_GUIDE.md` - Complete multi-tenancy implementation guide
- `prisma/schema.prisma` - Full database schema with enums and relations
