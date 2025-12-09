import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { generateSecurePassword } from '@/lib/password';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(request: Request) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is super admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (currentUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Only super admins can create admin accounts.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, firstName, lastName } = body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    // Generate secure password
    const temporaryPassword = generateSecurePassword(12);

    // Hash password
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create admin user
    const newAdmin = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isFirstLogin: true,
        requirePasswordChange: true,
        isActive: true,
        emailVerified: false,
      },
    });

    // Send welcome email with credentials
    const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`;

    const emailTemplate = emailTemplates.newAdminAccount({
      recipientName: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      password: temporaryPassword,
      loginUrl,
    });

    const emailResult = await sendEmail({
      to: email.toLowerCase(),
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    if (!emailResult.success) {
      console.error('Failed to send welcome email:', emailResult.error);
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: newAdmin.id,
        email: newAdmin.email,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        role: newAdmin.role,
      },
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: 'Failed to create admin account' }, { status: 500 });
  }
}
