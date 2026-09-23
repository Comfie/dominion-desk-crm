'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle2,
  FileSpreadsheet,
  Landmark,
  ListChecks,
  Send,
  Smartphone,
} from 'lucide-react';

import { PRICING } from '@/lib/config/pricing';

import { PricingCalculator } from './landing/pricing-calculator';
import { ArrearsTile, MaintenanceTile, PortalTile, ReminderTile } from './landing/product-tiles';
import { StatementDemo } from './landing/statement-demo';

const BANKS = [
  'FNB',
  'Standard Bank',
  'Absa',
  'Nedbank',
  'Capitec',
  'Investec',
  'TymeBank',
  'Discovery Bank',
];

const MONTH_END = [
  {
    icon: Send,
    title: 'Invoices go out on their own',
    body: 'Before the 1st, every lease gets an invoice with your bank details and the tenant’s personal reference.',
  },
  {
    icon: Landmark,
    title: 'Tenants pay the way they already do',
    body: 'EFT from any bank with a reference like DD-7K3M9Q that never changes. No app for them, no card fees for you.',
  },
  {
    icon: FileSpreadsheet,
    title: 'You upload one CSV',
    body: 'Download the history from your banking app and drop it in. Deposits match on reference, amount and surname.',
  },
  {
    icon: ListChecks,
    title: 'You see who owes what',
    body: 'Confirm the matches. The rent roll, arrears and reports update, and reminders go to whoever is still short.',
  },
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
    a: 'The deposit is still matched on amount and surname and flagged as a possible match for you to confirm. Nothing is marked paid without your say-so.',
  },
  {
    q: 'My bank isn’t on your list.',
    a: 'If it exports a CSV, it works. When we don’t recognise the layout, you tell us once which column is the date, description and amount.',
  },
  {
    q: 'How long does it take to set up?',
    a: 'Send us your existing spreadsheet and we’ll import your properties, tenants and leases for you. Most landlords run their first month-end within a day.',
  },
  {
    q: 'What about my tenants’ personal information?',
    a: 'It is used only to run your rentals, never sold or shared, and you can export or delete everything at any time. You remain the responsible party under POPIA, and we help you meet that.',
  },
  {
    q: 'What happens after the free period?',
    a: `R${PRICING.perUnit} per occupied unit per month, never less than R${PRICING.minimumMonthly} and never more than R${PRICING.maximumMonthly}. Vacant units are free. Leave any time and take your data with you.`,
  },
];

const focus =
  'focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:outline-none';
const focusOnDark = `${focus} focus-visible:ring-offset-[#0A2D67]`;

/** Faint ledger grid used on dark sections. */
const ledgerGrid = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
  backgroundSize: '48px 48px',
} as const;

export function LandingPageClient() {
  return (
    <div className="min-h-screen bg-white text-[#0E1A2B] antialiased">
      {/* ------------------------------------------------------------ Hero */}
      <div className="relative overflow-hidden bg-[#061A3D]">
        <div aria-hidden className="absolute inset-0" style={ledgerGrid} />
        <div
          aria-hidden
          className="absolute -top-40 right-[-10%] h-[36rem] w-[36rem] rounded-full bg-[#3B82F6] opacity-30 blur-[120px]"
        />
        <div
          aria-hidden
          className="absolute bottom-[-12rem] left-[-8rem] h-[28rem] w-[28rem] rounded-full bg-[#0A2D67] opacity-80 blur-[100px]"
        />

        <header className="relative z-10">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
            <Link href="/" aria-label="DominionDesk home" className={`rounded-md ${focusOnDark}`}>
              {/* logo-dark.svg is the light-coloured logo for dark backgrounds */}
              <Image
                src="/logos/logo-dark.svg"
                alt="DominionDesk"
                width={160}
                height={36}
                priority
              />
            </Link>
            <nav className="flex items-center gap-1 text-sm sm:gap-2">
              <a
                href="#how"
                className={`hidden rounded-md px-3 py-2 text-[#C9D8F2] hover:text-white sm:block ${focusOnDark}`}
              >
                How it works
              </a>
              <a
                href="#pricing"
                className={`hidden rounded-md px-3 py-2 text-[#C9D8F2] hover:text-white sm:block ${focusOnDark}`}
              >
                Pricing
              </a>
              <Link
                href="/login"
                className={`rounded-md px-3 py-2 whitespace-nowrap text-[#C9D8F2] hover:text-white ${focusOnDark}`}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={`rounded-md bg-[#3B82F6] px-4 py-2 font-semibold whitespace-nowrap text-white hover:bg-[#2563EB] ${focusOnDark}`}
              >
                Start free
              </Link>
            </nav>
          </div>
        </header>

        <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 pt-10 pb-20 lg:grid-cols-[1fr_1.05fr] lg:pt-16 lg:pb-28">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-[#C9D8F2]">
              <span className="h-2 w-2 rounded-full bg-[#34D399]" aria-hidden />
              Founding landlord spots open
            </p>
            <h1 className="mt-6 text-[2.6rem] leading-[1.04] font-bold tracking-[-0.035em] text-white sm:text-6xl">
              Upload your bank statement. See who hasn&apos;t paid.
            </h1>
            <p className="mt-6 text-base leading-relaxed text-[#C9D8F2] sm:text-lg">
              DominionDesk reads your statement, matches every EFT to the right tenant and shows
              your arrears in seconds, for South African landlords with 2 to 50 units.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className={`rounded-lg bg-[#3B82F6] px-6 py-3 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(59,130,246,0.8)] hover:bg-[#2563EB] ${focusOnDark}`}
              >
                Try it free for {PRICING.foundingTrialDays} days
              </Link>
              <Link
                href="/contact"
                className={`rounded-lg border border-white/25 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 ${focusOnDark}`}
              >
                Book a walkthrough
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#9FB7E0]">
              {['No card needed', 'We import your spreadsheet', 'Your money never touches us'].map(
                (item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-[#34D399]" aria-hidden />
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>
          <div className="relative">
            <StatementDemo autoPlay />
          </div>
        </section>

        <div className="relative z-10 border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:gap-8">
            <p className="shrink-0 text-sm text-[#9FB7E0]">Reads statements from</p>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {BANKS.map((bank) => (
                <li key={bank} className="text-sm font-semibold tracking-tight text-white/80">
                  {bank}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <main>
        {/* ------------------------------------------------ Month-end steps */}
        <section id="how" className="scroll-mt-4 bg-[#EEF4FF]">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-[#0A2D67] sm:text-4xl">
              Month-end without the banking app, the spreadsheet and the WhatsApp chase
            </h2>
            <ol className="relative mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div
                aria-hidden
                className="absolute top-7 right-[12%] left-[12%] hidden h-0.5 bg-[#BFD3F5] lg:block"
              />
              {MONTH_END.map((step, i) => (
                <li
                  key={step.title}
                  className="relative rounded-2xl bg-white p-6 shadow-[0_12px_32px_-18px_rgba(10,45,103,0.35)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0A2D67] text-white">
                      <step.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold text-[#3B82F6]">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[#0E1A2B]">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-[#33445C]">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------- Feature bento */}
        <section className="mx-auto max-w-6xl px-5 py-20 lg:py-24">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-[#0A2D67] sm:text-4xl">
            Everything a rental portfolio needs after the lease is signed
          </h2>
          <p className="mt-4 max-w-2xl text-base text-[#33445C]">
            Rent is the centre of it. Around it: reminders, a portal for tenants, maintenance,
            leases, documents and reports your accountant can use.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-6">
            <article className="relative overflow-hidden rounded-3xl bg-[#0A2D67] p-7 text-white lg:col-span-4">
              <div aria-hidden className="absolute inset-0 opacity-60" style={ledgerGrid} />
              <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-[1fr_1.2fr]">
                <div>
                  <h3 className="text-2xl font-bold text-white">Arrears you can act on</h3>
                  <p className="mt-3 leading-relaxed text-[#C9D8F2]">
                    Partial payments, overdue flags and ageing per tenant, updated the moment you
                    confirm a statement. Export to CSV any time.
                  </p>
                </div>
                <div className="h-48">
                  <ArrearsTile />
                </div>
              </div>
            </article>

            <article className="rounded-3xl bg-[#EEF4FF] p-7 lg:col-span-2">
              <h3 className="text-xl font-bold text-[#0A2D67]">Reminders that go on their own</h3>
              <div className="mt-5">
                <ReminderTile />
              </div>
            </article>

            <article className="flex flex-col rounded-3xl bg-gradient-to-b from-[#DBEAFE] to-[#EEF4FF] p-7 lg:col-span-2">
              <div className="flex items-center gap-2 text-[#0A2D67]">
                <Smartphone className="h-5 w-5" aria-hidden />
                <h3 className="text-xl font-bold text-[#0A2D67]">A portal for tenants</h3>
              </div>
              <p className="mt-2 text-[#33445C]">
                Invoices, their reference, your bank details and payment history on their phone.
              </p>
              <div className="mt-6 flex-1">
                <PortalTile />
              </div>
            </article>

            <article className="rounded-3xl border border-[#E6ECF5] bg-white p-7 shadow-[0_12px_32px_-22px_rgba(10,45,103,0.35)] lg:col-span-2">
              <h3 className="text-xl font-bold text-[#0A2D67]">Maintenance, tracked</h3>
              <p className="mt-2 text-[#33445C]">Photos, contractors, quotes and costs per unit.</p>
              <div className="mt-5">
                <MaintenanceTile />
              </div>
            </article>

            <article className="rounded-3xl border border-[#F5D9B0] bg-[#FFF8EE] p-7 lg:col-span-2">
              <h3 className="text-xl font-bold text-[#7C3E06]">Not built yet</h3>
              <p className="mt-2 text-[#7C4A14]">
                We&apos;d rather tell you now than have you find out in month two.
              </p>
              <ul className="mt-4 space-y-2.5">
                {NOT_YET.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-[#7C4A14]">
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D97706]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        {/* ------------------------------------------------------ Pricing */}
        <section id="pricing" className="relative scroll-mt-4 overflow-hidden bg-[#0A2D67]">
          <div aria-hidden className="absolute inset-0 opacity-70" style={ledgerGrid} />
          <div
            aria-hidden
            className="absolute top-1/2 left-[-10rem] h-[30rem] w-[30rem] -translate-y-1/2 rounded-full bg-[#3B82F6] opacity-25 blur-[120px]"
          />
          <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 py-20 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:py-24">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                R{PRICING.perUnit} per occupied unit. Never a cut of your rent.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-[#C9D8F2]">
                Vacant units are free. The minimum is R{PRICING.minimumMonthly} a month and the bill
                stops growing at R{PRICING.maximumMonthly}. No transaction fees, no setup fee, no
                contract.
              </p>
              <ul className="mt-6 space-y-2 text-[#C9D8F2]">
                {[
                  `${PRICING.foundingTrialDays} days free, no card`,
                  'We import your portfolio for you',
                  `${PRICING.foundingDiscountPercent}% off for your first ${PRICING.foundingDiscountMonths} months as a founding landlord`,
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#34D399]" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]">
              <PricingCalculator />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- FAQ */}
        <section className="mx-auto max-w-3xl px-5 py-20 lg:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-[#0A2D67]">
            Questions landlords ask
          </h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-[#E6ECF5] bg-white px-5 py-4 open:bg-[#F6F8FC]"
              >
                <summary
                  className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-md font-semibold text-[#0E1A2B] ${focus}`}
                >
                  {item.q}
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-lg leading-none text-[#0A2D67] transition-transform group-open:rotate-45 motion-reduce:transition-none"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-prose leading-relaxed text-[#33445C]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------- Final CTA */}
        <section className="px-5 pb-20">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#3B82F6] to-[#0A2D67] px-8 py-14 sm:px-14">
            <div aria-hidden className="absolute inset-0 opacity-50" style={ledgerGrid} />
            <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  Run next month-end on DominionDesk
                </h2>
                <p className="mt-2 text-base text-[#DBEAFE]">
                  Send us your spreadsheet. We&apos;ll have your portfolio loaded before the 1st.
                </p>
              </div>
              <Link
                href="/register"
                className="shrink-0 rounded-lg bg-white px-7 py-3.5 font-semibold text-[#0A2D67] hover:bg-[#EEF4FF] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E4FA3] focus-visible:outline-none"
              >
                Start free
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#061A3D]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-[#9FB7E0] sm:flex-row sm:items-center sm:justify-between">
          <p>DominionDesk, built in Johannesburg for South African landlords.</p>
          <nav className="flex gap-5">
            <Link href="/contact" className={`hover:text-white ${focusOnDark}`}>
              Contact
            </Link>
            <Link href="/privacy" className={`hover:text-white ${focusOnDark}`}>
              Privacy
            </Link>
            <Link href="/terms" className={`hover:text-white ${focusOnDark}`}>
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
