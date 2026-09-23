'use client';

import Link from 'next/link';

import { Logo } from '@/components/ui/logo';
import { PRICING } from '@/lib/config/pricing';

import { PricingCalculator } from './landing/pricing-calculator';
import { StatementDemo } from './landing/statement-demo';

const MONTH_END = [
  {
    title: 'Invoices go out on their own',
    body: 'Rent invoices are created for every lease before the 1st, and tenants get an email with your bank details and their personal reference.',
  },
  {
    title: 'Tenants pay the way they already do',
    body: 'EFT from any bank, using a reference like DD-7K3M9Q that stays the same every month. No new app for them, no card fees for you.',
  },
  {
    title: 'You upload one CSV',
    body: 'Download the transaction history from your banking app and drop it in. Deposits are matched by reference, amount and surname, and each match shows why.',
  },
  {
    title: 'You see who owes what',
    body: 'Confirm the matches and the rent roll, arrears list and reports update. Friendly reminders go to anyone still outstanding.',
  },
];

const IN_BETA = [
  [
    'Bank statement reconciliation',
    'FNB, Standard Bank, Absa, Nedbank, Capitec and any bank that exports CSV',
  ],
  [
    'Rent roll and arrears',
    'Monthly invoices per lease, partial payments, ageing and overdue flags',
  ],
  ['Email reminders', 'Before the due date and after it, on a schedule you control'],
  ['Tenant portal', 'Tenants see their invoices, reference, bank details and payment history'],
  [
    'Leases and documents',
    'Lease dates, deposits, expiry alerts and a document vault per property',
  ],
  ['Maintenance and inspections', 'Log requests with photos, assign contractors, track costs'],
  [
    'Reports you can hand your accountant',
    'Rent, arrears, cash flow, expenses and a tax summary as CSV',
  ],
];

const NOT_YET = [
  'Card or instant-EFT payments inside the portal',
  'Direct bank feeds (you upload a statement instead)',
  'Airbnb and Booking.com calendar sync',
  'SMS and WhatsApp reminders',
];

const FAQ = [
  {
    q: 'Do you connect to my bank account?',
    a: 'No. You download a CSV in your own banking app and upload it. DominionDesk never sees your banking login and never holds or moves your money.',
  },
  {
    q: 'What if a tenant forgets the reference?',
    a: 'The deposit is still matched on the amount and the tenant’s surname, and flagged as a possible match for you to confirm. Anything unclear waits for you. Nothing is marked paid without your say-so.',
  },
  {
    q: 'My bank isn’t on your list.',
    a: 'If it exports a CSV, it works. When we don’t recognise the layout, you tell us once which column is the date, description and amount.',
  },
  {
    q: 'How long does it take to set up?',
    a: 'Send us your existing spreadsheet and we’ll import your properties, tenants and leases for you. Most landlords are running their first month-end within a day.',
  },
  {
    q: 'What about my tenants’ personal information?',
    a: 'It is used only to run your rentals, never sold or shared, and you can export or delete everything at any time. You stay the responsible party under POPIA, and we help you meet that.',
  },
  {
    q: 'What happens after the free period?',
    a: `You pay R${PRICING.perUnit} per occupied unit per month, never less than R${PRICING.minimumMonthly} and never more than R${PRICING.maximumMonthly}. Vacant units are free. Leave any time and take your data with you.`,
  },
];

const linkFocus =
  'focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:outline-none';

export function LandingPageClient() {
  return (
    <div className="min-h-screen bg-white text-[#0E1A2B] antialiased">
      <header className="sticky top-0 z-30 border-b border-[#E6ECF5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/" aria-label="DominionDesk home" className={linkFocus}>
            <Logo width={150} height={34} />
          </Link>
          <nav className="flex items-center gap-1 text-sm sm:gap-2">
            <a
              href="#how"
              className={`hidden rounded-md px-3 py-2 text-[#33445C] hover:text-[#0A2D67] sm:block ${linkFocus}`}
            >
              How it works
            </a>
            <a
              href="#pricing"
              className={`hidden rounded-md px-3 py-2 text-[#33445C] hover:text-[#0A2D67] sm:block ${linkFocus}`}
            >
              Pricing
            </a>
            <Link
              href="/login"
              className={`rounded-md px-3 py-2 text-[#33445C] hover:text-[#0A2D67] ${linkFocus}`}
            >
              Log in
            </Link>
            <Link
              href="/register"
              className={`rounded-md bg-[#0A2D67] px-4 py-2 font-semibold text-white hover:bg-[#123C85] ${linkFocus}`}
            >
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-14 pb-20 lg:grid-cols-[1fr_1.05fr] lg:pt-20">
          <div className="max-w-xl">
            <h1 className="text-[2.6rem] leading-[1.05] font-semibold tracking-[-0.03em] text-[#0A2D67] sm:text-6xl">
              Upload your bank statement. See who hasn&apos;t paid.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#33445C]">
              DominionDesk reads your statement, matches every EFT to the right tenant and shows
              your arrears in seconds, for South African landlords with 2 to 50 units.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className={`rounded-md bg-[#0A2D67] px-6 py-3 text-base font-semibold text-white hover:bg-[#123C85] ${linkFocus}`}
              >
                Start your free {PRICING.foundingTrialDays} days
              </Link>
              <Link
                href="/contact"
                className={`rounded-md border border-[#C9D5E8] px-6 py-3 text-base font-semibold text-[#0A2D67] hover:border-[#0A2D67] ${linkFocus}`}
              >
                Book a 15-minute walkthrough
              </Link>
            </div>
            <p className="mt-4 text-sm text-[#5B6B82]">
              No card needed. We&apos;ll import your spreadsheet for you.
            </p>
          </div>
          <StatementDemo />
        </section>

        {/* Month-end */}
        <section id="how" className="scroll-mt-20 border-t border-[#E6ECF5] bg-[#F6F8FC]">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-[#0A2D67] sm:text-4xl">
              Month-end without the banking app, the spreadsheet and the WhatsApp chase
            </h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {MONTH_END.map((step, i) => (
                <li key={step.title} className="border-t-2 border-[#0A2D67] pt-5">
                  <p className="text-sm font-semibold text-[#3B82F6] tabular-nums">Step {i + 1}</p>
                  <h3 className="mt-2 text-lg font-semibold text-[#0E1A2B]">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-[#33445C]">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Honest scope */}
        <section className="mx-auto grid max-w-6xl gap-14 px-5 py-20 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#0A2D67]">
              What you get today
            </h2>
            <dl className="mt-8 divide-y divide-[#E6ECF5] border-y border-[#E6ECF5]">
              {IN_BETA.map(([term, detail]) => (
                <div key={term} className="grid gap-1 py-4 sm:grid-cols-[15rem_1fr] sm:gap-6">
                  <dt className="font-semibold text-[#0E1A2B]">{term}</dt>
                  <dd className="text-[#33445C]">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#0A2D67]">Not built yet</h2>
            <p className="mt-3 leading-relaxed text-[#33445C]">
              We&apos;d rather tell you now than have you find out in month two. Founding landlords
              decide what comes next.
            </p>
            <ul className="mt-6 space-y-3">
              {NOT_YET.map((item) => (
                <li key={item} className="flex gap-3 text-[#33445C]">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B45309]"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 border-t border-[#E6ECF5] bg-[#F6F8FC]">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-[#0A2D67] sm:text-4xl">
                R{PRICING.perUnit} per occupied unit. Never a cut of your rent.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#33445C]">
                Vacant units are free. The minimum is R{PRICING.minimumMonthly} a month and the bill
                stops growing at R{PRICING.maximumMonthly}, however many units you add. No
                transaction fees, no setup fee, no contract.
              </p>
              <p className="mt-4 leading-relaxed text-[#33445C]">
                Founding landlords get {PRICING.foundingTrialDays} days free, a hands-on import of
                their portfolio, and {PRICING.foundingDiscountPercent}% off for the first{' '}
                {PRICING.foundingDiscountMonths} months.
              </p>
            </div>
            <PricingCalculator />
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-5 py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-[#0A2D67]">
            Questions landlords ask
          </h2>
          <div className="mt-8 divide-y divide-[#E6ECF5] border-y border-[#E6ECF5]">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-4">
                <summary
                  className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-md font-semibold text-[#0E1A2B] ${linkFocus}`}
                >
                  {item.q}
                  <span
                    aria-hidden
                    className="text-xl leading-none text-[#3B82F6] transition-transform group-open:rotate-45 motion-reduce:transition-none"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-prose leading-relaxed text-[#33445C]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#0A2D67]">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-16 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Run next month-end on DominionDesk
              </h2>
              <p className="mt-2 text-[#C9D8F2]">
                Send us your spreadsheet. We&apos;ll have your portfolio loaded before the 1st.
              </p>
            </div>
            <Link
              href="/register"
              className="shrink-0 rounded-md bg-white px-6 py-3 font-semibold text-[#0A2D67] hover:bg-[#EEF4FF] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A2D67] focus-visible:outline-none"
            >
              Start free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E6ECF5]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-[#5B6B82] sm:flex-row sm:items-center sm:justify-between">
          <p>DominionDesk, built in Johannesburg for South African landlords.</p>
          <nav className="flex gap-5">
            <Link href="/contact" className={`hover:text-[#0A2D67] ${linkFocus}`}>
              Contact
            </Link>
            <Link href="/privacy" className={`hover:text-[#0A2D67] ${linkFocus}`}>
              Privacy
            </Link>
            <Link href="/terms" className={`hover:text-[#0A2D67] ${linkFocus}`}>
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
