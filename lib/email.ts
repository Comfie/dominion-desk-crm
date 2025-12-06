import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender email
const DEFAULT_FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@dominiondesk.com';

interface EmailOptions {
  to: string | string[];
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
    const fromAddress = options.from || DEFAULT_FROM_EMAIL;

    // Prepare Resend email options
    const emailPayload: any = {
      from: 'DominionDesk <noreply@dominiondesk.com>',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    };

    // Add optional fields
    if (options.html) emailPayload.html = options.html;
    if (options.text) emailPayload.text = options.text;
    if (options.replyTo) emailPayload.replyTo = options.replyTo;
    if (options.attachments) emailPayload.attachments = options.attachments;

    // Resend API call
    const { data, error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error('Error sending email via Resend:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: data?.id,
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

  passwordReset: (data: { recipientName: string; resetUrl: string; expiresInMinutes: number }) => ({
    subject: 'Reset Your Password - DominionDesk',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Dear ${data.recipientName},</p>
        <p>We received a request to reset your password for your DominionDesk account.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 15px 0;">Click the button below to reset your password:</p>
          <div style="text-align: center;">
            <a href="${data.resetUrl}" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Reset Password
            </a>
          </div>
        </div>
        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <p style="margin: 0; font-size: 14px;"><strong>⚠️ Important:</strong></p>
          <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
            <li>This link will expire in <strong>${data.expiresInMinutes} minutes</strong></li>
            <li>The link can only be used once</li>
            <li>If you didn't request this, please ignore this email</li>
          </ul>
        </div>
        <p style="font-size: 14px; color: #666;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="font-size: 13px; color: #2563eb; word-break: break-all;">
          ${data.resetUrl}
        </p>
        <p style="margin-top: 30px;">Best regards,<br>DominionDesk Team</p>
      </div>
    `,
    text: `
Password Reset Request

Dear ${data.recipientName},

We received a request to reset your password for your DominionDesk account.

Click the link below to reset your password:
${data.resetUrl}

IMPORTANT:
- This link will expire in ${data.expiresInMinutes} minutes
- The link can only be used once
- If you didn't request this, please ignore this email

Best regards,
DominionDesk Team
    `.trim(),
  }),

  passwordResetConfirmation: (data: { recipientName: string }) => ({
    subject: 'Your Password Has Been Reset - DominionDesk',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Successful</h2>
        <p>Dear ${data.recipientName},</p>
        <p>Your password has been successfully reset.</p>
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
          <p style="margin: 0; font-size: 14px;">
            ✅ You can now log in to your account with your new password.
          </p>
        </div>
        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <p style="margin: 0; font-size: 14px;"><strong>⚠️ Security Notice:</strong></p>
          <p style="margin: 10px 0 0 0; font-size: 14px;">
            If you didn't make this change, please contact support immediately as your account may be compromised.
          </p>
        </div>
        <p style="margin-top: 30px;">Best regards,<br>DominionDesk Team</p>
      </div>
    `,
    text: `
Password Reset Successful

Dear ${data.recipientName},

Your password has been successfully reset.

You can now log in to your account with your new password.

SECURITY NOTICE:
If you didn't make this change, please contact support immediately as your account may be compromised.

Best regards,
DominionDesk Team
    `.trim(),
  }),

  newUserAccount: (data: {
    recipientName: string;
    email: string;
    password: string;
    loginUrl: string;
  }) => ({
    subject: 'Welcome to DominionDesk - Your Account Has Been Created',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to DominionDesk!</h2>
        <p>Dear ${data.recipientName},</p>
        <p>An account has been created for you on DominionDesk. You can now log in and start managing your properties.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Your Login Credentials:</strong></p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
          <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e0e0e0; padding: 2px 8px; border-radius: 4px; font-size: 14px;">${data.password}</code></p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.loginUrl}" 
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Log In Now
          </a>
        </div>
        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <p style="margin: 0; font-size: 14px;"><strong>🔒 Important Security Notice:</strong></p>
          <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
            <li>You will be required to change your password on first login</li>
            <li>Please choose a strong, unique password</li>
            <li>Do not share your credentials with anyone</li>
          </ul>
        </div>
        <p style="font-size: 14px; color: #666;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="font-size: 13px; color: #2563eb; word-break: break-all;">
          ${data.loginUrl}
        </p>
        <p style="margin-top: 30px;">Best regards,<br>DominionDesk Team</p>
      </div>
    `,
    text: `
Welcome to DominionDesk!

Dear ${data.recipientName},

An account has been created for you on DominionDesk. You can now log in and start managing your properties.

Your Login Credentials:
Email: ${data.email}
Temporary Password: ${data.password}

Login URL: ${data.loginUrl}

IMPORTANT SECURITY NOTICE:
- You will be required to change your password on first login
- Please choose a strong, unique password
- Do not share your credentials with anyone

Best regards,
DominionDesk Team
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
    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return false;
    }

    // Resend doesn't have a verify method, so we just check if the API key exists
    // In production, you could send a test email to verify
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}
