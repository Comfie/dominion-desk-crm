import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { startOfYear, endOfYear } from 'date-fns';

/**
 * GET /api/reports/export
 * Export report data as CSV
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'payments';
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const propertyId = searchParams.get('propertyId');

    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 0, 1));

    let csvContent = '';
    let filename = '';

    switch (reportType) {
      case 'tenant-payments': {
        const payments = await prisma.payment.findMany({
          where: {
            userId: session.user.id,
            tenantId: { not: null },
            createdAt: { gte: yearStart, lte: yearEnd },
            ...(propertyId && propertyId !== 'all' ? { propertyId } : {}),
          },
          include: {
            tenant: { select: { firstName: true, lastName: true, email: true } },
            property: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        csvContent = 'Date,Tenant,Property,Type,Amount,Status,Payment Date\n';
        payments.forEach((p) => {
          const tenant = p.tenant ? `${p.tenant.firstName} ${p.tenant.lastName}` : '';
          const property = p.property?.name || '';
          const dueDate = p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '';
          const paymentDate = p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '';
          csvContent += `"${dueDate}","${tenant}","${property}","${p.paymentType}",${Number(p.amount)},"${p.status}","${paymentDate}"\n`;
        });
        filename = `tenant-payments-${year}.csv`;
        break;
      }

      case 'maintenance-costs': {
        const maintenance = await prisma.maintenanceRequest.findMany({
          where: {
            userId: session.user.id,
            createdAt: { gte: yearStart, lte: yearEnd },
            ...(propertyId && propertyId !== 'all' ? { propertyId } : {}),
          },
          include: {
            property: { select: { name: true } },
            expenses: { select: { amount: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        csvContent = 'Date,Property,Category,Title,Status,Estimated Cost,Actual Cost\n';
        maintenance.forEach((m) => {
          const date = new Date(m.createdAt).toLocaleDateString();
          const property = m.property?.name || '';
          const expenseCost = m.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
          const actualCost = expenseCost || Number(m.actualCost || 0);
          csvContent += `"${date}","${property}","${m.category}","${m.title}","${m.status}",${Number(m.estimatedCost || 0)},${actualCost}\n`;
        });
        filename = `maintenance-costs-${year}.csv`;
        break;
      }

      case 'cash-flow': {
        const payments = await prisma.payment.findMany({
          where: {
            userId: session.user.id,
            status: 'PAID',
            paymentDate: { gte: yearStart, lte: yearEnd },
            ...(propertyId && propertyId !== 'all' ? { propertyId } : {}),
          },
          select: { paymentDate: true, amount: true, paymentType: true },
          orderBy: { paymentDate: 'desc' },
        });

        const expenses = await prisma.expense.findMany({
          where: {
            userId: session.user.id,
            status: 'PAID',
            paidDate: { gte: yearStart, lte: yearEnd },
            ...(propertyId && propertyId !== 'all' ? { propertyId } : {}),
          },
          select: { paidDate: true, amount: true, category: true, title: true },
          orderBy: { paidDate: 'desc' },
        });

        csvContent = 'Date,Type,Description,Inflow,Outflow\n';

        // Combine and sort by date
        const transactions = [
          ...payments.map((p) => ({
            date: new Date(p.paymentDate!),
            type: 'Income',
            description: p.paymentType,
            inflow: Number(p.amount),
            outflow: 0,
          })),
          ...expenses.map((e) => ({
            date: new Date(e.paidDate!),
            type: 'Expense',
            description: `${e.category} - ${e.title}`,
            inflow: 0,
            outflow: Number(e.amount),
          })),
        ].sort((a, b) => b.date.getTime() - a.date.getTime());

        transactions.forEach((t) => {
          csvContent += `"${t.date.toLocaleDateString()}","${t.type}","${t.description}",${t.inflow},${t.outflow}\n`;
        });
        filename = `cash-flow-${year}.csv`;
        break;
      }

      case 'aging-receivables': {
        const payments = await prisma.payment.findMany({
          where: {
            userId: session.user.id,
            status: { in: ['PENDING', 'OVERDUE'] },
            ...(propertyId && propertyId !== 'all' ? { propertyId } : {}),
          },
          include: {
            tenant: { select: { firstName: true, lastName: true, email: true } },
            property: { select: { name: true } },
          },
          orderBy: { dueDate: 'asc' },
        });

        const today = new Date();
        csvContent = 'Tenant,Property,Type,Due Date,Amount,Days Overdue,Status\n';
        payments.forEach((p) => {
          const tenant = p.tenant ? `${p.tenant.firstName} ${p.tenant.lastName}` : '';
          const property = p.property?.name || '';
          const dueDate = p.dueDate ? new Date(p.dueDate) : today;
          const daysOverdue = Math.max(
            0,
            Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          );
          csvContent += `"${tenant}","${property}","${p.paymentType}","${dueDate.toLocaleDateString()}",${Number(p.amount)},${daysOverdue},"${p.status}"\n`;
        });
        filename = `aging-receivables.csv`;
        break;
      }

      case 'lease-expiration': {
        const leases = await prisma.propertyTenant.findMany({
          where: {
            userId: session.user.id,
            isActive: true,
            leaseEndDate: { not: null },
            ...(propertyId && propertyId !== 'all' ? { propertyId } : {}),
          },
          include: {
            tenant: { select: { firstName: true, lastName: true, email: true } },
            property: { select: { name: true, address: true } },
          },
          orderBy: { leaseEndDate: 'asc' },
        });

        const today = new Date();
        csvContent =
          'Tenant,Property,Address,Lease Start,Lease End,Monthly Rent,Days Until Expiry\n';
        leases.forEach((l) => {
          const tenant = l.tenant ? `${l.tenant.firstName} ${l.tenant.lastName}` : '';
          const property = l.property?.name || '';
          const address = l.property?.address || '';
          const leaseStart = new Date(l.leaseStartDate).toLocaleDateString();
          const leaseEnd = l.leaseEndDate ? new Date(l.leaseEndDate).toLocaleDateString() : '';
          const daysUntilExpiry = l.leaseEndDate
            ? Math.floor(
                (new Date(l.leaseEndDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              )
            : '';
          csvContent += `"${tenant}","${property}","${address}","${leaseStart}","${leaseEnd}",${Number(l.monthlyRent)},${daysUntilExpiry}\n`;
        });
        filename = `lease-expiration.csv`;
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    // Return as downloadable CSV
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 });
  }
}
