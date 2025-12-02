import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { paymentRepository } from '@/lib/features/payments/repositories/payment.repository';
import { bookingRepository } from '@/lib/features/bookings/repositories/booking.repository';
import { invoiceService } from './invoice.service';
import { logger } from '@/lib/shared/logger';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  PaymentError,
} from '@/lib/shared/errors/app-error';

/**
 * Payment Service
 * Business logic layer for payments
 */
export class PaymentService {
  /**
   * Create a new payment
   */
  async create(
    userId: string,
    data: {
      bookingId: string;
      amount: number;
      paymentMethod: PaymentMethod;
      paymentDate?: Date;
      reference?: string;
      notes?: string;
    }
  ) {
    // Verify booking exists and belongs to user
    const booking = await bookingRepository.findById(data.bookingId);

    if (!booking) {
      throw new NotFoundError('Booking', data.bookingId);
    }

    if (booking.userId !== userId) {
      throw new ForbiddenError('You do not have permission to create payments for this booking');
    }

    // Validation: Payment amount must not exceed amount due
    const totalPaid = await paymentRepository.getTotalPaidForBooking(data.bookingId);
    const amountDue = Number(booking.totalAmount) - totalPaid;

    if (data.amount > amountDue) {
      throw new ValidationError('Payment amount exceeds amount due', {
        amount: data.amount,
        amountDue,
        totalPaid,
      });
    }

    // Create payment
    const payment = await paymentRepository.create({
      user: { connect: { id: userId } },
      booking: { connect: { id: data.bookingId } },
      paymentReference: data.reference || `PAY-${Date.now()}`,
      paymentType: 'BOOKING',
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate || new Date(),
      status: 'PAID',
      bankReference: data.reference,
      notes: data.notes,
    });

    // Update booking payment status
    await bookingRepository.updatePaymentStatus(data.bookingId);

    logger.info('Payment created', {
      paymentId: payment.id,
      bookingId: data.bookingId,
      amount: data.amount,
      userId,
    });

    return payment;
  }

  /**
   * Update a payment
   */
  async update(
    paymentId: string,
    userId: string,
    data: {
      amount?: number;
      paymentMethod?: PaymentMethod;
      paymentDate?: Date;
      status?: PaymentStatus;
      reference?: string;
      notes?: string;
    }
  ) {
    const payment = await paymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundError('Payment', paymentId);
    }

    if (payment.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this payment');
    }

    // If updating amount, validate against booking
    if (payment.bookingId && data.amount !== undefined && data.amount !== Number(payment.amount)) {
      const booking = await bookingRepository.findById(payment.bookingId);
      if (!booking) {
        throw new NotFoundError('Booking', payment.bookingId);
      }

      const totalPaid = await paymentRepository.getTotalPaidForBooking(payment.bookingId);
      const currentPaymentAmount = Number(payment.amount);
      const otherPaymentsTotal = totalPaid - currentPaymentAmount;
      const amountDue = Number(booking.totalAmount) - otherPaymentsTotal;

      if (data.amount > amountDue) {
        throw new ValidationError('Updated payment amount exceeds amount due', {
          newAmount: data.amount,
          amountDue,
          currentAmount: currentPaymentAmount,
        });
      }
    }

    const updated = await paymentRepository.update(paymentId, data);

    // Update booking payment status if amount or status changed
    if (payment.bookingId && (data.amount !== undefined || data.status !== undefined)) {
      await bookingRepository.updatePaymentStatus(payment.bookingId);
    }

    logger.info('Payment updated', {
      paymentId,
      userId,
      changes: Object.keys(data),
    });

    return updated;
  }

  /**
   * Delete a payment
   */
  async delete(paymentId: string, userId: string) {
    const payment = await paymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundError('Payment', paymentId);
    }

    if (payment.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this payment');
    }

    await paymentRepository.delete(paymentId);

    // Update booking payment status
    if (payment.bookingId) {
      await bookingRepository.updatePaymentStatus(payment.bookingId);
    }

    logger.info('Payment deleted', {
      paymentId,
      bookingId: payment.bookingId,
      userId,
    });

    return { success: true };
  }

  /**
   * Get payment by ID with ownership verification
   */
  async getById(paymentId: string, userId: string) {
    const payment = await paymentRepository.findById(paymentId, userId);

    if (!payment) {
      throw new NotFoundError('Payment', paymentId);
    }

    if (payment.userId !== userId) {
      throw new ForbiddenError('You do not have permission to view this payment');
    }

    return payment;
  }

  /**
   * List payments with filters
   */
  async list(
    userId: string,
    filters?: {
      bookingId?: string;
      status?: PaymentStatus;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    return paymentRepository.findByUserId(userId, filters);
  }

  /**
   * Get payments for a specific booking
   */
  async getByBookingId(bookingId: string, userId: string) {
    // Verify booking belongs to user
    const booking = await bookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking', bookingId);
    }

    if (booking.userId !== userId) {
      throw new ForbiddenError('You do not have permission to view payments for this booking');
    }

    return paymentRepository.findByBookingId(bookingId);
  }

  /**
   * Get payment statistics
   */
  async getStatistics(userId: string) {
    return paymentRepository.getStatistics(userId);
  }

  /**
   * Get recent payments
   */
  async getRecent(userId: string, limit = 10) {
    return paymentRepository.getRecent(userId, limit);
  }

  /**
   * Mark payment as failed
   */
  async markAsFailed(paymentId: string, userId: string, reason?: string) {
    const payment = await this.getById(paymentId, userId);

    const updated = await paymentRepository.update(paymentId, {
      status: 'FAILED',
      notes: reason
        ? `${payment.notes || ''}\n\nFailure reason: ${reason}`
        : payment.notes || undefined,
    });

    // Update booking payment status
    if (payment.bookingId) {
      await bookingRepository.updatePaymentStatus(payment.bookingId);
    }

    logger.warn('Payment marked as failed', {
      paymentId,
      bookingId: payment.bookingId,
      userId,
      reason,
    });

    return updated;
  }

  /**
   * Refund a payment
   */
  async refund(paymentId: string, userId: string, reason?: string) {
    const payment = await this.getById(paymentId, userId);

    if (payment.status !== 'PAID') {
      throw new PaymentError('Only paid payments can be refunded', {
        paymentId,
        currentStatus: payment.status,
      });
    }

    const updated = await paymentRepository.update(paymentId, {
      status: 'REFUNDED',
      notes: reason
        ? `${payment.notes || ''}\n\nRefund reason: ${reason}`
        : payment.notes || undefined,
    });

    // Update booking payment status
    if (payment.bookingId) {
      await bookingRepository.updatePaymentStatus(payment.bookingId);
    }

    logger.info('Payment refunded', {
      paymentId,
      bookingId: payment.bookingId,
      amount: payment.amount,
      userId,
      reason,
    });

    return updated;
  }

  /**
   * Generate monthly rent payments for all active tenants
   */
  async generateMonthlyPayments(userId: string, month?: number, year?: number) {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    logger.info('Generating monthly payments', {
      userId,
      month: targetMonth,
      year: targetYear,
    });

    const result = await paymentRepository.generateMonthlyPayments(userId, targetMonth, targetYear);

    logger.info('Monthly payments generated', {
      userId,
      count: result.count,
      month: targetMonth,
      year: targetYear,
    });

    return result;
  }

  /**
   * Get invoice HTML for a payment
   */
  async getInvoiceHTML(paymentId: string, userId: string) {
    const payment = await this.getById(paymentId, userId);
    return invoiceService.generateInvoiceHTML(payment);
  }

  /**
   * Get invoice text for a payment
   */
  async getInvoiceText(paymentId: string, userId: string) {
    const payment = await this.getById(paymentId, userId);
    return invoiceService.generateInvoiceText(payment);
  }

  /**
   * Get payment summary for a given period
   */
  async getPaymentSummary(userId: string, month?: number, year?: number) {
    return paymentRepository.getPaymentSummary(userId, month, year);
  }

  /**
   * Find payments due for reminders
   */
  async findDuePayments(userId: string, dueDate: Date) {
    return paymentRepository.findDuePayments(userId, dueDate);
  }

  /**
   * Find overdue payments
   */
  async findOverduePayments(userId: string) {
    return paymentRepository.findOverduePayments(userId);
  }

  /**
   * Mark payment reminder as sent
   */
  async markReminderSent(paymentId: string) {
    await paymentRepository.markReminderSent(paymentId);
    logger.info('Payment reminder marked as sent', { paymentId });
  }

  /**
   * Mark payment as overdue
   */
  async markAsOverdue(paymentId: string) {
    await paymentRepository.markAsOverdue(paymentId);
    logger.info('Payment marked as overdue', { paymentId });
  }

  /**
   * Update invoice URL for a payment
   */
  async updateInvoiceUrl(paymentId: string, invoiceUrl: string) {
    await paymentRepository.updateInvoiceUrl(paymentId, invoiceUrl);
    logger.info('Payment invoice URL updated', { paymentId, invoiceUrl });
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
