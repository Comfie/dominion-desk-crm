import { z } from 'zod';

/**
 * Environment variable validation schema
 * This ensures all required environment variables are present and valid at startup
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional(),

  // AWS S3
  // AWS_ACCESS_KEY_ID: z.string().min(16, 'AWS_ACCESS_KEY_ID is required'),
  // AWS_SECRET_ACCESS_KEY: z.string().min(32, 'AWS_SECRET_ACCESS_KEY is required'),
  // AWS_S3_BUCKET: z.string().min(3, 'AWS_S3_BUCKET is required'),
  // AWS_REGION: z.string().default('us-east-1'),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),

  // UploadThing
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),

  // Payment Gateways (Optional)
  STRIPE_SECRET_KEY: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),

  // Monitoring (Optional)
  SENTRY_DSN: z.string().url().optional(),

  // Redis (Optional - for caching)
  REDIS_URL: z.string().url().optional(),
});

/**
 * Validated environment variables
 * Use this instead of process.env to ensure type safety
 */
export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export { env };

/**
 * Check if specific optional features are configured
 */
export const features = {
  hasEmail: !!env.RESEND_API_KEY,
  hasUploadThing: !!(env.UPLOADTHING_SECRET && env.UPLOADTHING_APP_ID),
  hasStripe: !!env.STRIPE_SECRET_KEY,
  hasPaystack: !!env.PAYSTACK_SECRET_KEY,
  hasSentry: !!env.SENTRY_DSN,
  hasRedis: !!env.REDIS_URL,
} as const;
