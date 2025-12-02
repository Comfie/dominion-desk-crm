import { MessageType } from '@prisma/client';
import { sendEmail } from '@/lib/email';

interface DeliveryMessage {
  type: MessageType;
  recipient: string;
  subject?: string;
  body: string;
}

export class DeliveryProviderService {
  /**
   * Send message via appropriate channel
   */
  async send(message: DeliveryMessage): Promise<void> {
    switch (message.type) {
      case 'EMAIL':
        return this.sendEmail(message);
      case 'SMS':
        return this.sendSMS(message);
      case 'WHATSAPP':
        return this.sendWhatsApp(message);
      case 'IN_APP':
        // IN_APP messages are handled by creating Message records
        return Promise.resolve();
      default:
        throw new Error(`Unsupported message type: ${message.type}`);
    }
  }

  private async sendEmail(message: DeliveryMessage): Promise<void> {
    await sendEmail({
      to: message.recipient,
      subject: message.subject || 'Message from Property Management',
      html: message.body,
    });
  }

  private async sendSMS(message: DeliveryMessage): Promise<void> {
    // TODO: Integrate with Twilio or similar SMS provider
    // For now, we'll just log (production will need actual integration)
    if (process.env.NODE_ENV === 'development') {
      console.log('SMS would be sent:', {
        to: message.recipient,
        body: message.body,
      });
      return;
    }

    // Production implementation:
    // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await twilio.messages.create({
    //   body: message.body,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: message.recipient,
    // });

    throw new Error('SMS provider not configured');
  }

  private async sendWhatsApp(message: DeliveryMessage): Promise<void> {
    // TODO: Integrate with WhatsApp Business API
    if (process.env.NODE_ENV === 'development') {
      console.log('WhatsApp would be sent:', {
        to: message.recipient,
        body: message.body,
      });
      return;
    }

    throw new Error('WhatsApp provider not configured');
  }
}

export const deliveryProviderService = new DeliveryProviderService();
