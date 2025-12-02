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
    const propertyId = searchParams.get('propertyId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Default to last 30 days if no dates provided
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const daysInRange = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get properties
    const propertyWhere = {
      userId: session.user.id,
      ...(propertyId && { id: propertyId }),
    };

    const properties = await prisma.property.findMany({
      where: propertyWhere,
      select: {
        id: true,
        name: true,
        rentalType: true,
      },
    });

    // Get bookings and tenants for each property
    const occupancyByProperty = await Promise.all(
      properties.map(async (property: (typeof properties)[number]) => {
        // Get short-term bookings
        const bookings = await prisma.booking.findMany({
          where: {
            propertyId: property.id,
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'] },
            OR: [
              {
                checkInDate: { lte: endDate },
                checkOutDate: { gte: startDate },
              },
            ],
          },
          select: {
            checkInDate: true,
            checkOutDate: true,
            totalAmount: true,
            numberOfNights: true,
          },
        });

        // Get long-term tenant leases
        const tenantLeases = await prisma.propertyTenant.findMany({
          where: {
            propertyId: property.id,
            isActive: true,
            OR: [
              {
                // Lease started before or during the range and hasn't ended
                leaseStartDate: { lte: endDate },
                OR: [
                  { leaseEndDate: { gte: startDate } },
                  { leaseEndDate: null }, // No end date = still active
                ],
              },
            ],
          },
          select: {
            leaseStartDate: true,
            leaseEndDate: true,
            monthlyRent: true,
            moveInDate: true,
            moveOutDate: true,
          },
        });

        // Calculate occupied days and revenue
        let occupiedDays = 0;
        let totalRevenue = 0;
        let totalBookingsAndLeases = bookings.length;

        // Add booking occupancy
        bookings.forEach((booking: (typeof bookings)[number]) => {
          const bookingStart = new Date(
            Math.max(booking.checkInDate.getTime(), startDate.getTime())
          );
          const bookingEnd = new Date(Math.min(booking.checkOutDate.getTime(), endDate.getTime()));
          const days = Math.ceil(
            (bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60 * 24)
          );
          occupiedDays += Math.max(0, days);
          totalRevenue += parseFloat(booking.totalAmount.toString());
        });

        // Add tenant lease occupancy
        tenantLeases.forEach((lease: (typeof tenantLeases)[number]) => {
          const leaseStart = new Date(
            Math.max(lease.leaseStartDate.getTime(), startDate.getTime())
          );
          const leaseEnd = lease.leaseEndDate
            ? new Date(Math.min(lease.leaseEndDate.getTime(), endDate.getTime()))
            : endDate;

          const days = Math.ceil(
            (leaseEnd.getTime() - leaseStart.getTime()) / (1000 * 60 * 60 * 24)
          );
          occupiedDays += Math.max(0, days);

          // Calculate revenue for this period (approximate based on monthly rent)
          if (lease.monthlyRent) {
            const months = days / 30;
            totalRevenue += parseFloat(lease.monthlyRent.toString()) * months;
          }

          totalBookingsAndLeases++;
        });

        const occupancyRate = daysInRange > 0 ? (occupiedDays / daysInRange) * 100 : 0;
        const averageDailyRate = occupiedDays > 0 ? totalRevenue / occupiedDays : 0;
        const revPAR = daysInRange > 0 ? totalRevenue / daysInRange : 0; // Revenue per available day

        return {
          property: {
            id: property.id,
            name: property.name,
            rentalType: property.rentalType,
          },
          metrics: {
            totalDays: daysInRange,
            occupiedDays,
            vacantDays: daysInRange - occupiedDays,
            occupancyRate: Math.round(occupancyRate * 10) / 10,
            totalBookings: totalBookingsAndLeases,
            totalRevenue,
            averageDailyRate: Math.round(averageDailyRate * 100) / 100,
            revPAR: Math.round(revPAR * 100) / 100,
          },
        };
      })
    );

    // Calculate overall metrics
    const totalProperties = properties.length;
    const totalAvailableDays = totalProperties * daysInRange;
    const totalOccupiedDays = occupancyByProperty.reduce(
      (sum: number, p: (typeof occupancyByProperty)[number]) => sum + p.metrics.occupiedDays,
      0
    );
    const overallOccupancy =
      totalAvailableDays > 0 ? (totalOccupiedDays / totalAvailableDays) * 100 : 0;

    const totalRevenue = occupancyByProperty.reduce(
      (sum: number, p: (typeof occupancyByProperty)[number]) => sum + p.metrics.totalRevenue,
      0
    );

    // Get daily occupancy for chart
    const dailyOccupancy: { date: string; occupied: number; available: number }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0] ?? '';

      // Count bookings for this day
      const bookingCount = await prisma.booking.count({
        where: {
          userId: session.user.id,
          ...(propertyId && { propertyId }),
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'] },
          checkInDate: { lte: currentDate },
          checkOutDate: { gt: currentDate },
        },
      });

      // Count active tenant leases for this day
      const tenantCount = await prisma.propertyTenant.count({
        where: {
          ...(propertyId && { propertyId }),
          property: {
            userId: session.user.id,
          },
          isActive: true,
          leaseStartDate: { lte: currentDate },
          OR: [{ leaseEndDate: { gte: currentDate } }, { leaseEndDate: null }],
        },
      });

      const occupiedCount = bookingCount + tenantCount;

      dailyOccupancy.push({
        date: dateStr,
        occupied: occupiedCount,
        available: totalProperties - occupiedCount,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get monthly occupancy trend (last 12 months)
    const monthlyTrend: { month: string; occupancyRate: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthDays = monthEnd.getDate();
      const monthAvailableDays = totalProperties * monthDays;

      let monthOccupiedDays = 0;

      for (const property of properties) {
        // Get bookings for this month
        const bookings = await prisma.booking.findMany({
          where: {
            propertyId: property.id,
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'] },
            checkInDate: { lte: monthEnd },
            checkOutDate: { gte: monthStart },
          },
          select: {
            checkInDate: true,
            checkOutDate: true,
          },
        });

        bookings.forEach((booking: (typeof bookings)[number]) => {
          const bookingStart = new Date(
            Math.max(booking.checkInDate.getTime(), monthStart.getTime())
          );
          const bookingEnd = new Date(Math.min(booking.checkOutDate.getTime(), monthEnd.getTime()));
          const days = Math.ceil(
            (bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60 * 24)
          );
          monthOccupiedDays += Math.max(0, days);
        });

        // Get tenant leases for this month
        const tenantLeases = await prisma.propertyTenant.findMany({
          where: {
            propertyId: property.id,
            isActive: true,
            leaseStartDate: { lte: monthEnd },
            OR: [{ leaseEndDate: { gte: monthStart } }, { leaseEndDate: null }],
          },
          select: {
            leaseStartDate: true,
            leaseEndDate: true,
          },
        });

        tenantLeases.forEach((lease: (typeof tenantLeases)[number]) => {
          const leaseStart = new Date(
            Math.max(lease.leaseStartDate.getTime(), monthStart.getTime())
          );
          const leaseEnd = lease.leaseEndDate
            ? new Date(Math.min(lease.leaseEndDate.getTime(), monthEnd.getTime()))
            : monthEnd;

          const days = Math.ceil(
            (leaseEnd.getTime() - leaseStart.getTime()) / (1000 * 60 * 60 * 24)
          );
          monthOccupiedDays += Math.max(0, days);
        });
      }

      const monthRate = monthAvailableDays > 0 ? (monthOccupiedDays / monthAvailableDays) * 100 : 0;

      monthlyTrend.push({
        month: monthStart.toISOString().slice(0, 7),
        occupancyRate: Math.round(monthRate * 10) / 10,
      });
    }

    return NextResponse.json({
      summary: {
        totalProperties,
        dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
        daysInRange,
        totalAvailableDays,
        totalOccupiedDays,
        overallOccupancy: Math.round(overallOccupancy * 10) / 10,
        totalRevenue,
        averageOccupancy: Math.round(overallOccupancy * 10) / 10,
      },
      byProperty: occupancyByProperty,
      charts: {
        dailyOccupancy,
        monthlyTrend,
      },
    });
  } catch (error) {
    console.error('Occupancy report error:', error);
    return NextResponse.json({ error: 'Failed to fetch occupancy report' }, { status: 500 });
  }
}
