import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { getTenantBySessionEmail } from '@/lib/tenant-session';

/**
 * GET /api/tenant/payments
 * Get all payments for the logged-in tenant
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Check if user is a tenant
    if (session.user.role !== 'TENANT') {
      return NextResponse.json({ error: 'Unauthorized - Tenants only' }, { status: 403 });
    }

    // Find tenant record for this user
    const tenant = await getTenantBySessionEmail(session.user.email);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant record not found' }, { status: 404 });
    }

    // Get all payments for this tenant
    const payments = await prisma.payment.findMany({
      where: { tenantId: tenant.id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        dueDate: 'desc',
      },
    });

    // Map payments to include proof fields
    const paymentsWithProof = payments.map((payment) => ({
      ...payment,
      proofOfPaymentUrl: payment.proofOfPaymentUrl,
      proofOfPaymentName: payment.proofOfPaymentName,
      proofUploadedAt: payment.proofUploadedAt,
      proofNotes: payment.proofNotes,
      verifiedAt: payment.verifiedAt,
      verificationNotes: payment.verificationNotes,
    }));

    return NextResponse.json({
      payments: paymentsWithProof,
      tenant: {
        id: tenant.id,
        name: `${tenant.firstName} ${tenant.lastName}`,
        email: tenant.email,
      },
    });
  } catch (error) {
    console.error('Error fetching tenant payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}
