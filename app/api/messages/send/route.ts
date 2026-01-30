import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';
import { logAudit } from '@/lib/shared/audit';
import { sendEmail, emailTemplates } from '@/lib/email';
import { threadRepository } from '@/lib/features/messaging/repositories/thread.repository';

// POST /api/messages/send - Send a message (email/SMS)
export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const data = await request.json();

    // Validate required fields
    if (!data.messageType) {
      return NextResponse.json({ error: 'Message type is required' }, { status: 400 });
    }

    if (data.messageType === 'EMAIL' && !data.recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email is required for email messages' },
        { status: 400 }
      );
    }

    if ((data.messageType === 'SMS' || data.messageType === 'WHATSAPP') && !data.recipientPhone) {
      return NextResponse.json(
        { error: 'Recipient phone is required for SMS/WhatsApp messages' },
        { status: 400 }
      );
    }

    let emailContent: { subject: string; html: string; text: string };
    let recipientName = data.recipientName || 'Guest';

    // Use template if specified, otherwise use custom content
    if (data.template) {
      switch (data.template) {
        case 'bookingConfirmation':
          emailContent = emailTemplates.bookingConfirmation({
            guestName: data.templateData.guestName || recipientName,
            propertyName: data.templateData.propertyName,
            checkIn: data.templateData.checkIn,
            checkOut: data.templateData.checkOut,
            totalAmount: data.templateData.totalAmount,
            address: data.templateData.address,
          });
          break;
        case 'checkInReminder':
          emailContent = emailTemplates.checkInReminder({
            guestName: data.templateData.guestName || recipientName,
            propertyName: data.templateData.propertyName,
            checkIn: data.templateData.checkIn,
            address: data.templateData.address,
            instructions: data.templateData.instructions,
          });
          break;
        case 'paymentReminder':
          emailContent = emailTemplates.paymentReminder({
            recipientName: data.templateData.recipientName || recipientName,
            amount: data.templateData.amount,
            dueDate: data.templateData.dueDate,
            propertyName: data.templateData.propertyName,
            paymentType: data.templateData.paymentType,
          });
          break;
        case 'maintenanceUpdate':
          emailContent = emailTemplates.maintenanceUpdate({
            recipientName: data.templateData.recipientName || recipientName,
            title: data.templateData.title,
            status: data.templateData.status,
            description: data.templateData.description,
            scheduledDate: data.templateData.scheduledDate,
          });
          break;
        default:
          emailContent = emailTemplates.generic({
            recipientName,
            subject: data.subject || 'Message from Property Management',
            body: data.message,
          });
      }
    } else {
      // Custom message
      if (!data.subject || !data.message) {
        return NextResponse.json(
          { error: 'Subject and message are required for custom emails' },
          { status: 400 }
        );
      }
      emailContent = emailTemplates.generic({
        recipientName,
        subject: data.subject,
        body: data.message,
      });
    }

    // Resolve or create a thread (Message.threadId must reference MessageThread)
    let threadId: string | null = data.threadId || null;
    if (threadId) {
      const existingThread = await threadRepository.findById(threadId, session.user.organizationId);
      if (!existingThread) {
        return NextResponse.json({ error: 'Message thread not found' }, { status: 404 });
      }
    } else {
      const participantName =
        data.recipientName || data.recipientEmail || data.recipientPhone || 'Recipient';
      const initialMessage = data.message || emailContent.text;
      const thread = await threadRepository.create(session.user.organizationId, {
        participantName,
        participantEmail: data.recipientEmail,
        participantPhone: data.recipientPhone,
        subject: emailContent.subject,
        bookingId: data.bookingId || undefined,
        tenantId: data.tenantId || undefined,
        initialMessage,
      });
      threadId = thread.id;
    }

    // Send the email
    const emailResult =
      data.messageType === 'EMAIL'
        ? await sendEmail({
            to: data.recipientEmail,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
            replyTo: data.replyTo,
          })
        : { success: false, error: 'Only email delivery is currently supported.' };

    // Create message record
    const message = await prisma.message.create({
      data: {
        userId: session.user.organizationId,
        bookingId: data.bookingId || null,
        tenantId: data.tenantId || null,
        subject: emailContent.subject,
        message: data.message || emailContent.text,
        messageType: data.messageType,
        direction: 'OUTBOUND',
        recipientEmail: data.recipientEmail,
        recipientPhone: data.recipientPhone || null,
        status: emailResult.success ? 'SENT' : 'FAILED',
        sentAt: emailResult.success ? new Date() : null,
        threadId: threadId || null,
        replyTo: data.replyToMessageId || null,
        attachments: data.attachments ? data.attachments : Prisma.JsonNull,
      },
      include: {
        booking: {
          select: {
            id: true,
            guestName: true,
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
            email: true,
          },
        },
      },
    });

    if (threadId) {
      await threadRepository.updateLastMessage(threadId, data.message || emailContent.text);
    }

    // Audit log
    await logAudit(session, 'created', 'message', message.id, undefined, request);

    if (!emailResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to send email',
          message,
          details: emailResult.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message,
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    if (error instanceof Response) {
      return error;
    }
    return NextResponse.json(
      { error: 'Failed to send message', details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
