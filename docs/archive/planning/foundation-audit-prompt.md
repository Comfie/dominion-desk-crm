# Property Management CRM - System Foundation & Maintainability Audit

You are an expert full-stack architect specializing in Next.js, TypeScript, and enterprise-grade systems. Your task is to audit and improve the codebase of a Property Management CRM to ensure it has a solid, maintainable foundation.

## Context

This is a multi-tenant Property Management CRM built with:

- **Frontend**: Next.js 14/15 (App Router), TypeScript, React, shadcn/ui, Tailwind CSS
- **Backend**: Next.js API Routes / Server Actions, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Target Scale**: 500+ users, 5,000+ properties, 50,000+ bookings

**Core Features:**

- Property management (CRUD, images, amenities)
- Booking management (calendar, availability checking, double-booking prevention)
- Tenant management (documents, leases, payments)
- Financial management (payments, expenses, invoicing, reporting)
- Maintenance tracking
- Communication (email, SMS, in-app messaging)
- Integrations (Airbnb, Booking.com calendar sync, Paystack payments)

## Your Mission

Analyze the codebase and perform the following:

### 1. **Architecture Patterns Audit**

Check if the following patterns are properly implemented:

#### A. Service Layer Pattern

- [ ] Are business logic concerns separated from API routes?
- [ ] Do we have dedicated service classes/functions for each domain?
- [ ] Is validation logic centralized in services, not scattered in routes?

**Expected Structure:**

```typescript
// ✅ Good
// lib/services/booking.service.ts
export class BookingService {
  constructor(
    private repository: BookingRepository,
    private eventBus: EventBus
  ) {}

  async create(data: CreateBookingDTO): Promise<Booking> {
    await this.validateAvailability(data);
    const booking = await this.repository.create(data);
    await this.eventBus.publish('booking.created', booking);
    return booking;
  }

  private async validateAvailability(data: CreateBookingDTO) {
    // Complex business logic here
  }
}

// ❌ Bad
// app/api/bookings/route.ts
export async function POST(request: Request) {
  const data = await request.json();

  // Business logic directly in route ❌
  const overlapping = await prisma.booking.findMany({...});
  if (overlapping.length > 0) throw new Error();

  const booking = await prisma.booking.create({...});
  await sendEmail(...); // Side effects in route ❌

  return NextResponse.json(booking);
}
```

**Action Required:**

- Identify all API routes that contain business logic
- Extract business logic into service files
- Create service classes for: `BookingService`, `PropertyService`, `TenantService`, `PaymentService`, `MaintenanceService`

#### B. Repository Pattern

- [ ] Is database access abstracted from business logic?
- [ ] Are Prisma queries centralized in repository files?
- [ ] Can we swap ORMs without touching business logic?

**Expected Structure:**

```typescript
// ✅ Good
// lib/repositories/booking.repository.ts
export class BookingRepository {
  async findByProperty(propertyId: string): Promise<Booking[]> {
    return prisma.booking.findMany({
      where: { propertyId },
      include: { tenant: true, property: true },
    });
  }

  async findOverlapping(propertyId: string, checkIn: Date, checkOut: Date): Promise<Booking[]> {
    return prisma.booking.findMany({
      where: {
        propertyId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            AND: [{ checkInDate: { lte: checkOut } }, { checkOutDate: { gte: checkIn } }],
          },
        ],
      },
    });
  }
}
```

**Action Required:**

- Create repository classes for all major entities
- Move all Prisma queries from services into repositories
- Services should only call repository methods, never Prisma directly

#### C. Feature-Based Folder Structure

- [ ] Is code organized by feature rather than by type?
- [ ] Can I understand a feature by looking at one folder?

**Expected Structure:**

```
lib/
├── features/
│   ├── bookings/
│   │   ├── services/
│   │   │   └── booking.service.ts
│   │   ├── repositories/
│   │   │   └── booking.repository.ts
│   │   ├── dto/
│   │   │   ├── create-booking.dto.ts
│   │   │   └── update-booking.dto.ts
│   │   ├── validators/
│   │   │   └── booking.validator.ts
│   │   └── types/
│   │       └── booking.types.ts
│   ├── properties/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── dto/
│   │   └── types/
│   ├── tenants/
│   ├── payments/
│   └── maintenance/
```

**Action Required:**

- Reorganize code into feature folders
- Each feature should be self-contained
- Shared utilities go in `lib/shared/`

### 2. **Type Safety & Validation Audit**

#### A. DTOs (Data Transfer Objects)

- [ ] Are all API inputs validated with Zod schemas?
- [ ] Do we have clear DTOs for create, update, and response types?

**Expected Pattern:**

```typescript
// lib/features/bookings/dto/create-booking.dto.ts
import { z } from 'zod';

export const createBookingSchema = z
  .object({
    propertyId: z.string().cuid(),
    tenantId: z.string().cuid().optional(),
    checkInDate: z.string().datetime(),
    checkOutDate: z.string().datetime(),
    guestName: z.string().min(2).max(100),
    guestEmail: z.string().email(),
    guestPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    numberOfGuests: z.number().int().positive().max(20),
    totalAmount: z.number().positive(),
  })
  .refine((data) => new Date(data.checkOutDate) > new Date(data.checkInDate), {
    message: 'Check-out must be after check-in',
  });

export type CreateBookingDTO = z.infer<typeof createBookingSchema>;
```

**Action Required:**

- Create Zod schemas for all API inputs
- Add schema validation to all API routes
- Generate TypeScript types from Zod schemas

#### B. Type Coverage

- [ ] Are all functions properly typed?
- [ ] Are we avoiding `any` types?
- [ ] Do we have strict TypeScript enabled?

**Action Required:**

- Enable strict mode in `tsconfig.json`
- Add return types to all functions
- Replace all `any` with proper types

### 3. **Error Handling Audit**

#### A. Consistent Error Responses

- [ ] Do all API routes return consistent error formats?
- [ ] Are errors properly logged?
- [ ] Do we have custom error classes?

**Expected Pattern:**

```typescript
// lib/shared/errors/app-error.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, `${resource} with id ${id} not found`, 'NOT_FOUND');
  }
}

// lib/shared/middleware/error-handler.ts
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  // Log unexpected errors
  console.error('Unexpected error:', error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  );
}
```

**Action Required:**

- Create custom error classes
- Implement global error handler
- Add error boundaries to all page components
- Set up error logging (Sentry integration)

#### B. Input Validation

- [ ] Are all user inputs validated before processing?
- [ ] Do we sanitize inputs to prevent XSS/SQL injection?

**Action Required:**

- Add Zod validation to every API route
- Sanitize file uploads
- Validate file types and sizes

### 4. **Security Audit**

#### A. Authentication & Authorization

- [ ] Are all API routes protected?
- [ ] Is user ownership verified on every data access?
- [ ] Do we have role-based access control?

**Expected Pattern:**

```typescript
// lib/shared/middleware/auth.ts
export async function requireAuth(request: Request) {
  const session = await getServerSession();

  if (!session) {
    throw new UnauthorizedError('Authentication required');
  }

  return session;
}

export async function requireOwnership(userId: string, resourceUserId: string) {
  if (userId !== resourceUserId) {
    throw new ForbiddenError('Access denied');
  }
}

// Usage in API route
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await requireAuth(request);

  const property = await propertyRepository.findById(params.id);

  if (!property) {
    throw new NotFoundError('Property', params.id);
  }

  await requireOwnership(session.user.id, property.userId);

  return NextResponse.json(property);
}
```

**Action Required:**

- Add authentication check to all protected routes
- Verify user ownership on all CRUD operations
- Implement role-based middleware
- Add rate limiting to API routes

#### B. Data Security

- [ ] Are sensitive fields properly handled?
- [ ] Are passwords hashed?
- [ ] Are API keys/secrets properly stored?

**Action Required:**

- Audit environment variables
- Ensure passwords are hashed with bcrypt
- Add field-level encryption for sensitive data
- Implement audit logging

### 5. **Database Optimization Audit**

#### A. Indexes

- [ ] Are frequently queried fields indexed?
- [ ] Do we have compound indexes for multi-field queries?

**Expected Prisma Schema:**

```prisma
model Booking {
  id              String    @id @default(cuid())
  propertyId      String
  checkInDate     DateTime
  checkOutDate    DateTime
  status          BookingStatus

  // Performance indexes
  @@index([propertyId, status])
  @@index([propertyId, checkInDate, checkOutDate])
  @@index([status, checkInDate])
}
```

**Action Required:**

- Add indexes to: `propertyId`, `userId`, `status`, `checkInDate`, `createdAt`
- Create compound indexes for common queries
- Analyze slow queries and add appropriate indexes

#### B. Query Optimization

- [ ] Are we avoiding N+1 queries?
- [ ] Are we using `select` to fetch only needed fields?
- [ ] Are we using `include` judiciously?

**Expected Pattern:**

```typescript
// ❌ Bad - N+1 problem
const properties = await prisma.property.findMany();
for (const property of properties) {
  const bookings = await prisma.booking.findMany({
    where: { propertyId: property.id },
  });
  property.bookings = bookings; // N+1 queries!
}

// ✅ Good - Single query with include
const properties = await prisma.property.findMany({
  include: {
    bookings: {
      where: { status: 'CONFIRMED' },
    },
  },
});

// ✅ Better - Select only needed fields
const properties = await prisma.property.findMany({
  select: {
    id: true,
    name: true,
    city: true,
    bookings: {
      select: {
        id: true,
        checkInDate: true,
        checkOutDate: true,
      },
      where: { status: 'CONFIRMED' },
    },
  },
});
```

**Action Required:**

- Audit all Prisma queries for N+1 problems
- Use `include` only when necessary
- Use `select` to reduce payload size
- Add database query logging to identify slow queries

### 6. **Testing Setup Audit**

#### A. Test Structure

- [ ] Do we have a test setup?
- [ ] Are critical business logic functions tested?
- [ ] Do we have integration tests for API routes?

**Expected Structure:**

```
__tests__/
├── unit/
│   ├── services/
│   │   ├── booking.service.test.ts
│   │   ├── payment.service.test.ts
│   │   └── availability.service.test.ts
│   └── utils/
│       └── date.utils.test.ts
├── integration/
│   ├── api/
│   │   ├── bookings.test.ts
│   │   ├── properties.test.ts
│   │   └── payments.test.ts
│   └── repositories/
│       └── booking.repository.test.ts
└── e2e/
    ├── booking-flow.test.ts
    └── payment-flow.test.ts
```

**Action Required:**

- Set up Jest for unit/integration tests
- Set up Playwright for E2E tests
- Write tests for critical business logic:
  - Availability checking
  - Payment calculations
  - Booking validation
  - Double-booking prevention
- Add test coverage reporting
- Set up CI/CD to run tests on every commit

#### B. Critical Test Cases

```typescript
// Example: Critical test for double-booking prevention
describe('BookingService - Availability', () => {
  it('should prevent double-booking', async () => {
    // Arrange: Create existing booking Jan 1-10
    const existing = await bookingService.create({
      propertyId: 'prop-123',
      checkInDate: new Date('2025-01-01'),
      checkOutDate: new Date('2025-01-10'),
      // ... other fields
    });

    // Act: Attempt overlapping booking Jan 5-15
    const attemptBooking = async () => {
      await bookingService.create({
        propertyId: 'prop-123',
        checkInDate: new Date('2025-01-05'),
        checkOutDate: new Date('2025-01-15'),
        // ... other fields
      });
    };

    // Assert: Should throw AvailabilityError
    await expect(attemptBooking()).rejects.toThrow(AvailabilityError);
  });

  it('should allow back-to-back bookings', async () => {
    // Arrange: Booking Jan 1-10
    await bookingService.create({
      propertyId: 'prop-123',
      checkInDate: new Date('2025-01-01'),
      checkOutDate: new Date('2025-01-10'),
    });

    // Act: Book Jan 10-20 (check-out = next check-in)
    const booking = await bookingService.create({
      propertyId: 'prop-123',
      checkInDate: new Date('2025-01-10'),
      checkOutDate: new Date('2025-01-20'),
    });

    // Assert: Should succeed
    expect(booking).toBeDefined();
    expect(booking.status).toBe('CONFIRMED');
  });
});
```

**Action Required:**

- Write tests for all critical business logic
- Test edge cases (same-day bookings, timezone issues, leap years)
- Test error scenarios
- Test concurrent operations (race conditions)

### 7. **Code Quality Audit**

#### A. Linting & Formatting

- [ ] Is ESLint properly configured?
- [ ] Is Prettier set up?
- [ ] Do we have pre-commit hooks?

**Expected Setup:**

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}

// package.json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit"
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

**Action Required:**

- Configure ESLint with strict rules
- Set up Prettier
- Install Husky for git hooks
- Configure lint-staged
- Run linter on entire codebase and fix issues

#### B. Code Duplication

- [ ] Are there repeated code patterns?
- [ ] Can we extract shared utilities?

**Action Required:**

- Identify duplicate code blocks
- Extract into shared utilities
- Create custom hooks for repeated React patterns
- Document reusable patterns

### 8. **Documentation Audit**

#### A. Code Documentation

- [ ] Are complex functions documented?
- [ ] Do we have JSDoc comments for public APIs?

**Expected Pattern:**

````typescript
/**
 * Checks if a property is available for the given date range
 *
 * @param propertyId - The ID of the property to check
 * @param checkIn - Check-in date (ISO 8601 string)
 * @param checkOut - Check-out date (ISO 8601 string)
 * @returns Availability status and conflicting bookings if any
 * @throws {ValidationError} If dates are invalid
 * @throws {NotFoundError} If property doesn't exist
 *
 * @example
 * ```typescript
 * const result = await checkAvailability(
 *   'prop-123',
 *   '2025-01-01T00:00:00Z',
 *   '2025-01-10T00:00:00Z'
 * );
 *
 * if (!result.available) {
 *   console.log('Conflicts:', result.conflicts);
 * }
 * ```
 */
export async function checkAvailability(
  propertyId: string,
  checkIn: string,
  checkOut: string
): Promise<AvailabilityResult> {
  // Implementation
}
````

**Action Required:**

- Add JSDoc to all public functions
- Document complex algorithms
- Add inline comments for non-obvious logic

#### B. Technical Documentation

- [ ] Do we have architecture documentation?
- [ ] Is the API documented?
- [ ] Is there a deployment guide?

**Required Documents:**

```markdown
docs/
├── ARCHITECTURE.md # System overview, patterns used
├── API.md # All endpoints documented
├── DATABASE.md # Schema explanation, migrations
├── DEPLOYMENT.md # How to deploy
├── DEVELOPMENT.md # How to run locally
├── TESTING.md # How to run tests
└── TROUBLESHOOTING.md # Common issues
```

**Action Required:**

- Create all required documentation files
- Document all API endpoints with examples
- Create deployment runbook
- Document common errors and solutions

### 9. **Performance Audit**

#### A. Caching Strategy

- [ ] Are expensive operations cached?
- [ ] Do we have appropriate cache invalidation?

**Expected Pattern:**

```typescript
// lib/features/properties/services/property-cache.service.ts
import { redis } from '@/lib/redis';

export class PropertyCacheService {
  private readonly TTL = 3600; // 1 hour

  async getCachedProperty(id: string): Promise<Property | null> {
    const cached = await redis.get(`property:${id}`);
    return cached ? JSON.parse(cached) : null;
  }

  async cacheProperty(property: Property): Promise<void> {
    await redis.setex(`property:${id}`, this.TTL, JSON.stringify(property));
  }

  async invalidateProperty(id: string): Promise<void> {
    await redis.del(`property:${id}`);
  }
}
```

**Action Required:**

- Identify expensive operations (reports, analytics)
- Implement caching for read-heavy operations
- Add cache invalidation on updates
- Use Next.js ISR for semi-static pages

#### B. Pagination

- [ ] Are large lists paginated?
- [ ] Are we using cursor-based pagination for infinite scroll?

**Expected Pattern:**

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.booking.count(),
  ]);

  return NextResponse.json({
    data: bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
```

**Action Required:**

- Add pagination to all list endpoints
- Implement cursor-based pagination for large datasets
- Add pagination UI components

### 10. **Monitoring & Observability Audit**

#### A. Logging

- [ ] Are errors properly logged?
- [ ] Do we log important business events?
- [ ] Is sensitive data excluded from logs?

**Expected Pattern:**

```typescript
// lib/shared/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Usage
logger.info('Booking created', {
  bookingId: booking.id,
  propertyId: booking.propertyId,
  userId: session.user.id,
});

logger.error('Payment failed', {
  error: error.message,
  bookingId: booking.id,
  // Never log sensitive data like card numbers!
});
```

**Action Required:**

- Set up structured logging (Winston or Pino)
- Log all critical operations
- Sanitize logs (no passwords, tokens, PII)
- Set up error tracking (Sentry)

#### B. Metrics

- [ ] Do we track key business metrics?
- [ ] Are we monitoring API performance?

**Action Required:**

- Set up application monitoring (Vercel Analytics, New Relic, or Datadog)
- Track key metrics:
  - API response times
  - Database query times
  - Error rates
  - User sign-ups
  - Bookings created
  - Revenue processed
- Set up alerts for critical errors

## Deliverables

After completing this audit, provide:

### 1. **Audit Report**

A detailed markdown report covering:

- Current state assessment
- Issues found (categorized by severity: Critical, High, Medium, Low)
- Recommendations with prioritization
- Implementation effort estimates

### 2. **Refactoring Plan**

A step-by-step plan to implement improvements:

```markdown
## Phase 1: Critical Fixes (Week 1)

- [ ] Add authentication to all routes
- [ ] Implement error handling
- [ ] Fix security vulnerabilities

## Phase 2: Architecture (Week 2-3)

- [ ] Extract service layer
- [ ] Create repository pattern
- [ ] Reorganize folder structure

## Phase 3: Quality (Week 4-5)

- [ ] Add comprehensive tests
- [ ] Set up CI/CD
- [ ] Add documentation

## Phase 4: Performance (Week 6)

- [ ] Add caching
- [ ] Optimize queries
- [ ] Add pagination
```

### 3. **Implementation Examples**

Provide code examples for:

- Service layer implementation
- Repository pattern
- Error handling
- Validation with Zod
- Testing setup
- Authentication middleware

### 4. **Updated Folder Structure**

Show the recommended folder structure with explanations

### 5. **Quick Wins**

List 5-10 improvements that can be done in < 1 hour each for immediate impact

## Success Criteria

The system should achieve:

- ✅ **Maintainability Score**: 9/10+
- ✅ **Type Safety**: 100% (no `any` types, strict mode enabled)
- ✅ **Test Coverage**: 80%+ for critical paths
- ✅ **Security**: All routes protected, inputs validated
- ✅ **Performance**: < 500ms API response time, properly indexed DB
- ✅ **Documentation**: All major components documented
- ✅ **Code Quality**: ESLint passing, no code duplication

## Important Notes

- Be specific and actionable in recommendations
- Provide code examples for every pattern
- Prioritize security and data integrity issues
- Consider the team's skill level (solo developer initially)
- Focus on pragmatic solutions, not over-engineering
- Consider the 80/20 rule - focus on high-impact improvements

Start by analyzing the current codebase structure and identifying the most critical issues first.
