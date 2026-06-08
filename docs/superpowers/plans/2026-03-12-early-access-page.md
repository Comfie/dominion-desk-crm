# Early Access Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the production landing page (`main` branch) with a high-converting early access / beta application page that captures signups via Resend — no database required.

**Architecture:** Single-page hero with inline application form. Form POSTs to `/api/waitlist` which uses the existing `lib/email.ts` `sendEmail` helper to notify the owner. No DB calls anywhere.

**Tech Stack:** Next.js 16, Tailwind CSS v4, Resend (via existing `lib/email.ts`), Lucide React, Zod

---

## Chunk 1: Environment + API Route

### Task 1: Add OWNER_EMAIL to env schema

**Files:**

- Modify: `lib/config/env.ts`
- Modify: `.env.example`
- Modify: `.env.local` (add placeholder)

- [ ] **Step 1: Add OWNER_EMAIL to env schema**

In `lib/config/env.ts`, add to the `envSchema` object after `FROM_EMAIL`:

```typescript
OWNER_EMAIL: z.string().email().optional(),
```

- [ ] **Step 2: Add to .env.example**

In `.env.example`, add after `FROM_EMAIL`:

```
OWNER_EMAIL="your-email@gmail.com"
```

- [ ] **Step 3: Add to .env.local**

In `.env.local`, add:

```
OWNER_EMAIL="comfynyatsine@gmail.com"
```

- [ ] **Step 4: Commit**

```bash
git add lib/config/env.ts .env.example
git commit -m "feat: add OWNER_EMAIL to env schema for waitlist notifications"
```

---

### Task 2: Create the waitlist API route

**Files:**

- Create: `app/api/waitlist/route.ts`

Pattern: follow `app/api/contact/route.ts` — Zod validation, sendEmail, in-memory rate limiting.

- [ ] **Step 1: Create `app/api/waitlist/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email';
import { headers } from 'next/headers';

const waitlistSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5;
const rateLimitStore = new Map<string, { count: number; firstRequest: number }>();

function getClientIp(headersList: Headers): string {
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return headersList.get('x-real-ip') || 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record || now - record.firstRequest > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, firstRequest: now });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) return false;
  record.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = waitlistSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { name, email } = result.data;
    const ownerEmail = process.env.OWNER_EMAIL || process.env.FROM_EMAIL;

    if (ownerEmail) {
      await sendEmail({
        to: ownerEmail,
        subject: 'New Beta Application — DominionDesk',
        html: `
          <h2>New Beta Application</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Applied at:</strong> ${new Date().toISOString()}</p>
        `,
        text: `New Beta Application\nName: ${name}\nEmail: ${email}\nApplied at: ${new Date().toISOString()}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify the route works locally**

Start dev server and run:

```bash
curl -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'
```

Expected: `{"success":true}`

- [ ] **Step 3: Commit**

```bash
git add app/api/waitlist/route.ts
git commit -m "feat: add waitlist api route with resend notification"
```

---

## Chunk 2: Early Access Page

### Task 3: Replace app/page.tsx with early access page

**Files:**

- Modify: `app/page.tsx` (full replacement)

The page uses only Tailwind classes, Lucide icons, and a client component for the form. No imports from `lib/db` or any server-side data fetching.

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
import type { Metadata } from 'next';
import EarlyAccessPage from './_components/EarlyAccessPage';

export const metadata: Metadata = {
  title: 'DominionDesk — Early Access',
  description:
    'Apply for early access to DominionDesk — the property management platform built for South African landlords.',
};

export default function Page() {
  return <EarlyAccessPage />;
}
```

- [ ] **Step 2: Create `app/_components/EarlyAccessPage.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Building2, Bell, FileText, BarChart3, CheckCircle, Loader2 } from 'lucide-react';

export default function EarlyAccessPage() {
  const [form, setForm] = useState({ name: '', email: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong.');
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  const features = [
    {
      icon: Bell,
      title: 'Automated Rent Reminders',
      description: 'Stop chasing tenants. Automated reminders before and after due date.',
    },
    {
      icon: Building2,
      title: 'Tenant Portal & Payments',
      description: 'Tenants upload proof of payment. You get notified instantly.',
    },
    {
      icon: BarChart3,
      title: 'Financial Reports & Tax',
      description: 'Income, expenses, and tax-ready reports across all your properties.',
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(215 28% 10%)' }}>
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" style={{ color: 'hsl(217 91% 60%)' }} />
          <span className="text-lg font-bold tracking-tight text-white">DominionDesk</span>
        </div>
        <a
          href="#apply"
          className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
          style={{
            backgroundColor: 'hsl(217 91% 60%)',
            color: 'white',
          }}
        >
          Apply for Early Access
        </a>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
        <div
          className="mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: 'hsl(217 91% 60% / 0.15)',
            color: 'hsl(217 91% 60%)',
            border: '1px solid hsl(217 91% 60% / 0.3)',
          }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          Limited Beta Access Open
        </div>

        <h1
          className="mb-6 text-5xl font-bold tracking-tight md:text-7xl"
          style={{ color: 'hsl(210 20% 98%)' }}
        >
          Your Property.
          <br />
          <span style={{ color: 'hsl(217 91% 60%)' }}>Managed.</span>
        </h1>

        <p
          className="mx-auto mb-12 max-w-2xl text-lg md:text-xl"
          style={{ color: 'hsl(210 15% 65%)' }}
        >
          DominionDesk helps South African landlords, property managers, and Airbnb hosts automate
          rent collection, manage tenants, and stay on top of their finances — all in one place.
        </p>

        {/* Form */}
        <div id="apply" className="mx-auto max-w-md">
          {status === 'success' ? (
            <div
              className="flex flex-col items-center gap-3 rounded-2xl p-8"
              style={{ backgroundColor: 'hsl(215 25% 15%)' }}
            >
              <CheckCircle className="h-12 w-12" style={{ color: 'hsl(217 91% 60%)' }} />
              <h3 className="text-lg font-semibold text-white">Application received!</h3>
              <p style={{ color: 'hsl(210 15% 65%)' }} className="text-center text-sm">
                We'll be in touch shortly with your beta access details.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Your name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl px-4 py-3 text-white placeholder-gray-500 transition-all outline-none focus:ring-2"
                style={{
                  backgroundColor: 'hsl(215 25% 15%)',
                  border: '1px solid hsl(215 20% 25%)',
                  // @ts-ignore
                  '--tw-ring-color': 'hsl(217 91% 60% / 0.5)',
                }}
              />
              <input
                type="email"
                placeholder="Your email address"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl px-4 py-3 text-white placeholder-gray-500 transition-all outline-none focus:ring-2"
                style={{
                  backgroundColor: 'hsl(215 25% 15%)',
                  border: '1px solid hsl(215 20% 25%)',
                }}
              />
              {errorMsg && <p className="text-left text-sm text-red-400">{errorMsg}</p>}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'hsl(217 91% 60%)' }}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Apply for Beta Access'
                )}
              </button>
            </form>
          )}

          <p className="mt-4 text-xs" style={{ color: 'hsl(210 15% 50%)' }}>
            Free during beta &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; Built for SA
            landlords
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-20" style={{ backgroundColor: 'hsl(215 25% 13%)' }}>
        <div className="mx-auto max-w-6xl px-6">
          <h2
            className="mb-12 text-center text-2xl font-semibold"
            style={{ color: 'hsl(210 20% 98%)' }}
          >
            Everything you need to manage your properties
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl p-6"
                style={{
                  backgroundColor: 'hsl(215 25% 15%)',
                  border: '1px solid hsl(215 20% 22%)',
                }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'hsl(217 91% 60% / 0.15)' }}
                >
                  <feature.icon className="h-5 w-5" style={{ color: 'hsl(217 91% 60%)' }} />
                </div>
                <h3 className="mb-2 font-semibold" style={{ color: 'hsl(210 20% 98%)' }}>
                  {feature.title}
                </h3>
                <p className="text-sm" style={{ color: 'hsl(210 15% 60%)' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8" style={{ borderTop: '1px solid hsl(215 20% 18%)' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" style={{ color: 'hsl(217 91% 60%)' }} />
            <span className="text-sm font-semibold text-white">DominionDesk</span>
            <span className="ml-2 text-xs" style={{ color: 'hsl(210 15% 45%)' }}>
              © {new Date().getFullYear()}
            </span>
          </div>
          <a
            href="mailto:support@dominiondesk.com"
            className="text-sm transition-colors hover:text-white"
            style={{ color: 'hsl(210 15% 55%)' }}
          >
            support@dominiondesk.com
          </a>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Verify locally**

Run `npm run dev`, visit `http://localhost:3001` (or 3000). Check:

- Page renders with dark navy background
- Form fields and submit button visible
- Submitting the form shows loading state then success state

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/_components/EarlyAccessPage.tsx
git commit -m "feat: add early access page for production domain"
```

---

## Chunk 3: Deploy

### Task 4: Push and create PR to main

- [ ] **Step 1: Add OWNER_EMAIL to Vercel production env vars**

In Vercel dashboard → Settings → Environment Variables → add:

- Key: `OWNER_EMAIL`
- Value: `comfynyatsine@gmail.com`
- Environment: Production

- [ ] **Step 2: Push branch and create PR**

```bash
git push origin feat/early-access-page
gh pr create \
  --title "feat: add early access page for production domain" \
  --body "Replaces the landing page on main with a lightweight early access / beta application page. No DB calls. Signups sent to owner via Resend." \
  --base main \
  --head feat/early-access-page
```

- [ ] **Step 3: Merge and verify**

After merging, visit https://dominiondesk.com and confirm the early access page loads. Submit a test application and verify the email arrives.
