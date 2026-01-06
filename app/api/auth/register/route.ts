import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { getSubscriptionSettings } from '@/lib/services/system-settings.service';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_SCORE_THRESHOLD = 0.5;

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
  recaptchaToken: z.string().min(1, 'reCAPTCHA verification required'),
});

// Verify reCAPTCHA token with Google
async function verifyRecaptcha(
  token: string
): Promise<{ success: boolean; score?: number; error?: string }> {
  if (!RECAPTCHA_SECRET_KEY) {
    console.error('RECAPTCHA_SECRET_KEY is not configured');
    return { success: false, error: 'reCAPTCHA not configured' };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json();

    if (!data.success) {
      return { success: false, error: 'reCAPTCHA verification failed' };
    }

    if (data.score < RECAPTCHA_SCORE_THRESHOLD) {
      return { success: false, score: data.score, error: 'Suspicious activity detected' };
    }

    return { success: true, score: data.score };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, error: 'Failed to verify reCAPTCHA' };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Verify reCAPTCHA token
    const recaptchaResult = await verifyRecaptcha(validatedData.recaptchaToken);
    if (!recaptchaResult.success) {
      console.warn('reCAPTCHA failed:', recaptchaResult.error, 'Score:', recaptchaResult.score);
      return NextResponse.json(
        { error: recaptchaResult.error || 'reCAPTCHA verification failed' },
        { status: 400 }
      );
    }

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
