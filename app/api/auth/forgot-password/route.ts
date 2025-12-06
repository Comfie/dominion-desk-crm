import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

import { prisma } from '@/lib/db';
import { sendEmail, emailTemplates } from '@/lib/email';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Rate limiting map: email -> last request timestamp
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MINUTES = 5;
const TOKEN_EXPIRY_HOURS = 1;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Check rate limiting
    const now = Date.now();
    const lastRequest = rateLimitMap.get(email);
    if (lastRequest && now - lastRequest < RATE_LIMIT_MINUTES * 60 * 1000) {
      const waitMinutes = Math.ceil((RATE_LIMIT_MINUTES * 60 * 1000 - (now - lastRequest)) / 60000);
      return NextResponse.json(
        { error: `Please wait ${waitMinutes} minute(s) before requesting another password reset.` },
        { status: 429 }
      );
    }

    // Update rate limit
    rateLimitMap.set(email, now);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    // SECURITY: Always return success to prevent user enumeration
    // Even if user doesn't exist, we return 200 OK
    if (!user || !user.isActive) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // Delete any existing password reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate a cryptographically secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiration time (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    // Store the token in database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Create password reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    // Send password reset email
    const emailTemplate = emailTemplates.passwordReset({
      recipientName: `${user.firstName} ${user.lastName}`,
      resetUrl,
      expiresInMinutes: TOKEN_EXPIRY_HOURS * 60,
    });

    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'An error occurred while processing your request. Please try again.' },
      { status: 500 }
    );
  }
}
