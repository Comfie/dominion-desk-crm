import type { Metadata } from 'next';
import Link from 'next/link';
import { Play, ArrowRight, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'See DominionDesk in Action | DominionDesk',
  description:
    'Watch a quick walkthrough to see how South African landlords manage their portfolios with DominionDesk.',
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Minimal Nav */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <img src="/logos/logo-light.svg" alt="DominionDesk" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            See DominionDesk in Action
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600">
            Watch this quick walkthrough to see how South African landlords manage their portfolios,
            or book a personalised tour.
          </p>
        </div>

        {/* Video Placeholder */}
        {/* TODO: Replace with Loom or YouTube iframe */}
        <div className="relative mx-auto mb-12 aspect-video w-full overflow-hidden rounded-2xl bg-[#0A2D67] shadow-2xl">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-transform hover:scale-110">
              <Play className="ml-1 h-10 w-10 text-white" fill="white" />
            </div>
            <p className="text-sm font-medium text-white/60">Video walkthrough coming soon</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {/* Primary */}
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-amber-600 hover:shadow-xl sm:w-auto"
          >
            Start Your Free Trial
            <ArrowRight className="h-5 w-5" />
          </Link>

          {/* Secondary — swap href for Calendly link when ready */}
          {/* TODO: Replace mailto with a Calendly booking link when available */}
          <a
            href="mailto:support@dominiondesk.com?subject=Book%20a%20Walkthrough"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-slate-300 px-8 py-4 text-base font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 sm:w-auto"
          >
            <Calendar className="h-5 w-5" />
            Book a 15-Min Walkthrough
          </a>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          No sales pressure. Just a quick look at whether DominionDesk is right for you.
        </p>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-8 text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm">© {new Date().getFullYear()} DominionDesk CRM.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="hover:text-slate-900">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-900">
              Terms of Service
            </Link>
            <a href="mailto:support@dominiondesk.com" className="hover:text-slate-900">
              Contact Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
