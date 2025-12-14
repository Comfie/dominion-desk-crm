import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { getSubscriptionSettings } from '@/lib/services/system-settings.service';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Get dynamic subscription settings
    const settings = await getSubscriptionSettings();

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Calculate trial end date using dynamic settings
    const trialEndsAt = new Date(Date.now() + settings.trialDays * 24 * 60 * 60 * 1000);

    // Create user with dynamic trial settings
    const user = await prisma.user.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        password: hashedPassword,
        phone: validatedData.phone,
        // Use dynamic trial settings
        trialEndsAt,
        subscriptionStatus: 'TRIAL',
        propertyLimit: settings.trialPropertyLimit,
        // Set default billing configuration from system settings
        baseSubscriptionFee: settings.baseFee,
        percentageFee: settings.percentageFee,
        minPropertyFee: settings.minPropertyFee,
        maxPropertyFee: settings.maxPropertyFee,
        freePropertyCount: settings.freePropertyCount,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    return NextResponse.json({
      message: 'Account created successfully',
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
