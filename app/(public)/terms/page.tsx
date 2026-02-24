import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | DominionDesk',
  description: 'Terms of Service for DominionDesk property management platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Minimal Nav */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <img src="/logos/logo-light.svg" alt="DominionDesk" className="h-8 w-auto" />
          </Link>
          <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            Log in
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-slate-900">
          Terms of Service
        </h1>
        <p className="mb-10 text-sm text-slate-500">Last updated: 1 March 2026</p>

        <div className="prose prose-slate max-w-none">
          <p className="lead">
            Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using
            DominionDesk (&ldquo;the Service&rdquo;), operated by DominionDesk (Pty) Ltd
            (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
          </p>
          <p>
            By accessing or using the Service, you agree to be bound by these Terms. If you do not
            agree, do not use the Service.
          </p>

          <h2 className="mt-10 text-2xl font-bold text-slate-900">1. The Service</h2>
          <p>
            DominionDesk is a property management software platform designed to help landlords
            manage properties, tenants, payments, maintenance, and financial records. The Service is
            provided on a subscription basis.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">2. Eligibility</h2>
          <p>
            You must be at least 18 years old and have the legal capacity to enter into a binding
            agreement to use this Service. By registering, you confirm that you meet these
            requirements.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">3. Account Registration</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. You
            agree to provide accurate and current information during registration and to update this
            information when it changes. You are responsible for all activity that occurs under your
            account.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">4. Subscription &amp; Billing</h2>
          <ul className="mt-4 space-y-2 text-slate-700">
            <li>
              The Service is offered on a free trial basis (2 months, up to 2 properties) and on
              paid subscription plans.
            </li>
            <li>
              After the trial period, continued use of the Service beyond 2 properties requires a
              paid subscription.
            </li>
            <li>Subscription fees are billed monthly in South African Rand (ZAR) via PayFast.</li>
            <li>
              Fees are non-refundable except as required by South African consumer protection law.
            </li>
            <li>
              We reserve the right to change pricing with 30 days&apos; written notice to existing
              subscribers.
            </li>
          </ul>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="mt-4 space-y-2 text-slate-700">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorised access to any part of the Service</li>
            <li>Upload malicious files or content</li>
            <li>Impersonate any person or entity</li>
            <li>Use the Service to store data unrelated to property management</li>
          </ul>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">6. Your Data</h2>
          <p>
            You retain ownership of all data you upload or create in the Service. We do not sell
            your data to third parties. You can export your data at any time. See our{' '}
            <Link href="/privacy" className="text-blue-600 underline hover:text-blue-700">
              Privacy Policy
            </Link>{' '}
            for full details on how we handle your data.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">
            7. Tenant Data &amp; POPIA Compliance
          </h2>
          <p>
            You, as the landlord/account holder, are the responsible party for any personal
            information you collect and store about your tenants within the Service. You must ensure
            you have lawful grounds to collect and process tenant personal information in accordance
            with the Protection of Personal Information Act 4 of 2013 (POPIA).
          </p>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">8. Intellectual Property</h2>
          <p>
            The DominionDesk platform, including all software, design, and content, is the
            intellectual property of DominionDesk (Pty) Ltd. You are granted a limited,
            non-exclusive, non-transferable licence to use the Service for its intended purpose.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">9. Uptime &amp; Availability</h2>
          <p>
            We aim for maximum uptime but do not guarantee uninterrupted availability. We will not
            be liable for temporary downtime due to maintenance, hosting issues, or circumstances
            beyond our control.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by South African law, DominionDesk shall not be liable
            for any indirect, incidental, or consequential damages arising from your use of the
            Service. Our total liability shall not exceed the amount you paid in the 3 months
            preceding the claim.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">11. Termination</h2>
          <p>
            You may cancel your subscription at any time from your account settings. We may suspend
            or terminate your account if you breach these Terms, with or without notice depending on
            the severity of the breach. Upon termination, you have 30 days to export your data.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">12. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. We will notify you by email at least 14
            days before material changes take effect. Continued use of the Service after the
            effective date constitutes acceptance.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">13. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the Republic of South Africa. Any disputes shall
            be subject to the jurisdiction of the South African courts.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">14. Contact</h2>
          <p>If you have questions about these Terms, contact us at:</p>
          <p className="mt-2">
            <strong>Email:</strong>{' '}
            <a
              href="mailto:legal@dominiondesk.com"
              className="text-blue-600 underline hover:text-blue-700"
            >
              legal@dominiondesk.com
            </a>
            <br />
            <strong>Website:</strong>{' '}
            <a
              href="https://dominiondesk.com"
              className="text-blue-600 underline hover:text-blue-700"
            >
              dominiondesk.com
            </a>
          </p>
        </div>
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
