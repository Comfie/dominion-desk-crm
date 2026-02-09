import { Prisma, PaymentStatus, PaymentType } from '@prisma/client';
import { prisma } from '@/lib/db';

export type PaymentWithDetails = Prisma.PaymentGetPayload<{
  include: {
    tenant: {
      include: {
        properties: {
          include: {
            property: true;
          };
        };
      };
    };
    property: true;
    user: true;
    booking: {
      select: {
        id: true;
        bookingReference: true;
        guestName: true;
        property: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
  };
}>;

/**
 * Payment Repository
 * Handles all database operations for payments
 */
export class PaymentRepository {
  /**
   * Find payment by ID
   */
  async findById(id: string, userId?: string): Promise<PaymentWithDetails | null> {
    return prisma.payment.findFirst({
      where: {
        id,
        ...(userId && { userId }),
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            guestName: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tenant: {
          include: {
            properties: {
              include: {
                property: true,
              },
            },
          },
        },
        property: true,
        user: true,
      },
    });
  }

  /**
   * Find all payments for a user
   */
  async findByUserId(
    userId: string,
    filters?: {
      bookingId?: string;
      status?: PaymentStatus;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const where: Prisma.PaymentWhereInput = { userId };

    if (filters?.bookingId) {
      where.bookingId = filters.bookingId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.paymentDate = {};
      if (filters.startDate) {
        where.paymentDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.paymentDate.lte = filters.endDate;
      }
    }

    return prisma.payment.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            guestName: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  /**
   * Find payments by booking ID
   */
  async findByBookingId(bookingId: string) {
    return prisma.payment.findMany({
      where: { bookingId },
      orderBy: { paymentDate: 'desc' },
    });
  }

  /**
   * Create a new payment
   */
  async create(data: Prisma.PaymentCreateInput) {
    return prisma.payment.create({
      data,
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            guestName: true,
          },
        },
      },
    });
  }

  /**
   * Update a payment
   */
  async update(id: string, data: Prisma.PaymentUpdateInput) {
    return prisma.payment.update({
      where: { id },
      data,
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            guestName: true,
          },
        },
      },
    });
  }

  /**
   * Delete a payment
   */
  async delete(id: string) {
    return prisma.payment.delete({
      where: { id },
    });
  }

  /**
   * Get total payments for a booking
   */
  async getTotalPaidForBooking(bookingId: string) {
    const result = await prisma.payment.aggregate({
      where: {
        bookingId,
        status: 'PAID',
      },
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }

  /**
   * Get payment statistics
   */
  async getStatistics(userId: string) {
    const [totalPayments, paidCount, pendingCount, failedCount] = await Promise.all([
      prisma.payment.aggregate({
        where: { userId, status: 'PAID' },
        _sum: { amount: true },
      }),
      prisma.payment.count({ where: { userId, status: 'PAID' } }),
      prisma.payment.count({ where: { userId, status: 'PENDING' } }),
      prisma.payment.count({ where: { userId, status: 'FAILED' } }),
    ]);

    return {
      totalAmount: Number(totalPayments._sum.amount || 0),
      paidCount,
      pendingCount,
      failedCount,
    };
  }

  /**
   * Get recent payments
   */
  async getRecent(userId: string, limit = 10) {
    return prisma.payment.findMany({
      where: { userId },
      include: {
        booking: {
          select: {
            id: true,
            bookingReference: true,
            guestName: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
      take: limit,
    });
  }

  /**
   * Find payments due for reminders (with tenant details)
   */
  async findDuePayments(userId: string, dueDate: Date) {
    const startOfDay = new Date(dueDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dueDate);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.payment.findMany({
      where: {
        userId,
        status: PaymentStatus.PENDING,
        dueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        reminderSent: {
          not: true,
        },
      },
      include: {
        tenant: {
          include: {
            properties: {
              include: {
                property: true,
              },
            },
          },
        },
        property: true,
        user: true,
        booking: {
          select: {
            id: true,
            bookingReference: true,
            guestName: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find overdue payments
   */
  async findOverduePayments(userId: string) {
    const now = new Date();

    return prisma.payment.findMany({
      where: {
        userId,
        status: PaymentStatus.PENDING,
        dueDate: {
          lt: now,
        },
      },
      include: {
        tenant: {
          include: {
            properties: {
              include: {
                property: true,
              },
            },
          },
        },
        property: true,
        user: true,
        booking: {
          select: {
            id: true,
            bookingReference: true,
            guestName: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Mark payment as overdue
   */
  async markAsOverdue(id: string) {
    return prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.OVERDUE,
      },
    });
  }

  /**
   * Mark reminder as sent
   */
  async markReminderSent(id: string) {
    return prisma.payment.update({
      where: { id },
      data: {
        reminderSent: true,
        reminderSentAt: new Date(),
        reminderCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Update invoice URL
   */
  async updateInvoiceUrl(id: string, invoiceUrl: string) {
    return prisma.payment.update({
      where: { id },
      data: { invoiceUrl },
    });
  }

  /**
   * Generate monthly payments for all active tenants
   */
  async generateMonthlyPayments(userId: string, month: number, year: number) {
    // Get user's rental due day setting
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { rentalDueDay: true },
    });

    const rentalDueDay = user?.rentalDueDay || 1;

    // Find all ACTIVE leases (PropertyTenant records) for this user's properties
    const activeLeases = await prisma.propertyTenant.findMany({
      where: {
        userId,
        isActive: true,
        monthlyRent: { gt: 0 },
        // Only include leases that are active during this month
        leaseStartDate: { lte: new Date(year, month - 1, 28) },
        OR: [{ leaseEndDate: null }, { leaseEndDate: { gte: new Date(year, month - 1, 1) } }],
      },
      include: {
        tenant: true,
        property: true,
      },
    });

    const payments: Prisma.PaymentCreateManyInput[] = [];
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    // Calculate due date using user's global rental due day setting
    const dueDay = Math.min(rentalDueDay, 28); // Cap at 28 to avoid month-end issues
    const dueDate = new Date(year, month - 1, dueDay, 9, 0, 0);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    for (const lease of activeLeases) {
      // Check if payment already exists for this lease+month
      // Use both tenantId AND propertyId to avoid duplicates
      const existing = await prisma.payment.findFirst({
        where: {
          userId,
          tenantId: lease.tenantId,
          propertyId: lease.propertyId,
          paymentType: PaymentType.RENT,
          dueDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      });

      if (!existing) {
        const monthName = monthNames[month - 1];
        const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        // Include unitLabel in invoice number for uniqueness
        const unitSuffix = lease.unitLabel ? `-${lease.unitLabel.replace(/\s+/g, '')}` : '';
        const invoiceNumber = `INV-${year}${String(month).padStart(2, '0')}-${lease.tenantId.substring(0, 8)}${unitSuffix}`;

        const unitDescription = lease.unitLabel ? ` (${lease.unitLabel})` : '';
        const paymentData: Prisma.PaymentCreateManyInput = {
          userId,
          tenantId: lease.tenantId,
          propertyId: lease.propertyId,
          paymentReference,
          paymentType: PaymentType.RENT,
          amount: lease.monthlyRent, // USE LEASE rent, not tenant rent
          currency: 'ZAR',
          dueDate,
          status: PaymentStatus.PENDING,
          invoiceNumber,
          description: `Monthly rent for ${monthName} ${year} - ${lease.property.name}${unitDescription}`,
        };

        payments.push(paymentData);

        // Update tenant's nextPaymentDue
        await prisma.tenant.update({
          where: { id: lease.tenantId },
          data: { nextPaymentDue: dueDate },
        });
      }
    }

    if (payments.length > 0) {
      await prisma.payment.createMany({
        data: payments,
        skipDuplicates: true,
      });
    }

    return { count: payments.length, payments };
  }

  /**
   * Get payment summary statistics
   */
  async getPaymentSummary(userId: string, month?: number, year?: number) {
    const whereBase: Prisma.PaymentWhereInput = { userId };

    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      whereBase.dueDate = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    }

    const [total, pending, paid, overdue, totalAmount, paidAmount] = await Promise.all([
      prisma.payment.count({ where: whereBase }),
      prisma.payment.count({ where: { ...whereBase, status: PaymentStatus.PENDING } }),
      prisma.payment.count({ where: { ...whereBase, status: PaymentStatus.PAID } }),
      prisma.payment.count({ where: { ...whereBase, status: PaymentStatus.OVERDUE } }),
      prisma.payment.aggregate({
        where: whereBase,
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { ...whereBase, status: PaymentStatus.PAID },
        _sum: { amount: true },
      }),
    ]);

    return {
      total,
      pending,
      paid,
      overdue,
      totalAmount: Number(totalAmount._sum.amount || 0),
      paidAmount: Number(paidAmount._sum.amount || 0),
      pendingAmount: Number(totalAmount._sum.amount || 0) - Number(paidAmount._sum.amount || 0),
    };
  }

  /**
   * Get rent collection grid data for a specific month
   * Returns all properties with their tenants and payment status
   */
  async getRentCollectionGrid(userId: string, month: number, year: number, propertyId?: string) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    // Build property filter
    const propertyWhere: Prisma.PropertyWhereInput = {
      userId,
      ...(propertyId && propertyId !== 'all' ? { id: propertyId } : {}),
    };

    // Get all active leases for this month, then group by property
    const activeLeases = await prisma.propertyTenant.findMany({
      where: {
        userId,
        isActive: true,
        leaseStartDate: { lte: endOfMonth },
        OR: [{ leaseEndDate: null }, { leaseEndDate: { gte: startOfMonth } }],
        ...(propertyId && propertyId !== 'all' ? { propertyId } : {}),
      },
      include: {
        tenant: true,
        property: true,
      },
    });

    // Group leases by property
    const propertyMap = new Map<
      string,
      { property: (typeof activeLeases)[0]['property']; leases: typeof activeLeases }
    >();
    activeLeases.forEach((lease) => {
      const existing = propertyMap.get(lease.propertyId);
      if (existing) {
        existing.leases.push(lease);
      } else {
        propertyMap.set(lease.propertyId, { property: lease.property, leases: [lease] });
      }
    });

    const properties = Array.from(propertyMap.values()).sort((a, b) =>
      a.property.name.localeCompare(b.property.name)
    );

    // Get all payments for the month
    const payments = await prisma.payment.findMany({
      where: {
        userId,
        paymentType: PaymentType.RENT,
        dueDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        ...(propertyId && propertyId !== 'all' ? { propertyId } : {}),
      },
      include: {
        tenant: true,
        property: true,
      },
    });

    // Create a map for quick payment lookup by tenant+property
    const paymentMap = new Map<string, (typeof payments)[0]>();
    payments.forEach((payment) => {
      if (payment.tenantId && payment.propertyId) {
        const key = `${payment.tenantId}-${payment.propertyId}`;
        paymentMap.set(key, payment);
      }
    });

    // Build the grid data
    const gridData = properties.map(({ property, leases }) => {
      const tenants = leases.map((lease) => {
        const key = `${lease.tenantId}-${property.id}`;
        const payment = paymentMap.get(key);

        // Calculate days overdue
        let daysOverdue = 0;
        if (payment && payment.dueDate && payment.status !== PaymentStatus.PAID) {
          const today = new Date();
          const due = new Date(payment.dueDate);
          daysOverdue = Math.max(
            0,
            Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
          );
        }

        return {
          lease,
          tenant: lease.tenant,
          unitLabel: lease.unitLabel,
          monthlyRent: Number(lease.monthlyRent),
          payment: payment
            ? {
                id: payment.id,
                amount: Number(payment.amount),
                status: payment.status,
                dueDate: payment.dueDate,
                paymentDate: payment.paymentDate,
                invoiceNumber: payment.invoiceNumber,
                invoiceUrl: payment.invoiceUrl,
                proofOfPaymentUrl: payment.proofOfPaymentUrl,
                proofUploadedAt: payment.proofUploadedAt,
              }
            : null,
          daysOverdue,
        };
      });

      // Calculate property subtotals
      const expected = tenants.reduce((sum, t) => sum + t.monthlyRent, 0);
      const collected = tenants.reduce((sum, t) => {
        return sum + (t.payment?.status === PaymentStatus.PAID ? t.payment?.amount || 0 : 0);
      }, 0);
      const outstanding = expected - collected;
      const paidCount = tenants.filter((t) => t.payment?.status === PaymentStatus.PAID).length;

      return {
        property: {
          id: property.id,
          name: property.name,
          address: property.address,
        },
        tenants,
        subtotals: {
          expected,
          collected,
          outstanding,
          paidCount,
          totalCount: tenants.length,
        },
      };
    });

    return gridData;
  }

  /**
   * Get collection rate trend for the last N months
   * Returns monthly expected vs collected amounts
   */
  async getCollectionRateTrend(userId: string, months: number = 6) {
    const trends: Array<{ month: string; expected: number; collected: number; rate: number }> = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);

      const [expectedResult, collectedResult] = await Promise.all([
        prisma.payment.aggregate({
          where: {
            userId,
            paymentType: PaymentType.RENT,
            dueDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: {
            userId,
            paymentType: PaymentType.RENT,
            status: PaymentStatus.PAID,
            dueDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: { amount: true },
        }),
      ]);

      const expected = Number(expectedResult._sum.amount || 0);
      const collected = Number(collectedResult._sum.amount || 0);
      const rate = expected > 0 ? (collected / expected) * 100 : 0;

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const monthLabel = `${monthNames[month - 1]} ${year}`;

      trends.push({
        month: monthLabel,
        expected,
        collected,
        rate: Math.round(rate * 100) / 100, // Round to 2 decimal places
      });
    }

    return trends;
  }

  /**
   * Get tenant payment ledger with complete payment history
   * Returns chronological payment history with statistics
   */
  async getTenantPaymentLedger(tenantId: string, userId: string, year?: number) {
    // Build date filter
    const whereDate: any = {};
    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      whereDate.dueDate = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    // Get all payments for the tenant
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        userId,
        ...whereDate,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
    });

    // Calculate statistics
    const now = new Date();
    const paidPayments = payments.filter((p) => p.status === PaymentStatus.PAID);
    const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Calculate on-time payment rate
    const onTimePayments = paidPayments.filter((p) => {
      if (!p.paymentDate || !p.dueDate) return false;
      return new Date(p.paymentDate) <= new Date(p.dueDate);
    });
    const onTimeRate =
      paidPayments.length > 0 ? (onTimePayments.length / paidPayments.length) * 100 : 0;

    // Calculate average days to pay
    const daysToPayArray = paidPayments
      .filter((p) => p.paymentDate && p.dueDate)
      .map((p) => {
        const payDate = new Date(p.paymentDate!);
        const dueDate = new Date(p.dueDate!);
        return Math.floor((payDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      });
    const avgDaysToPay =
      daysToPayArray.length > 0
        ? daysToPayArray.reduce((sum, days) => sum + days, 0) / daysToPayArray.length
        : 0;

    // Calculate current balance (outstanding amount)
    const currentBalance = payments
      .filter((p) => p.status !== PaymentStatus.PAID && p.status !== PaymentStatus.REFUNDED)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Format payment records with additional calculated fields
    const paymentRecords = payments.map((payment) => {
      let daysLate = 0;
      if (payment.paymentDate && payment.dueDate) {
        const payDate = new Date(payment.paymentDate);
        const dueDate = new Date(payment.dueDate);
        daysLate = Math.max(
          0,
          Math.floor((payDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        );
      } else if (payment.status !== PaymentStatus.PAID && payment.dueDate) {
        // For unpaid payments, calculate days overdue from today
        const dueDate = new Date(payment.dueDate);
        if (dueDate < now) {
          daysLate = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        id: payment.id,
        date: payment.paymentDate || payment.dueDate || payment.createdAt,
        description: payment.description || `${payment.paymentType} payment`,
        amount: Number(payment.amount),
        status: payment.status,
        daysLate,
        paymentMethod: payment.paymentMethod,
        invoiceNumber: payment.invoiceNumber,
        invoiceUrl: payment.invoiceUrl,
        receiptUrl: payment.receiptUrl,
        dueDate: payment.dueDate,
        paymentDate: payment.paymentDate,
        paymentType: payment.paymentType,
        property: payment.property,
      };
    });

    return {
      payments: paymentRecords,
      summary: {
        totalPaid,
        onTimeRate: Math.round(onTimeRate * 100) / 100,
        avgDaysToPay: Math.round(avgDaysToPay * 10) / 10,
        currentBalance,
        totalPayments: payments.length,
        paidCount: paidPayments.length,
        pendingCount: payments.filter((p) => p.status === PaymentStatus.PENDING).length,
        overdueCount: payments.filter((p) => p.status === PaymentStatus.OVERDUE).length,
      },
    };
  }
}

// Export singleton instance
export const paymentRepository = new PaymentRepository();
