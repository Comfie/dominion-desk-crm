import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  propertyCount: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  requestType: z.enum(['demo', 'trial', 'pricing', 'support', 'other']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    const requestTypeLabels = {
      demo: 'Demo Request',
      trial: 'Free Trial',
      pricing: 'Pricing Inquiry',
      support: 'Technical Support',
      other: 'General Inquiry',
    };

    // Email to admin
    const adminEmailResult = await sendEmail({
      to: 'comfynyatsine@gmail.com',
      subject: `New Contact Form: ${requestTypeLabels[validatedData.requestType]} - ${validatedData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">New Contact Form Submission</h1>
          </div>

          <div style="padding: 30px; background-color: #f8fafc;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #0284c7; margin-top: 0;">Contact Details</h2>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <strong style="color: #475569;">Request Type:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">
                    ${requestTypeLabels[validatedData.requestType]}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <strong style="color: #475569;">Name:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">
                    ${validatedData.name}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <strong style="color: #475569;">Email:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <a href="mailto:${validatedData.email}" style="color: #0284c7; text-decoration: none;">
                      ${validatedData.email}
                    </a>
                  </td>
                </tr>
                ${
                  validatedData.phone
                    ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <strong style="color: #475569;">Phone:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">
                    ${validatedData.phone}
                  </td>
                </tr>
                `
                    : ''
                }
                ${
                  validatedData.company
                    ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <strong style="color: #475569;">Company:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">
                    ${validatedData.company}
                  </td>
                </tr>
                `
                    : ''
                }
                ${
                  validatedData.propertyCount
                    ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                    <strong style="color: #475569;">Properties:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">
                    ${validatedData.propertyCount}
                  </td>
                </tr>
                `
                    : ''
                }
              </table>

              <div style="margin-top: 24px;">
                <h3 style="color: #0284c7; margin-bottom: 12px;">Message:</h3>
                <div style="background: #f1f5f9; padding: 16px; border-radius: 6px; color: #334155; line-height: 1.6;">
                  ${validatedData.message.replace(/\n/g, '<br>')}
                </div>
              </div>
            </div>
          </div>

          <div style="padding: 20px; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">This email was sent from the DominionDesk contact form</p>
            <p style="margin: 8px 0 0 0;">Respond directly to <a href="mailto:${validatedData.email}" style="color: #0284c7;">${validatedData.email}</a></p>
          </div>
        </div>
      `,
    });

    if (!adminEmailResult.success) {
      throw new Error(adminEmailResult.error);
    }

    // Send confirmation email to the user
    const confirmationResult = await sendEmail({
      to: validatedData.email,
      subject: 'Thank you for contacting DominionDesk',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Thank You for Contacting Us</h1>
          </div>

          <div style="padding: 30px; background-color: #f8fafc;">
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; color: #334155; line-height: 1.6;">Hi ${validatedData.name},</p>

              <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                Thank you for reaching out to DominionDesk! We've received your message and one of our team members will get back to you within 24 hours.
              </p>

              <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #075985; font-weight: 600;">Your request type: ${requestTypeLabels[validatedData.requestType]}</p>
              </div>

              <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                In the meantime, feel free to explore our platform or check out our documentation.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}"
                   style="display: inline-block; background: #0284c7; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Visit DominionDesk
                </a>
              </div>

              <p style="font-size: 16px; color: #334155; line-height: 1.6;">
                Best regards,<br>
                <strong>The DominionDesk Team</strong>
              </p>
            </div>
          </div>

          <div style="padding: 20px; text-align: center; color: #64748b; font-size: 14px;">
            <p style="margin: 0;">This is an automated response. Please do not reply to this email.</p>
            <p style="margin: 8px 0 0 0;">If you need immediate assistance, email us at comfynyatsine@gmail.com</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ message: 'Contact form submitted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Contact form error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    );
  }
}
