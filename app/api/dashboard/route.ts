import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getStaleMaintenance } from '@/lib/features/maintenance/services/dashboard-utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Calculate start of 6 months ago correctly
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    // Get all counts in parallel
    const [
      totalProperties,
      activeBookings,
      totalTenants,
      pendingInquiries,
      activeMaintenance,
      monthlyRevenue,
      recentBookings,
      upcomingTasks,
      upcomingCheckIns,
      outstandingPayments,
      staleMaintenance,
      propertyStats,
      rawRevenueHistory,
    ] = await Promise.all([
      // Total properties
      prisma.property.count({ where: { userId } }),

      // Active bookings (checked in or confirmed upcoming)
      prisma.booking.count({
        where: {
          userId,
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          checkOutDate: { gte: today },
        },
      }),

      // Total tenants
      prisma.tenant.count({ where: { userId } }),

      // Pending inquiries
      prisma.inquiry.count({
        where: {
          userId,
          status: { in: ['NEW', 'IN_PROGRESS'] },
        },
      }),

      // Active maintenance requests
      prisma.maintenanceRequest.count({
        where: {
          userId,
          status: { in: ['PENDING', 'SCHEDULED', 'IN_PROGRESS'] },
        },
      }),

      // Monthly revenue
      prisma.payment.aggregate({
        where: {
          userId,
          status: 'PAID',
          paymentDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { amount: true },
      }),

      // Recent bookings
      prisma.booking.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          guestName: true,
          checkInDate: true,
          checkOutDate: true,
          status: true,
          totalAmount: true,
          property: {
            select: { name: true },
          },
        },
      }),

      // Upcoming tasks
      prisma.task.findMany({
        where: {
          userId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: { gte: today },
        },
        orderBy: { dueDate: 'asc' },
        take: 5,
        select: {
          id: true,
          title: true,
          dueDate: true,
          priority: true,
          taskType: true,
        },
      }),

      // Upcoming check-ins (next 7 days)
      prisma.booking.findMany({
        where: {
          userId,
          status: 'CONFIRMED',
          checkInDate: {
            gte: today,
            lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { checkInDate: 'asc' },
        take: 5,
        select: {
          id: true,
          guestName: true,
          guestPhone: true,
          checkInDate: true,
          numberOfGuests: true,
          property: {
            select: { name: true },
          },
        },
      }),

      // Outstanding payments
      prisma.booking.findMany({
        where: {
          userId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
        select: {
          totalAmount: true,
          amountPaid: true,
        },
      }),

      // Stale maintenance requests (5+ days old)
      getStaleMaintenance(userId),

      // Property status distribution
      prisma.property.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),

      // Last 6 months revenue data
      prisma.payment.groupBy({
        by: ['paymentDate'],
        where: {
          userId,
          status: 'PAID',
          paymentDate: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 5)), // Last 6 months
          },
        },
        _sum: { amount: true },
      }),
    ]);

    // Calculate outstanding amount
    const totalOutstanding = outstandingPayments.reduce(
      (sum: number, booking: (typeof outstandingPayments)[number]) => {
        const due =
          parseFloat(booking.totalAmount.toString()) - parseFloat(booking.amountPaid.toString());
        return sum + (due > 0 ? due : 0);
      },
      0
    );

    // Get previous month revenue for comparison
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const prevMonthRevenue = await prisma.payment.aggregate({
      where: {
        userId,
        status: 'PAID',
        paymentDate: {
          gte: prevMonthStart,
          lte: prevMonthEnd,
        },
      },
      _sum: { amount: true },
    });

    const currentRevenue = parseFloat(monthlyRevenue._sum.amount?.toString() || '0');
    const previousRevenue = parseFloat(prevMonthRevenue._sum.amount?.toString() || '0');
    const revenueChange =
      previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Get occupancy rate for current month
    const totalPropertyDays = totalProperties * endOfMonth.getDate();
    const bookingsThisMonth = await prisma.booking.findMany({
      where: {
        userId,
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'] },
        OR: [
          {
            checkInDate: { lte: endOfMonth },
            checkOutDate: { gte: startOfMonth },
          },
        ],
      },
      select: {
        checkInDate: true,
        checkOutDate: true,
      },
    });

    const occupiedDays = bookingsThisMonth.reduce(
      (sum: number, booking: (typeof bookingsThisMonth)[number]) => {
        const start = new Date(Math.max(booking.checkInDate.getTime(), startOfMonth.getTime()));
        const end = new Date(Math.min(booking.checkOutDate.getTime(), endOfMonth.getTime()));
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return sum + Math.max(0, days);
      },
      0
    );

    const occupancyRate = totalPropertyDays > 0 ? (occupiedDays / totalPropertyDays) * 100 : 0;

    // Process revenue history
    const revenueHistory: Array<{ name: string; total: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const year = d.getFullYear();

      // Filter payments for this month from the raw grouped data
      // Note: groupBy with date usually returns precise dates, so we might need to process in JS
      // A cleaner way for the future is raw query or multiple aggregates,
      // but for now we'll sum up the raw chunks that fall in this month
      const monthRevenue = rawRevenueHistory
        .filter((p) => {
          const pDate = new Date(p.paymentDate!);
          return pDate.getMonth() === d.getMonth() && pDate.getFullYear() === year;
        })
        .reduce((sum, p) => sum + Number(p._sum.amount || 0), 0);

      revenueHistory.push({
        name: monthName,
        total: monthRevenue,
      });
    }

    return NextResponse.json({
      stats: {
        totalProperties,
        activeBookings,
        totalTenants,
        pendingInquiries,
        activeMaintenance,
        monthlyRevenue: currentRevenue,
        revenueChange: Math.round(revenueChange * 10) / 10,
        outstandingPayments: totalOutstanding,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        staleMaintenanceCount: staleMaintenance.length,
      },
      recentBookings,
      upcomingTasks,
      upcomingCheckIns,
      staleMaintenance,
      charts: {
        propertyStatus: propertyStats.map((stat) => ({
          name: stat.status,
          value: stat._count,
        })),
        revenue: revenueHistory,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
