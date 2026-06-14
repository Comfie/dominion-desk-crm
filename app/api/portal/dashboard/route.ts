import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getTenantForPortalSession } from '@/lib/tenant-session';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a tenant account
    if (session.user.accountType !== 'TENANT') {
      return NextResponse.json(
        { error: 'Access denied - tenant account required' },
        { status: 403 }
      );
    }

    const tenantProfile = await getTenantForPortalSession(session.user.id, session.user.email);

    if (!tenantProfile) {
      return NextResponse.json({ error: 'No tenant record found for this email' }, { status: 404 });
    }

    // Find tenant record matching user's email
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantProfile.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        userId: true,
        nextPaymentDue: true,
        properties: {
          where: { isActive: true },
          select: {
            propertyId: true,
            leaseStartDate: true,
            leaseEndDate: true,
            monthlyRent: true,
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'No tenant record found for this email' }, { status: 404 });
    }

    // Get the active property assignment
    const activeProperty = tenant.properties[0];

    // Get maintenance requests for this tenant
    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get recent payments for this tenant
    const recentPayments = await prisma.payment.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        dueDate: true,
        status: true,
        paymentReference: true,
        paymentType: true,
      },
      orderBy: { paymentDate: 'desc' },
      take: 10,
    });

    // Get due and overdue payments
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const duePayments = await prisma.payment.findMany({
      where: {
        tenantId: tenant.id,
        status: {
          in: ['PENDING', 'OVERDUE', 'PENDING_VERIFICATION'],
        },
        dueDate: {
          lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // Due within next 7 days
        },
      },
      select: {
        id: true,
        amount: true,
        dueDate: true,
        status: true,
        paymentReference: true,
        paymentType: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    const overduePayments = await prisma.payment.findMany({
      where: {
        tenantId: tenant.id,
        status: 'OVERDUE',
      },
      select: {
        id: true,
        amount: true,
        dueDate: true,
        status: true,
        paymentReference: true,
        paymentType: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        email: tenant.email,
        phone: tenant.phone,
        property: activeProperty
          ? {
              id: activeProperty.property.id,
              name: activeProperty.property.name,
              address: activeProperty.property.address,
              city: activeProperty.property.city,
            }
          : null,
        leaseStart: activeProperty ? activeProperty.leaseStartDate.toISOString() : null,
        leaseEnd: activeProperty?.leaseEndDate ? activeProperty.leaseEndDate.toISOString() : null,
        rentAmount: activeProperty ? Number(activeProperty.monthlyRent) : null,
        nextPaymentDue: tenant.nextPaymentDue ? tenant.nextPaymentDue.toISOString() : null,
      },
      maintenanceRequests,
      recentPayments,
      duePayments,
      overduePayments,
    });
  } catch (error) {
    console.error('Tenant portal dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
