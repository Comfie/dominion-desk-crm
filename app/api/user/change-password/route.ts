import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { validatePasswordStrength } from '@/lib/password';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: validation.errors },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear first login flags
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isFirstLogin: false,
        requirePasswordChange: false,
      },
    });

    // Send confirmation email
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
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
