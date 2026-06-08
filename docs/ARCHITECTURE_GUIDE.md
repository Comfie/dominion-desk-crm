# Architecture Guide - Service Layer & Repository Pattern

**Date:** November 28, 2025
**Status:** ✅ Phase 2 Complete (Bookings Feature)
**Impact:** High - Foundation for scalable, maintainable codebase

---

## Overview

This guide documents the new architecture pattern implemented in Phase 2 of the refactoring roadmap. The architecture follows a **three-layer pattern**:

1. **API Layer** - HTTP request/response handling
2. **Service Layer** - Business logic and orchestration
3. **Repository Layer** - Data access abstraction

---

## Architecture Layers

### Layer 1: API Routes (Presentation Layer)

**Location:** `app/api/**/*.ts`

**Responsibilities:**

- HTTP request/response handling
- Request validation (DTO parsing)
- Session authentication
- Error handling (via global handler)
- Audit logging
- Response transformation

**Should NOT:**

- Contain business logic
- Access database directly
- Handle complex validation
- Contain calculation logic

**Example:**

```typescript
// app/api/bookings/route.ts
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { logAudit } from '@/lib/shared/audit';
import { bookingService, createBookingSchema } from '@/lib/features/bookings';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    // 1. Validate input
    const validatedData = createBookingSchema.parse(body);

    // 2. Call service layer (business logic)
    const booking = await bookingService.create(session.user.organizationId, validatedData);

    // 3. Log audit trail
    await logAudit(session, 'created', 'booking', booking.id, undefined, request);

    // 4. Return response
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

**Key Points:**

- ✅ Thin layer - minimal logic
- ✅ Uses service layer for business logic
- ✅ Global error handler for consistency
- ✅ Audit logging for all mutations

---

### Layer 2: Service Layer (Business Logic)

**Location:** `lib/features/[feature]/services/*.service.ts`

**Responsibilities:**

- Business logic and rules
- Orchestration of multiple operations
- Cross-entity validation
- Transaction coordination
- Notification triggers
- Complex calculations

**Should NOT:**

- Handle HTTP concerns
- Build SQL/Prisma queries directly
- Know about request/response format

**Example:**

```typescript
// lib/features/bookings/services/booking.service.ts
export class BookingService {
  async create(userId: string, data: CreateBookingData) {
    // 1. Business rule: Check availability
    const availability = await this.checkAvailability(
      data.propertyId,
      data.checkInDate,
      data.checkOutDate
    );

    if (!availability.available) {
      throw new AvailabilityError('Property not available', {
        conflictingBookings: availability.conflictingBookings,
      });
    }

    // 2. Business logic: Calculate pricing
    let totalAmount = data.totalAmount;
    if (!totalAmount) {
      const pricing = await this.calculatePricing(
        data.propertyId,
        data.checkInDate,
        data.checkOutDate
      );
      totalAmount = pricing.totalAmount;
    }

    // 3. Validation: Check guest count
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: { maxGuests: true },
    });

    if (property && data.numberOfGuests > property.maxGuests) {
      throw new ValidationError('Too many guests', {
        numberOfGuests: data.numberOfGuests,
        maxGuests: property.maxGuests,
      });
    }

    // 4. Repository call: Create booking
    const booking = await bookingRepository.create({
      user: { connect: { id: userId } },
      property: { connect: { id: data.propertyId } },
      // ... other fields
      totalAmount,
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
    });

    // 5. Side effects: Notifications (optional - don't fail if error)
    // TODO: Send confirmation email
    // TODO: Update calendar sync

    return booking;
  }

  async checkAvailability(propertyId: string, checkIn: Date, checkOut: Date) {
    // Business logic for availability checking
    const overlapping = await bookingRepository.findOverlapping(propertyId, checkIn, checkOut);

    return {
      available: overlapping.length === 0,
      conflictingBookings: overlapping,
    };
  }

  async calculatePricing(propertyId: string, checkIn: Date, checkOut: Date) {
    // Business logic for pricing calculation
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { rentalPrice: true, cleaningFee: true },
    });

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const baseAmount = Number(property.rentalPrice) * nights;
    const cleaningFee = Number(property.cleaningFee || 0);
    const serviceFee = baseAmount * 0.05; // 5% service fee

    return {
      nights,
      baseAmount,
      cleaningFee,
      serviceFee,
      totalAmount: baseAmount + cleaningFee + serviceFee,
    };
  }
}

export const bookingService = new BookingService();
```

**Key Points:**

- ✅ Contains all business logic
- ✅ Orchestrates multiple operations
- ✅ Uses custom error classes
- ✅ Singleton instance exported
- ✅ Validates business rules
- ✅ Calculates derived values

---

### Layer 3: Repository Layer (Data Access)

**Location:** `lib/features/[feature]/repositories/*.repository.ts`

**Responsibilities:**

- Database queries (Prisma)
- Data access abstraction
- Query optimization
- Transaction management
- Include/select optimization

**Should NOT:**

- Contain business logic
- Validate business rules
- Handle HTTP concerns
- Trigger notifications

**Example:**

```typescript
// lib/features/bookings/repositories/booking.repository.ts
export class BookingRepository {
  /**
   * Find overlapping bookings for availability checking
   */
  async findOverlapping(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string
  ): Promise<Booking[]> {
    return prisma.booking.findMany({
      where: {
        propertyId,
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            // New booking starts during existing booking
            AND: [{ checkInDate: { lte: checkOut } }, { checkOutDate: { gt: checkIn } }],
          },
          {
            // New booking ends during existing booking
            AND: [{ checkInDate: { lt: checkOut } }, { checkOutDate: { gte: checkOut } }],
          },
          {
            // New booking completely contains existing booking
            AND: [{ checkInDate: { gte: checkIn } }, { checkOutDate: { lte: checkOut } }],
          },
        ],
      },
    });
  }

  /**
   * Create booking with transaction support
   */
  async create(data: Prisma.BookingCreateInput) {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
            },
          },
        },
      });

      // Update property's last booking date
      await tx.property.update({
        where: { id: data.property.connect?.id },
        data: { updatedAt: new Date() },
      });

      return booking;
    });
  }

  /**
   * Find bookings by user with filters
   */
  async findByUserId(
    userId: string,
    filters?: {
      propertyId?: string;
      status?: BookingStatus;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    }
  ) {
    const where: Prisma.BookingWhereInput = { userId };

    if (filters?.propertyId) where.propertyId = filters.propertyId;
    if (filters?.status) where.status = filters.status;

    if (filters?.search) {
      where.OR = [
        { guestName: { contains: filters.search, mode: 'insensitive' } },
        { guestEmail: { contains: filters.search, mode: 'insensitive' } },
        { guestPhone: { contains: filters.search, mode: 'insensitive' } },
        { bookingReference: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.booking.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            primaryImageUrl: true,
          },
        },
      },
      orderBy: { checkInDate: 'desc' },
    });
  }
}

export const bookingRepository = new BookingRepository();
```

**Key Points:**

- ✅ Pure data access - no business logic
- ✅ Optimized includes/selects
- ✅ Transaction support where needed
- ✅ Singleton instance exported
- ✅ Well-documented query intent

---

## DTOs and Validation

**Location:** `lib/features/[feature]/dtos/*.dto.ts`

**Purpose:** Define and validate input/output data structures

**Example:**

```typescript
// lib/features/bookings/dtos/booking.dto.ts
import { z } from 'zod';

export const createBookingSchema = z
  .object({
    propertyId: z.string().uuid('Property ID must be a valid UUID'),
    guestName: z.string().min(2).max(100),
    guestEmail: z.string().email('Invalid email address'),
    guestPhone: z.string().min(10).max(20).optional(),
    checkInDate: z.coerce.date(),
    checkOutDate: z.coerce.date(),
    numberOfGuests: z.number().int().min(1).max(50),
    totalAmount: z.number().positive().optional(),
    bookingSource: z.string().max(50).optional(),
    specialRequests: z.string().max(1000).optional(),
  })
  .refine((data) => data.checkOutDate > data.checkInDate, {
    message: 'Check-out date must be after check-in date',
    path: ['checkOutDate'],
  });

export type CreateBookingDTO = z.infer<typeof createBookingSchema>;
```

**Key Points:**

- ✅ Zod schemas for runtime validation
- ✅ TypeScript types inferred from schemas
- ✅ Custom refinements for complex validation
- ✅ Clear error messages

---

## Feature Module Structure

```
lib/features/[feature]/
├── repositories/
│   └── [feature].repository.ts   # Data access layer
├── services/
│   └── [feature].service.ts      # Business logic layer
├── dtos/
│   └── [feature].dto.ts          # Input/output validation
└── index.ts                       # Public exports
```

**Example Feature Module (Bookings):**

```
lib/features/bookings/
├── repositories/
│   └── booking.repository.ts     # 350+ lines
├── services/
│   └── booking.service.ts        # 400+ lines
├── dtos/
│   └── booking.dto.ts            # 100+ lines
└── index.ts                       # Exports all public APIs
```

**Feature Module Exports:**

```typescript
// lib/features/bookings/index.ts
export { bookingRepository, BookingRepository } from './repositories/booking.repository';
export { bookingService, BookingService } from './services/booking.service';
export {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
  checkAvailabilitySchema,
  listBookingsSchema,
  type CreateBookingDTO,
  type UpdateBookingDTO,
  type CancelBookingDTO,
  type CheckAvailabilityDTO,
  type ListBookingsDTO,
} from './dtos/booking.dto';
```

---

## Error Handling

### Custom Error Classes

**Location:** `lib/shared/errors/app-error.ts`

**Available Error Classes:**

- `ValidationError` - Input validation failures
- `NotFoundError` - Resource not found
- `UnauthorizedError` - Authentication required
- `ForbiddenError` - Insufficient permissions
- `AvailabilityError` - Resource not available (e.g., booking conflicts)
- `PaymentError` - Payment processing failures
- `RateLimitError` - Rate limit exceeded
- `SubscriptionLimitError` - Subscription limit reached
- `ExternalServiceError` - Third-party service failures

**Usage in Services:**

```typescript
// Business validation
if (!availability.available) {
  throw new AvailabilityError('Property not available for selected dates', {
    propertyId: data.propertyId,
    checkInDate: data.checkInDate,
    checkOutDate: data.checkOutDate,
    conflictingBookings: availability.conflictingBookings,
  });
}

// Resource not found
const booking = await bookingRepository.findById(bookingId);
if (!booking) {
  throw new NotFoundError('Booking', bookingId);
}

// Permission check
if (booking.userId !== userId) {
  throw new ForbiddenError('You do not have permission to update this booking');
}
```

### Global Error Handler

**Location:** `lib/shared/errors/error-handler.ts`

**Usage in API Routes:**

```typescript
export async function POST(request: Request) {
  try {
    // ... route logic
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

**What it handles:**

- Custom AppError classes → Proper HTTP status codes
- Zod validation errors → 400 with field errors
- Prisma errors → Formatted responses
- Unexpected errors → 500 with safe message

---

## Audit Logging

**Location:** `lib/shared/audit.ts`

**When to Log:**

- All create operations
- All update operations
- All delete operations
- Sensitive reads (optional)
- Status changes

**Usage:**

```typescript
// After successful mutation
await logAudit(
  session,
  'created', // action
  'booking', // entity type
  booking.id, // entity ID
  undefined, // changes (for updates)
  request // for IP and user agent
);

// Update with before/after
await logAudit(
  session,
  'updated',
  'booking',
  bookingId,
  {
    before: { status: 'PENDING' },
    after: { status: 'CONFIRMED' },
  },
  request
);
```

**Captures:**

- Who (userId from session)
- What (action + entity + entityId)
- When (timestamp)
- Where (IP address)
- How (user agent)
- Changes (before/after for updates)

---

## Multi-Tenancy Integration

**Session Context:**

```typescript
const session = await requireAuth();

// Always use organizationId for queries
const bookings = await bookingService.list(
  session.user.organizationId, // NOT session.user.id
  filters
);
```

**Ownership Verification:**

```typescript
// In service layer
if (booking.userId !== userId) {
  throw new ForbiddenError('You do not have permission to access this resource');
}
```

**Team Member Access:**

```typescript
// Use enhanced auth helpers for team member support
import { requireResourceAccess, requirePermission } from '@/lib/auth-helpers-enhanced';

// Check general access (owner OR team member)
const session = await requireResourceAccess(property.userId);

// Check specific permission
const session = await requirePermission(property.userId, 'canManageBookings');
```

---

## Migration Strategy

### Step-by-Step Migration Process

1. **Choose a Feature** (Start with most critical)
   - Bookings ✅
   - Properties ⏭️
   - Payments ⏭️
   - Tenants
   - Expenses

2. **Create Repository**
   - Extract all database queries
   - Create methods for each query pattern
   - Add transaction support where needed
   - Export singleton instance

3. **Create Service**
   - Move business logic from API routes
   - Implement validation rules
   - Add calculations and derived values
   - Orchestrate repository calls
   - Export singleton instance

4. **Create DTOs**
   - Define input schemas with Zod
   - Add custom refinements
   - Infer TypeScript types

5. **Refactor API Routes**
   - Import service, DTOs, error handler
   - Validate input with DTOs
   - Call service layer
   - Add audit logging
   - Use global error handler

6. **Test**
   - Run type-check: `npm run type-check`
   - Test API endpoints manually
   - Verify error handling
   - Check audit logs

---

## Benefits

### Before (Old Pattern)

```typescript
// ❌ API route with business logic
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Manual validation
  if (!body.propertyId) {
    return NextResponse.json({ error: 'Property required' }, { status: 400 });
  }

  // Direct database access
  const property = await prisma.property.findFirst({
    where: { id: body.propertyId, userId: session.user.id },
  });

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  // Business logic in route
  const overlapping = await prisma.booking.findFirst({
    where: {
      propertyId: body.propertyId,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      OR: [
        /* complex overlap logic */
      ],
    },
  });

  if (overlapping) {
    return NextResponse.json({ error: 'Property not available' }, { status: 400 });
  }

  // More business logic...
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  const baseAmount = property.rentalPrice * nights;
  const totalAmount = baseAmount + (property.cleaningFee || 0);

  // Direct database access
  const booking = await prisma.booking.create({
    data: {
      /* ... */
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
```

**Problems:**

- ❌ Business logic mixed with HTTP handling
- ❌ No reusability (duplicate logic across routes)
- ❌ Hard to test (requires HTTP mocking)
- ❌ Inconsistent error handling
- ❌ No audit logging
- ❌ Tight coupling to Prisma

### After (New Pattern)

```typescript
// ✅ Thin API route
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const validatedData = createBookingSchema.parse(await request.json());

    const booking = await bookingService.create(session.user.organizationId, validatedData);

    await logAudit(session, 'created', 'booking', booking.id, undefined, request);

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

**Benefits:**

- ✅ Clean separation of concerns
- ✅ Reusable business logic
- ✅ Easy to test (pure functions)
- ✅ Consistent error handling
- ✅ Audit logging built-in
- ✅ Database abstraction

---

## Testing Strategy

### Unit Tests (Service Layer)

```typescript
// __tests__/services/booking.service.test.ts
describe('BookingService', () => {
  describe('checkAvailability', () => {
    it('should return available when no overlapping bookings', async () => {
      const result = await bookingService.checkAvailability(
        'property-123',
        new Date('2025-01-01'),
        new Date('2025-01-05')
      );

      expect(result.available).toBe(true);
    });

    it('should return unavailable when overlapping bookings exist', async () => {
      // Create conflicting booking first
      await bookingRepository.create({
        /* ... */
      });

      const result = await bookingService.checkAvailability(
        'property-123',
        new Date('2025-01-01'),
        new Date('2025-01-05')
      );

      expect(result.available).toBe(false);
      expect(result.conflictingBookings).toHaveLength(1);
    });
  });

  describe('calculatePricing', () => {
    it('should calculate correct pricing', async () => {
      const result = await bookingService.calculatePricing(
        'property-123',
        new Date('2025-01-01'),
        new Date('2025-01-05')
      );

      expect(result.nights).toBe(4);
      expect(result.baseAmount).toBe(400); // $100/night * 4 nights
      expect(result.serviceFee).toBe(20); // 5% of $400
      expect(result.totalAmount).toBe(470); // $400 + $50 cleaning + $20 service
    });
  });
});
```

### Integration Tests (API Routes)

```typescript
// __tests__/api/bookings.test.ts
describe('POST /api/bookings', () => {
  it('should create booking successfully', async () => {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: 'property-123',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        checkInDate: '2025-01-01',
        checkOutDate: '2025-01-05',
        numberOfGuests: 2,
      }),
    });

    expect(response.status).toBe(201);
    const booking = await response.json();
    expect(booking.id).toBeDefined();
  });

  it('should return 400 for invalid data', async () => {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ propertyId: 'invalid' }),
    });

    expect(response.status).toBe(400);
  });
});
```

---

## Performance Considerations

### Database Queries

**Repository Optimization:**

- ✅ Selective includes (only needed relations)
- ✅ Selective selects (only needed fields)
- ✅ Proper indexing (see performance indexes migration)
- ✅ Transaction support for multi-step operations

**Example:**

```typescript
// ✅ Good - Selective includes
include: {
  property: {
    select: {
      id: true,
      name: true,
      address: true,
      city: true
    }
  }
}

// ❌ Bad - Over-fetching
include: {
  property: true  // Fetches all fields
}
```

### Caching Strategy (Future)

```typescript
// TODO: Add caching layer
import { cache } from '@/lib/cache';

async findById(id: string) {
  const cacheKey = `booking:${id}`;

  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const booking = await prisma.booking.findUnique({...});
  await cache.set(cacheKey, booking, 60); // 60 seconds TTL

  return booking;
}
```

---

## Next Steps

### Immediate

1. ✅ Complete Bookings feature migration
2. ⏭️ Migrate Properties feature
3. ⏭️ Migrate Payments feature
4. ⏭️ Migrate Tenants feature
5. ⏭️ Migrate Expenses feature

### Phase 3 (Testing)

- Unit tests for all services
- Integration tests for all API routes
- 80% coverage target

### Phase 4 (Performance)

- Add caching layer (Redis)
- Implement pagination
- Load testing
- Query optimization

---

## Summary

### Architecture Benefits

| Aspect                     | Before             | After                   |
| -------------------------- | ------------------ | ----------------------- |
| **Separation of Concerns** | ❌ Mixed           | ✅ Clear layers         |
| **Reusability**            | ❌ Duplicate logic | ✅ Shared services      |
| **Testability**            | ❌ Hard to test    | ✅ Easy unit tests      |
| **Maintainability**        | ❌ Complex routes  | ✅ Simple, focused code |
| **Error Handling**         | ❌ Inconsistent    | ✅ Global handler       |
| **Audit Logging**          | ❌ Ad-hoc          | ✅ Systematic           |
| **Type Safety**            | ⚠️ Partial         | ✅ Full coverage        |

### Files Created (Bookings Feature)

1. `lib/features/bookings/repositories/booking.repository.ts` - 350 lines
2. `lib/features/bookings/services/booking.service.ts` - 400 lines
3. `lib/features/bookings/dtos/booking.dto.ts` - 100 lines
4. `lib/features/bookings/index.ts` - 25 lines

### Files Refactored

1. `app/api/bookings/route.ts` - 246 → 124 lines (50% reduction)
2. `app/api/bookings/[id]/route.ts` - 248 → 145 lines (42% reduction)

### Impact

- **Code Quality:** Improved separation of concerns
- **Maintainability:** Easier to understand and modify
- **Testability:** Can test business logic independently
- **Reusability:** Services can be used across different interfaces
- **Consistency:** Standardized error handling and audit logging
- **Type Safety:** Full TypeScript coverage with DTOs

---

**Documentation Version:** 1.0
**Last Updated:** November 28, 2025
**Status:** Living Document - Update as architecture evolves
