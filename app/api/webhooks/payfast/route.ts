import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { validateWebhookData, getPayFastConfig } from '@/lib/services/payfast.service';
import {
  activateSubscription,
  handleFailedPayment,
  cancelSubscription,
} from '@/lib/services/subscription.service';
import {
  generateInvoice,
  findOrCreatePendingInvoice,
  markInvoicePaid,
} from '@/lib/services/billing.service';
import { logger } from '@/lib/shared/logger';

/**
 * POST /api/webhooks/payfast
 * PayFast ITN (Instant Transaction Notification) webhook handler
 * Receives payment status updates from PayFast servers
 *
 * Security:
 * - Verifies MD5 signature (timing-safe)
 * - Validates source IP against PayFast ranges
 * - Verifies payment amount matches expected
 */
export async function POST(req: NextRequest) {
  try {
    // Get client IP
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Parse form data
    const formData = await req.formData();
    const data: Record<string, string> = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    logger.info('PayFast webhook received', {
      clientIp,
      merchantReference: data.custom_str2,
      paymentStatus: data.payment_status,
      signature: data.signature,
    });

    // Extract key fields
    const signature = data.signature || '';
    const merchantReference = data.custom_str2;
    const userId = data.custom_str1;
    const paymentStatus = data.payment_status;
    const payfastPaymentId = data.pf_payment_id;
    const amountGross = parseFloat(data.amount_gross || '0');
    const amountFee = parseFloat(data.amount_fee || '0');
    const amountNet = parseFloat(data.amount_net || '0');

    if (!merchantReference || !userId) {
      logger.error('Missing required fields in PayFast webhook', { data });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get PayFast subscription to verify expected amount
    const payfastSub = await prisma.payFastSubscription.findUnique({
      where: { merchantReference },
      include: { user: true },
    });

    if (!payfastSub) {
      logger.error('PayFast subscription not found', { merchantReference });
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Validate webhook data (signature, IP, amount)
    const validation = validateWebhookData(data, signature, clientIp, Number(payfastSub.amount));

    // Log transaction
    const transaction = await prisma.payFastTransaction.create({
      data: {
        userId,
        payfastPaymentId,
        merchantReference,
        paymentStatus,
        amountGross,
        amountFee,
        amountNet,
        itnData: data,
        signatureVerified: validation.signatureVerified,
        ipVerified: validation.ipVerified,
        amountVerified: validation.amountVerified,
        processedAt: validation.valid ? new Date() : null,
        errorMessage: validation.valid ? null : validation.errors.join(', '),
      },
    });

    logger.info('PayFast transaction logged', {
      transactionId: transaction.id,
      valid: validation.valid,
      errors: validation.errors,
    });

    // If validation failed, log but still return 200 to PayFast
    if (!validation.valid) {
      logger.error('PayFast webhook validation failed', {
        merchantReference,
        errors: validation.errors,
        signatureVerified: validation.signatureVerified,
        ipVerified: validation.ipVerified,
        amountVerified: validation.amountVerified,
      });

      // Return 200 to PayFast to prevent retries, but don't process payment
      return NextResponse.json({
        status: 'received',
        message: 'Validation failed but acknowledged',
      });
    }

    // Handle payment status
    switch (paymentStatus) {
      case 'COMPLETE': {
        // Payment successful - activate subscription
        logger.info('Processing successful payment', { userId, merchantReference });

        // Activate subscription
        await activateSubscription(userId, {
          token: data.token,
          subscriptionId: data.subscription_id,
          merchantReference,
          amount: amountGross,
        });

        // Find or create invoice and mark as paid
        const invoice = await findOrCreatePendingInvoice(userId);
        await markInvoicePaid(invoice.id, payfastPaymentId);

        logger.info('Subscription activated successfully', {
          userId,
          merchantReference,
          invoiceId: invoice.id,
        });

        break;
      }

      case 'FAILED': {
        // Payment failed
        logger.warn('Payment failed', { userId, merchantReference });

        await handleFailedPayment(userId, `Payment failed: ${data.reason || 'Unknown reason'}`);

        break;
      }

      case 'CANCELLED': {
        // Payment cancelled by user
        logger.info('Payment cancelled', { userId, merchantReference });

        await cancelSubscription(userId, 'Payment cancelled by user', 'payfast_webhook');

        break;
      }

      case 'PENDING': {
        // Payment pending - no action needed yet
        logger.info('Payment pending', { userId, merchantReference });
        break;
      }

      default: {
        logger.warn('Unknown payment status', {
          paymentStatus,
          merchantReference,
        });
      }
    }

    // Always return 200 to PayFast to acknowledge receipt
    return NextResponse.json({
      status: 'success',
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    logger.error('PayFast webhook processing failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Still return 200 to prevent PayFast retries
    // Log the error for manual investigation
    return NextResponse.json({
      status: 'error',
      message: 'Internal error but acknowledged',
    });
  }
}

/**
 * GET /api/webhooks/payfast
 * Not used by PayFast, but useful for health checks
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'PayFast webhook endpoint is active',
  });
}
