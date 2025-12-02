import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { paymentRepository } from '@/lib/features/payments/repositories/payment.repository';
import { invoiceService } from '@/lib/features/payments/services/invoice.service';

/**
 * GET /api/tenant/payments/[id]/invoice
 * Get invoice HTML for a payment
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();

    if (session.user.role !== 'TENANT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = await params;

    // Get payment and verify it belongs to this tenant
    const payment = await paymentRepository.findById(resolvedParams.id);

    if (!payment || payment.tenant?.email !== session.user.email) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Generate invoice HTML
    const invoiceHTML = invoiceService.generateInvoiceHTML(payment);

    // Return as HTML
    return new NextResponse(invoiceHTML, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
