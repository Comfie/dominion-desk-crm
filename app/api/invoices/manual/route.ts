import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PaymentStatus, PaymentType } from '@prisma/client';
import { invoiceService } from '@/lib/features/payments/services/invoice.service';
import { messagingService } from '@/lib/features/messaging/services/messaging.service';
import { logger } from '@/lib/shared/logger';
import { handleApiError } from '@/lib/shared/errors';

/**
 * POST /api/invoices/manual
 * Create a manual invoice for a tenant
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const {
      tenantId,
      propertyId,
      dueDate,
      lineItems, // Array of { description, amount, type }
      notes,
      sendEmail = true,
    } = body;

    // Validation
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    if (!dueDate) {
      return NextResponse.json({ error: 'Due date is required' }, { status: 400 });
    }

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 });
    }

    // Verify tenant belongs to user
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        userId,
      },
      include: {
        properties: {
          where: {
            propertyId,
            isActive: true,
          },
          include: {
            property: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Calculate total amount from line items
    const totalAmount = lineItems.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'Total amount must be greater than 0' }, { status: 400 });
    }

    // Determine primary payment type (use first line item type or default to OTHER)
    const primaryType = lineItems[0]?.type || PaymentType.OTHER;

    // Generate payment reference and invoice number
    const paymentReference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const invoiceNumber = `INV-MANUAL-${Date.now()}-${tenantId.substring(0, 8)}`;

    // Create line items description
    const lineItemsDescription = lineItems
      .map((item: any) => `${item.description}: R${Number(item.amount).toFixed(2)}`)
      .join('\n');

    const description = `Manual Invoice\n${lineItemsDescription}${notes ? '\n\nNotes: ' + notes : ''}`;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        tenantId,
        propertyId,
        paymentReference,
        paymentType: primaryType,
        amount: totalAmount,
        currency: 'ZAR',
        dueDate: new Date(dueDate),
        status: PaymentStatus.PENDING,
        invoiceNumber,
        description,
        notes,
      },
      include: {
        tenant: true,
        property: true,
        user: true,
      },
    });

    logger.info('Manual invoice created', {
      paymentId: payment.id,
      userId,
      tenantId,
      propertyId,
      amount: totalAmount,
    });

    // Generate invoice HTML
    const invoiceHTML = await invoiceService.generateInvoiceHTML(payment);

    // Send email if requested
    if (sendEmail && tenant.email) {
      try {
        await messagingService.sendEmail({
          to: tenant.email,
          subject: `Invoice ${invoiceNumber} - ${property.name}`,
          html: invoiceHTML,
          text: `You have received a new invoice. Please log in to your tenant portal to view and pay.`,
          from: session.user.email || undefined,
        });

        logger.info('Invoice email sent', {
          paymentId: payment.id,
          tenantEmail: tenant.email,
        });
      } catch (emailError) {
        logger.error('Failed to send invoice email', {
          error: emailError,
          paymentId: payment.id,
        });
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        invoiceNumber: payment.invoiceNumber,
        amount: Number(payment.amount),
        dueDate: payment.dueDate,
        status: payment.status,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
