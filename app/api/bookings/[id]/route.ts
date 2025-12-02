import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleApiError } from '@/lib/shared/errors/error-handler';
import { logAudit } from '@/lib/shared/audit';
import {
  bookingService,
  updateBookingSchema,
  bookingIdSchema,
  type UpdateBookingDTO,
} from '@/lib/features/bookings';
import { messageSchedulerService } from '@/lib/features/messaging';
import { AutomationTrigger } from '@prisma/client';

/**
 * GET /api/bookings/[id]
 * Get a booking by ID
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Validate booking ID
    bookingIdSchema.parse({ id });

    // Get booking using service layer
    // Service handles ownership verification
    const booking = await bookingService.getById(id, session.user.organizationId);

    // Transform for frontend compatibility
    const transformedBooking = {
      ...booking,
      source: booking.bookingSource,
      notes: booking.internalNotes,
      specialRequests: booking.guestNotes,
    };

    return NextResponse.json(transformedBooking);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/bookings/[id]
 * Update a booking
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    // Validate booking ID
    bookingIdSchema.parse({ id });

    // Transform frontend field names to match DTO
    const transformedBody = {
      ...body,
      bookingSource: body.source || body.bookingSource,
      specialRequests: body.specialRequests || body.guestNotes,
    };

    // Validate update data
    const validatedData: UpdateBookingDTO = updateBookingSchema.parse(transformedBody);

    // Get old booking for audit trail
    const oldBooking = await bookingService.getById(id, session.user.organizationId);

    // Update booking using service layer
    // Service handles: ownership verification, availability check, validation
    const booking = await bookingService.update(id, session.user.organizationId, validatedData);

    // Log audit trail with before/after
    await logAudit(
      session,
      'updated',
      'booking',
      id,
      {
        before: {
          status: oldBooking.status,
          checkInDate: oldBooking.checkInDate,
          checkOutDate: oldBooking.checkOutDate,
        },
        after: {
          status: booking.status,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
        },
      },
      request
    );

    // Trigger automation if status changed to CONFIRMED
    if (oldBooking.status !== 'CONFIRMED' && booking.status === 'CONFIRMED') {
      try {
        await messageSchedulerService.scheduleForBooking(
          booking.id,
          session.user.organizationId,
          AutomationTrigger.BOOKING_CONFIRMED
        );
      } catch (automationError) {
        // Don't fail the update if automation scheduling fails
        console.error('Failed to schedule BOOKING_CONFIRMED automation:', automationError);
      }
    }

    // Transform for frontend compatibility
    const transformedBooking = {
      ...booking,
      source: booking.bookingSource,
      notes: booking.internalNotes,
      specialRequests: booking.guestNotes,
    };

    return NextResponse.json(transformedBooking);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/bookings/[id]
 * Delete a booking (soft delete by cancelling)
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Validate booking ID
    bookingIdSchema.parse({ id });

    // Cancel booking using service layer (soft delete)
    // Service handles ownership verification
    await bookingService.cancel(id, session.user.organizationId, 'Deleted via API');

    // Log audit trail
    await logAudit(session, 'deleted', 'booking', id, undefined, request);

    return NextResponse.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
