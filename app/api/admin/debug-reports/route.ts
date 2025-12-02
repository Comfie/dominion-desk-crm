import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/debug-reports
 * Debug endpoint to check payment and report data
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    // Get all PAID payments for the year
    const payments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        status: 'PAID',
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        booking: {
          select: {
            propertyId: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            properties: {
              where: { isActive: true },
              select: {
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    // Analyze each payment
    const analysis = payments.map((p) => {
      let propId = null;
      let propName = null;
      let source = 'none';

      if (p.property) {
        propId = p.property.id;
        propName = p.property.name;
        source = 'direct';
      } else if (p.booking?.property) {
        propId = p.booking.property.id;
        propName = p.booking.property.name;
        source = 'booking';
      } else if (p.tenant?.properties?.[0]?.property) {
        propId = p.tenant.properties[0].property.id;
        propName = p.tenant.properties[0].property.name;
        source = 'tenant';
      }

      return {
        reference: p.paymentReference,
        amount: p.amount.toString(),
        type: p.paymentType,
        date: p.paymentDate?.toISOString().split('T')[0],
        status: p.status,
        propertyId: p.propertyId,
        propertyName: propName,
        propertySource: source,
        tenantId: p.tenantId,
        tenantName: p.tenant ? `${p.tenant.firstName} ${p.tenant.lastName}` : null,
      };
    });

    // Group by property
    const byProperty: Record<string, { name: string; count: number; total: number }> = {};
    analysis.forEach((a) => {
      if (a.propertyName) {
        if (!byProperty[a.propertyName]) {
          byProperty[a.propertyName] = { name: a.propertyName, count: 0, total: 0 };
        }
        byProperty[a.propertyName].count++;
        byProperty[a.propertyName].total += parseFloat(a.amount);
      }
    });

    return NextResponse.json({
      year: parseInt(year),
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      byProperty,
      payments: analysis,
    });
  } catch (error) {
    console.error('Error debugging reports:', error);
    return NextResponse.json({ error: 'Failed to debug reports' }, { status: 500 });
  }
}
