import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: string | Buffer;
    contentType?: string;
  }>;
}

export async function sendEmail(
  options: EmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const fromAddress = options.from || process.env.SMTP_FROM || 'noreply@property-crm.com';

    const info = await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

// Email templates
export const emailTemplates = {
  bookingConfirmation: (data: {
    guestName: string;
    propertyName: string;
    checkIn: string;
    checkOut: string;
    totalAmount: string;
    address?: string;
  }) => ({
    subject: `Booking Confirmation - ${data.propertyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Booking Confirmation</h2>
        <p>Dear ${data.guestName},</p>
        <p>Thank you for your booking! Here are your reservation details:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Property:</strong> ${data.propertyName}</p>
          ${data.address ? `<p><strong>Address:</strong> ${data.address}</p>` : ''}
          <p><strong>Check-in:</strong> ${data.checkIn}</p>
          <p><strong>Check-out:</strong> ${data.checkOut}</p>
          <p><strong>Total Amount:</strong> ${data.totalAmount}</p>
        </div>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Property Management Team</p>
      </div>
    `,
    text: `
Booking Confirmation

Dear ${data.guestName},

Thank you for your booking! Here are your reservation details:

Property: ${data.propertyName}
${data.address ? `Address: ${data.address}` : ''}
Check-in: ${data.checkIn}
Check-out: ${data.checkOut}
Total Amount: ${data.totalAmount}

If you have any questions, please don't hesitate to contact us.

Best regards,
Property Management Team
    `.trim(),
  }),

  checkInReminder: (data: {
    guestName: string;
    propertyName: string;
    checkIn: string;
    address?: string;
    instructions?: string;
  }) => ({
    subject: `Check-in Reminder - ${data.propertyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Check-in Reminder</h2>
        <p>Dear ${data.guestName},</p>
        <p>This is a reminder that your check-in is scheduled for <strong>${data.checkIn}</strong>.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Property:</strong> ${data.propertyName}</p>
          ${data.address ? `<p><strong>Address:</strong> ${data.address}</p>` : ''}
        </div>
        ${
          data.instructions
            ? `
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Check-in Instructions</h3>
          <p>${data.instructions}</p>
        </div>
        `
            : ''
        }
        <p>We look forward to hosting you!</p>
        <p>Best regards,<br>Property Management Team</p>
      </div>
    `,
    text: `
Check-in Reminder

Dear ${data.guestName},

This is a reminder that your check-in is scheduled for ${data.checkIn}.

Property: ${data.propertyName}
${data.address ? `Address: ${data.address}` : ''}

${data.instructions ? `Check-in Instructions:\n${data.instructions}` : ''}

We look forward to hosting you!

Best regards,
Property Management Team
    `.trim(),
  }),

  paymentReminder: (data: {
    recipientName: string;
    amount: string;
    dueDate: string;
    propertyName?: string;
    paymentType?: string;
  }) => ({
    subject: `Payment Reminder - ${data.amount} Due`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Payment Reminder</h2>
        <p>Dear ${data.recipientName},</p>
        <p>This is a friendly reminder that a payment is due.</p>
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Amount Due:</strong> ${data.amount}</p>
          <p><strong>Due Date:</strong> ${data.dueDate}</p>
          ${data.propertyName ? `<p><strong>Property:</strong> ${data.propertyName}</p>` : ''}
          ${data.paymentType ? `<p><strong>Payment Type:</strong> ${data.paymentType}</p>` : ''}
        </div>
        <p>Please ensure payment is made by the due date to avoid any late fees.</p>
        <p>If you have already made this payment, please disregard this notice.</p>
        <p>Best regards,<br>Property Management Team</p>
      </div>
    `,
    text: `
Payment Reminder

Dear ${data.recipientName},

This is a friendly reminder that a payment is due.

Amount Due: ${data.amount}
Due Date: ${data.dueDate}
${data.propertyName ? `Property: ${data.propertyName}` : ''}
${data.paymentType ? `Payment Type: ${data.paymentType}` : ''}

Please ensure payment is made by the due date to avoid any late fees.

If you have already made this payment, please disregard this notice.

Best regards,
Property Management Team
    `.trim(),
  }),

  maintenanceUpdate: (data: {
    recipientName: string;
    title: string;
    status: string;
    description?: string;
    scheduledDate?: string;
  }) => ({
    subject: `Maintenance Update - ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Maintenance Update</h2>
        <p>Dear ${data.recipientName},</p>
        <p>We wanted to update you on the status of your maintenance request.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Request:</strong> ${data.title}</p>
          <p><strong>Status:</strong> ${data.status}</p>
          ${data.description ? `<p><strong>Details:</strong> ${data.description}</p>` : ''}
          ${data.scheduledDate ? `<p><strong>Scheduled Date:</strong> ${data.scheduledDate}</p>` : ''}
        </div>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Property Management Team</p>
      </div>
    `,
    text: `
Maintenance Update

Dear ${data.recipientName},

We wanted to update you on the status of your maintenance request.

Request: ${data.title}
Status: ${data.status}
${data.description ? `Details: ${data.description}` : ''}
${data.scheduledDate ? `Scheduled Date: ${data.scheduledDate}` : ''}

If you have any questions, please don't hesitate to contact us.

Best regards,
Property Management Team
    `.trim(),
  }),

  generic: (data: { recipientName: string; subject: string; body: string }) => ({
    subject: data.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Dear ${data.recipientName},</p>
        <div style="white-space: pre-wrap;">${data.body}</div>
        <p style="margin-top: 30px;">Best regards,<br>Property Management Team</p>
      </div>
    `,
    text: `
Dear ${data.recipientName},

${data.body}

Best regards,
Property Management Team
    `.trim(),
  }),
};

// Verify email configuration
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}
