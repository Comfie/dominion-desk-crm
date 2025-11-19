import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const periodDays = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get basic counts
    const [
      totalProperties,
      totalBookings,
      totalTenants,
      totalInquiries,
      pendingInquiries,
      activeMaintenance,
    ] = await Promise.all([
      prisma.property.count({ where: { userId: session.user.id } }),
      prisma.booking.count({ where: { userId: session.user.id } }),
      prisma.tenant.count({ where: { userId: session.user.id } }),
      prisma.inquiry.count({ where: { userId: session.user.id } }),
      prisma.inquiry.count({
        where: {
          userId: session.user.id,
          status: { in: ['NEW', 'IN_PROGRESS'] },
        },
      }),
      prisma.maintenanceRequest.count({
        where: {
          userId: session.user.id,
          status: { in: ['PENDING', 'SCHEDULED', 'IN_PROGRESS'] },
        },
      }),
    ]);

    // Get revenue data
    const payments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        status: 'PAID',
        paymentDate: { gte: startDate },
      },
      select: {
        amount: true,
        paymentDate: true,
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

    // Get expenses
    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        expenseDate: { gte: startDate },
      },
      select: {
        amount: true,
        expenseDate: true,
      },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

    // Get outstanding payments
    const bookingsWithBalance = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: {
        totalAmount: true,
        amountPaid: true,
      },
    });

    const outstandingPayments = bookingsWithBalance.reduce((sum, b) => {
      const due = parseFloat(b.totalAmount.toString()) - parseFloat(b.amountPaid.toString());
      return sum + (due > 0 ? due : 0);
    }, 0);

    // Calculate occupancy rate
    const properties = await prisma.property.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const totalPropertyDays = properties.length * periodDays;

    const bookingsInPeriod = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'] },
        OR: [
          {
            checkInDate: { lte: new Date() },
            checkOutDate: { gte: startDate },
          },
        ],
      },
      select: {
        checkInDate: true,
        checkOutDate: true,
      },
    });

    const occupiedDays = bookingsInPeriod.reduce((sum, booking) => {
      const start = new Date(Math.max(booking.checkInDate.getTime(), startDate.getTime()));
      const end = new Date(Math.min(booking.checkOutDate.getTime(), new Date().getTime()));
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return sum + Math.max(0, days);
    }, 0);

    const occupancyRate = totalPropertyDays > 0 ? (occupiedDays / totalPropertyDays) * 100 : 0;

    // Get revenue by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyPayments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        status: 'PAID',
        paymentDate: { gte: twelveMonthsAgo },
      },
      select: {
        amount: true,
        paymentDate: true,
      },
    });

    const revenueByMonth: Record<string, number> = {};
    monthlyPayments.forEach((payment) => {
      const monthKey = payment.paymentDate.toISOString().slice(0, 7);
      revenueByMonth[monthKey] =
        (revenueByMonth[monthKey] || 0) + parseFloat(payment.amount.toString());
    });

    // Get booking sources breakdown
    const bookingSources = await prisma.booking.groupBy({
      by: ['source'],
      where: {
        userId: session.user.id,
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Get recent activity
    const recentBookings = await prisma.booking.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        guestName: true,
        checkInDate: true,
        status: true,
        createdAt: true,
        property: {
          select: { name: true },
        },
      },
    });

    const recentInquiries = await prisma.inquiry.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        contactName: true,
        status: true,
        createdAt: true,
        property: {
          select: { name: true },
        },
      },
    });

    // Inquiry conversion rate
    const totalInquiriesInPeriod = await prisma.inquiry.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: startDate },
      },
    });

    const convertedInquiries = await prisma.inquiry.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: startDate },
        convertedToBooking: true,
      },
    });

    const conversionRate =
      totalInquiriesInPeriod > 0 ? (convertedInquiries / totalInquiriesInPeriod) * 100 : 0;

    return NextResponse.json({
      summary: {
        totalProperties,
        totalBookings,
        totalTenants,
        totalInquiries,
        pendingInquiries,
        activeMaintenance,
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        outstandingPayments,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10,
      },
      charts: {
        revenueByMonth: Object.entries(revenueByMonth)
          .map(([month, revenue]) => ({ month, revenue }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        bookingSources: bookingSources.map((s) => ({
          source: s.source,
          count: s._count,
        })),
      },
      recentActivity: {
        bookings: recentBookings,
        inquiries: recentInquiries,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
