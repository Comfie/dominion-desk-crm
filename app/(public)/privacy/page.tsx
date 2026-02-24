import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | DominionDesk',
  description: 'Privacy Policy for DominionDesk property management platform.',
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mb-10 text-sm text-slate-500">Last updated: 1 March 2026</p>

        <div className="prose prose-slate max-w-none">
          <p className="lead">
            DominionDesk (Pty) Ltd (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is
            committed to protecting your personal information in accordance with the Protection of
            Personal Information Act 4 of 2013 (POPIA). This Privacy Policy explains what
            information we collect, how we use it, and your rights.
          </p>

          <h2 className="mt-10 text-2xl font-bold text-slate-900">1. Who This Applies To</h2>
          <p>This policy applies to:</p>
          <ul className="mt-4 space-y-2 text-slate-700">
            <li>Landlords and property managers who use DominionDesk (&ldquo;Users&rdquo;)</li>
            <li>Tenants who access the Tenant Portal</li>
            <li>Visitors to dominiondesk.com</li>
          </ul>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">2. Information We Collect</h2>

          <h3 className="mt-6 text-lg font-semibold text-slate-800">From Users (Landlords):</h3>
          <ul className="mt-3 space-y-2 text-slate-700">
            <li>Name, email address, and password (hashed)</li>
            <li>Company name and contact details</li>
            <li>Banking details (stored encrypted, used for invoice generation only)</li>
            <li>Property information, lease data, expense records</li>
          </ul>

          <h3 className="mt-6 text-lg font-semibold text-slate-800">
            From Tenants (via the Tenant Portal):
          </h3>
          <ul className="mt-3 space-y-2 text-slate-700">
            <li>Name, email address, phone number</li>
            <li>South African ID number (optional, stored for FICA compliance)</li>
            <li>Employment information (optional, for lease applications)</li>
            <li>Proof of payment documents uploaded</li>
          </ul>

          <h3 className="mt-6 text-lg font-semibold text-slate-800">Automatically collected:</h3>
          <ul className="mt-3 space-y-2 text-slate-700">
            <li>Browser type, IP address, and usage logs (for security and performance)</li>
            <li>Session data via secure cookies</li>
          </ul>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">3. How We Use Your Information</h2>
          <p>We use personal information to:</p>
          <ul className="mt-4 space-y-2 text-slate-700">
            <li>Provide and operate the DominionDesk service</li>
            <li>Send automated rent reminders and invoices on your behalf</li>
            <li>Generate financial reports and tax summaries</li>
            <li>Send service-related notifications (e.g. payment received, maintenance updates)</li>
            <li>Provide customer support</li>
            <li>Improve the platform based on usage patterns</li>
          </ul>
          <p className="mt-4">We do NOT:</p>
          <ul className="mt-4 space-y-2 text-slate-700">
            <li>Sell your data to any third party</li>
            <li>Use your data for advertising</li>
            <li>Share tenant data with any party other than the account-holding landlord</li>
          </ul>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">4. Data Storage &amp; Security</h2>
          <ul className="mt-4 space-y-2 text-slate-700">
            <li>All data is stored on encrypted, cloud-hosted servers</li>
            <li>
              Passwords are hashed using industry-standard algorithms and never stored in plain text
            </li>
            <li>
              Access to data is role-based — only you and team members you authorise can see your
              data
            </li>
            <li>
              File uploads (documents, proof of payment) are stored via UploadThing on secure cloud
              storage
            </li>
            <li>We use HTTPS for all data transmission</li>
          </ul>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">5. Data Retention</h2>
          <ul className="mt-4 space-y-2 text-slate-700">
            <li>Your data is retained for as long as your account is active</li>
            <li>
              If you cancel, your data is retained for 30 days to allow export, then securely
              deleted
            </li>
            <li>Audit logs may be retained for up to 12 months for security purposes</li>
          </ul>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">6. Your Rights Under POPIA</h2>
          <p>As a data subject, you have the right to:</p>
          <ul className="mt-4 space-y-2 text-slate-700">
            <li>
              <strong>Access</strong> — Request a copy of the personal information we hold about you
            </li>
            <li>
              <strong>Correction</strong> — Request correction of inaccurate information
            </li>
            <li>
              <strong>Deletion</strong> — Request deletion of your personal information (subject to
              legal retention requirements)
            </li>
            <li>
              <strong>Objection</strong> — Object to the processing of your personal information
            </li>
            <li>
              <strong>Export</strong> — Export all your data from the platform at any time
            </li>
          </ul>
          <p className="mt-4">
            To exercise these rights, contact us at{' '}
            <a
              href="mailto:privacy@dominiondesk.com"
              className="text-blue-600 underline hover:text-blue-700"
            >
              privacy@dominiondesk.com
            </a>
            .
          </p>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">
            7. Tenant Data — Landlord Responsibility
          </h2>
          <p>
            When you use DominionDesk to store your tenants&apos; personal information, you are the
            responsible party under POPIA. You must:
          </p>
          <ul className="mt-4 space-y-2 text-slate-700">
            <li>Have a lawful basis for collecting tenant information</li>
            <li>Inform tenants that their information is stored on DominionDesk</li>
            <li>Ensure you do not collect more information than is necessary</li>
            <li>Respond to any tenant requests regarding their personal information</li>
          </ul>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">8. Cookies</h2>
          <p>
            We use essential cookies for session management and authentication. We do not use
            advertising or tracking cookies. You can disable cookies in your browser settings, but
            this may affect your ability to log in.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">9. Third-Party Services</h2>
          <p>We use the following third-party services to operate the platform:</p>
          <ul className="mt-4 space-y-2 text-slate-700">
            <li>
              <strong>Vercel</strong> — Hosting and deployment
            </li>
            <li>
              <strong>Railway</strong> — Database hosting
            </li>
            <li>
              <strong>UploadThing</strong> — File storage
            </li>
            <li>
              <strong>Resend</strong> — Transactional email delivery
            </li>
            <li>
              <strong>PayFast</strong> — Payment processing (subscription billing)
            </li>
          </ul>
          <p className="mt-4">
            Each of these providers has their own privacy policies and data processing agreements.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">10. Children&apos;s Privacy</h2>
          <p>
            DominionDesk is not intended for use by anyone under the age of 18. We do not knowingly
            collect personal information from minors.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you by email when
            material changes are made. The &ldquo;Last updated&rdquo; date at the top of this page
            will always reflect the most recent version.
          </p>

          <h2 className="mt-8 text-2xl font-bold text-slate-900">12. Contact Us</h2>
          <p>For any privacy-related questions or to exercise your rights:</p>
          <p className="mt-2">
            <strong>Email:</strong>{' '}
            <a
              href="mailto:privacy@dominiondesk.com"
              className="text-blue-600 underline hover:text-blue-700"
            >
              privacy@dominiondesk.com
            </a>
            <br />
            <strong>Information Officer:</strong> DominionDesk (Pty) Ltd
            <br />
            <strong>Website:</strong>{' '}
            <a
              href="https://dominiondesk.com"
              className="text-blue-600 underline hover:text-blue-700"
            >
              dominiondesk.com
            </a>
          </p>
          <p className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            To lodge a complaint about how we handle your personal information, you may also contact
            the Information Regulator of South Africa at{' '}
            <a
              href="https://inforeg.org.za"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-700"
            >
              inforeg.org.za
            </a>
            .
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
