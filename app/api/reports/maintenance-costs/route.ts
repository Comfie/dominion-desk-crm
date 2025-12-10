import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { differenceInDays, startOfYear, endOfYear } from 'date-fns';

/**
 * GET /api/reports/maintenance-costs
 * Get maintenance cost report with property and category breakdown
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const propertyId = searchParams.get('propertyId');

    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));

    // Get all maintenance requests for the year
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: yearStart,
          lte: yearEnd,
        },
        ...(propertyId && propertyId !== 'all' ? { propertyId } : {}),
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        expenses: {
          select: {
            id: true,
            amount: true,
            category: true,
            expenseDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate costs by property
    const propertyStats: Record<
      string,
      {
        property: { id: string; name: string };
        requestCount: number;
        totalCost: number;
        avgCost: number;
        completedCount: number;
        avgResolutionDays: number | null;
      }
    > = {};

    // Calculate costs by category
    const categoryStats: Record<
      string,
      {
        category: string;
        requestCount: number;
        totalCost: number;
        avgCost: number;
      }
    > = {};

    // Track resolution times
    let totalResolutionDays = 0;
    let completedWithDatesCount = 0;

    maintenanceRequests.forEach((request) => {
      const cost = request.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      const actualCost = Number(request.actualCost || 0);
      const totalRequestCost = cost || actualCost;

      // Property stats
      if (request.property) {
        const propId = request.property.id;
        if (!propertyStats[propId]) {
          propertyStats[propId] = {
            property: request.property,
            requestCount: 0,
            totalCost: 0,
            avgCost: 0,
            completedCount: 0,
            avgResolutionDays: null,
          };
        }
        propertyStats[propId].requestCount++;
        propertyStats[propId].totalCost += totalRequestCost;

        if (request.status === 'COMPLETED') {
          propertyStats[propId].completedCount++;
        }
      }

      // Category stats
      const category = request.category;
      if (!categoryStats[category]) {
        categoryStats[category] = {
          category,
          requestCount: 0,
          totalCost: 0,
          avgCost: 0,
        };
      }
      categoryStats[category].requestCount++;
      categoryStats[category].totalCost += totalRequestCost;

      // Resolution time
      if (request.status === 'COMPLETED' && request.completedDate) {
        const resolutionDays = differenceInDays(
          new Date(request.completedDate),
          new Date(request.createdAt)
        );
        totalResolutionDays += resolutionDays;
        completedWithDatesCount++;
      }
    });

    // Calculate averages
    Object.values(propertyStats).forEach((stat) => {
      stat.avgCost = stat.requestCount > 0 ? Math.round(stat.totalCost / stat.requestCount) : 0;
    });

    Object.values(categoryStats).forEach((stat) => {
      stat.avgCost = stat.requestCount > 0 ? Math.round(stat.totalCost / stat.requestCount) : 0;
    });

    // Monthly breakdown
    const monthlyData: { month: string; cost: number; count: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const monthRequests = maintenanceRequests.filter((r) => {
        const createdMonth = new Date(r.createdAt).getMonth();
        return createdMonth === m;
      });

      const monthCost = monthRequests.reduce((sum, r) => {
        const cost = r.expenses.reduce((s, e) => s + Number(e.amount), 0);
        return sum + (cost || Number(r.actualCost || 0));
      }, 0);

      monthlyData.push({
        month: new Date(year, m, 1).toLocaleString('default', { month: 'short' }),
        cost: monthCost,
        count: monthRequests.length,
      });
    }

    // Summary
    const totalCost = Object.values(propertyStats).reduce((sum, p) => sum + p.totalCost, 0);
    const summary = {
      totalRequests: maintenanceRequests.length,
      totalCost,
      avgCostPerRequest:
        maintenanceRequests.length > 0 ? Math.round(totalCost / maintenanceRequests.length) : 0,
      avgResolutionDays:
        completedWithDatesCount > 0
          ? Math.round(totalResolutionDays / completedWithDatesCount)
          : null,
      completedRequests: maintenanceRequests.filter((r) => r.status === 'COMPLETED').length,
      pendingRequests: maintenanceRequests.filter((r) => r.status === 'PENDING').length,
      inProgressRequests: maintenanceRequests.filter((r) => r.status === 'IN_PROGRESS').length,
    };

    return NextResponse.json({
      summary,
      byProperty: Object.values(propertyStats).sort((a, b) => b.totalCost - a.totalCost),
      byCategory: Object.values(categoryStats).sort((a, b) => b.totalCost - a.totalCost),
      monthlyData,
      year,
    });
  } catch (error) {
    console.error('Error fetching maintenance costs report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}
