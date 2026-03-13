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
          className="rounded-lg px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: 'hsl(217 91% 60%)', color: 'white' }}
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
              <p className="text-center text-sm" style={{ color: 'hsl(210 15% 65%)' }}>
                We&apos;ll be in touch shortly with your beta access details.
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
                className="w-full rounded-xl px-4 py-3 text-white placeholder-gray-500 transition-all outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'hsl(215 25% 15%)',
                  border: '1px solid hsl(215 20% 25%)',
                }}
              />
              <input
                type="email"
                placeholder="Your email address"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl px-4 py-3 text-white placeholder-gray-500 transition-all outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: 'hsl(215 25% 15%)',
                  border: '1px solid hsl(215 20% 25%)',
                }}
              />
              {errorMsg && <p className="text-left text-sm text-red-400">{errorMsg}</p>}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
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
