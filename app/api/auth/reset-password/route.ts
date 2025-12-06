import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/db';
import { sendEmail, emailTemplates } from '@/lib/email';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Find the password reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        // We don't have a relation to User in the model, so we'll query separately
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset token.' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      // Delete the expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return NextResponse.json(
        { error: 'This password reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Get the user
    const user = await prisma.user.findUnique({
      where: { id: resetToken.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User account not found or inactive.' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the used token (one-time use)
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    // Send confirmation email (optional but good practice)
    const emailTemplate = emailTemplates.passwordResetConfirmation({
      recipientName: `${user.firstName} ${user.lastName}`,
    });

    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return NextResponse.json({
      success: true,
      message:
        'Your password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'An error occurred while resetting your password. Please try again.' },
      { status: 500 }
    );
  }
}
