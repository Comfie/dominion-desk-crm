import { sendEmail } from '@/lib/email';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export class MessagingService {
  async sendEmail(options: SendEmailOptions): Promise<void> {
    await sendEmail({
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }
}

export const messagingService = new MessagingService();
