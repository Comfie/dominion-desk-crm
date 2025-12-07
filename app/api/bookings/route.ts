import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { logAudit } from '@/lib/shared/audit';
import { notifyNewBooking } from '@/lib/notifications';
import {
  bookingService,
  createBookingSchema,
  listBookingsSchema,
  type CreateBookingDTO,
  type ListBookingsDTO,
} from '@/lib/features/bookings';
import { messageSchedulerService } from '@/lib/features/messaging';
import { AutomationTrigger } from '@prisma/client';

/**
 * GET /api/bookings
 * List all bookings for the authenticated user
 */
export async function GET(request: Request) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Parse and validate query parameters
    const filters: ListBookingsDTO = listBookingsSchema.parse({
      propertyId: searchParams.get('propertyId') || undefined,
      status: searchParams.get('status') || undefined,
      source: searchParams.get('source') || undefined,
      startDate: searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      search: searchParams.get('search') || undefined,
    });

    // Use service layer with organization context
    const bookings = await bookingService.list(session.user.organizationId, filters);

    // Transform for frontend compatibility
    const transformedBookings = bookings.map((booking) => ({
      ...booking,
      source: booking.bookingSource,
      notes: booking.internalNotes,
      specialRequests: booking.guestNotes,
    }));

    // Apply pagination to the results
    const total = transformedBookings.length;
    const startIndex = (page - 1) * limit;
    const paginatedBookings = transformedBookings.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      data: paginatedBookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/bookings
 * Create a new booking
 */
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    // Transform frontend field names to match DTO
    const transformedBody = {
      ...body,
      bookingSource: body.source || body.bookingSource,
      specialRequests: body.specialRequests || body.guestNotes,
    };

    // Validate input
    const validatedData: CreateBookingDTO = createBookingSchema.parse(transformedBody);

    // Create booking using service layer
    // Service handles: availability check, pricing, validation, transaction
    const booking = await bookingService.create(session.user.organizationId, {
      propertyId: validatedData.propertyId,
      tenantId: validatedData.tenantId,
      guestName: validatedData.guestName,
      guestEmail: validatedData.guestEmail,
      guestPhone: validatedData.guestPhone,
      checkInDate: validatedData.checkInDate,
      checkOutDate: validatedData.checkOutDate,
      numberOfGuests: validatedData.numberOfGuests,
      totalAmount: validatedData.totalAmount,
      bookingSource: validatedData.bookingSource,
      bookingReference: validatedData.bookingReference,
      specialRequests: validatedData.specialRequests,
    });

    // Log audit trail
    await logAudit(session, 'created', 'booking', booking.id, undefined, request);

    // Transform for frontend compatibility
    const transformedBooking = {
      ...booking,
      source: booking.bookingSource,
      notes: booking.internalNotes,
      specialRequests: booking.guestNotes,
    };

    // Create notification for new booking
    try {
      if (booking.property) {
        await notifyNewBooking(
          session.user.organizationId,
          validatedData.guestName,
          booking.property.name,
          booking.id
        );
      }
    } catch (notifyError) {
      // Don't fail the booking creation if notification fails
      // Error is already logged by notification service
    }

    // Schedule automation messages for this booking
    try {
      await messageSchedulerService.scheduleForBooking(
        booking.id,
        session.user.organizationId,
        AutomationTrigger.BOOKING_CREATED
      );
    } catch (automationError) {
      // Don't fail the booking creation if automation scheduling fails
      console.error('Failed to schedule automation messages:', automationError);
    }

    return NextResponse.json(transformedBooking, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
