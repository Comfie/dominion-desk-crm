'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Check if token exists
  if (!token) {
    return (
      <>
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Invalid Reset Link</h1>
          <p className="text-muted-foreground">
            This password reset link is invalid. Please request a new password reset link.
          </p>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href="/forgot-password">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Request New Link
          </Link>
        </Button>
      </>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'An error occurred. Please try again.');
        return;
      }

      setIsSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  if (isSuccess) {
    return (
      <>
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Password Reset Successful</h1>
          <p className="text-muted-foreground">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <p className="text-muted-foreground text-sm">Redirecting you to login...</p>
        </div>

        <Button asChild className="w-full">
          <Link href="/login">Go to Login</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="text-muted-foreground">
          Enter your new password below. Make sure it&apos;s strong and secure.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your new password"
              className="pr-10 pl-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your new password"
              className="pr-10 pl-10"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Password Requirements */}
        <div className="bg-muted/50 rounded-lg border p-3 text-sm">
          <p className="mb-2 font-medium">Password Requirements:</p>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>• At least 8 characters long</li>
            <li>• Contains uppercase and lowercase letters</li>
            <li>• Contains at least one number</li>
            <li>• Contains at least one special character</li>
          </ul>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting password...
            </>
          ) : (
            'Reset Password'
          )}
        </Button>
      </form>

      <div className="text-center">
        <Link
          href="/login"
          className="text-primary inline-flex items-center text-sm font-medium hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
