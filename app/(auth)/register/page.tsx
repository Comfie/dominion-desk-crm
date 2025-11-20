'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, Lock, Eye, EyeOff, User, Phone, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
  ];

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          phone: data.phone,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Registration failed');
        return;
      }

      // Redirect to login with success message
      router.push('/login?registered=true');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <>
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground">
          Start your 14-day free trial. No credit card required.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <div className="relative">
              <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="firstName"
                placeholder="John"
                className="pl-10"
                {...register('firstName')}
              />
            </div>
            {errors.firstName && (
              <p className="text-destructive text-sm">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" placeholder="Doe" {...register('lastName')} />
            {errors.lastName && (
              <p className="text-destructive text-sm">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="pl-10"
              {...register('email')}
            />
          </div>
          {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <div className="relative">
            <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="phone"
              type="tel"
              placeholder="+27 82 123 4567"
              className="pl-10"
              {...register('phone')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
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

          {/* Password requirements */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {passwordRequirements.map((req) => (
              <div
                key={req.label}
                className={`flex items-center gap-1.5 text-xs ${
                  req.met ? 'text-green-600' : 'text-muted-foreground'
                }`}
              >
                <Check className={`h-3 w-3 ${req.met ? 'opacity-100' : 'opacity-30'}`} />
                {req.label}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Lock className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              className="pl-10"
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </div>
    </>
  );
}
