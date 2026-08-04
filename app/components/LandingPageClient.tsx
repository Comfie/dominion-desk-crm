'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Menu, X } from 'lucide-react';
import {
  audiencePaths,
  faqItems,
  featureSuites,
  lifecycleStages,
  productCapabilities,
  pricingPlans,
  productHero,
  quickStartSteps,
} from './landing/product-page-content';
import {
  AudiencePathGrid,
  CapabilityGrid,
  FaqSection,
  FeatureSuiteSection,
  GettingStartedSection,
  HeroProductSurface,
  LifecycleRail,
  PricingSection,
} from './landing/product-page-sections';

const navItems = [
  { label: 'Start', href: '#start' },
  { label: 'Who is it for', href: '#paths' },
  { label: 'Lifecycle', href: '#lifecycle' },
  { label: 'Platform', href: '#placement' },
  { label: 'Pricing', href: '#pricing' },
];

export function LandingPageClient() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#101828] selection:bg-[#3B82F6]/40">
      <header
        className={`fixed top-0 right-0 left-0 z-50 transition ${
          scrolled
            ? 'border-b border-[#D7E3F0] bg-[#F8FAFC]/92 shadow-sm backdrop-blur'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <img
              src="/logos/logo-light.svg"
              alt="DominionDesk"
              width={160}
              height={32}
              className="h-8 w-auto"
            />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`text-sm font-semibold transition ${
                  scrolled
                    ? 'text-[#526070] hover:text-[#101828]'
                    : 'text-[#253244]/70 hover:text-[#101828]'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className={`text-sm font-semibold ${scrolled ? 'text-[#253244]' : 'text-[#101828]'}`}
            >
              Log in
            </Link>
            <Link
              href={productHero.primaryCta.href}
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#101828] px-4 text-sm font-semibold text-white shadow-lg shadow-[#101828]/15 transition hover:bg-[#253244]"
            >
              {productHero.primaryCta.label}
            </Link>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            className="rounded-md p-2 text-[#101828] md:hidden"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-[#D7E3F0] bg-[#F8FAFC] p-4 shadow-xl md:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-[#253244] hover:bg-white"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-semibold text-[#253244]"
              >
                Log in
              </Link>
              <Link
                href={productHero.primaryCta.href}
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#101828] px-4 text-sm font-semibold text-white"
              >
                {productHero.primaryCta.label}
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#F8FAFC] pt-16 md:pt-36">
          <div className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_30%_12%,rgba(59,130,246,0.18),transparent_32rem)]" />
          <div className="relative mx-auto grid max-w-7xl gap-3 px-4 pb-2 sm:px-6 md:gap-8 md:pb-20 lg:grid-cols-[0.78fr_1.22fr] lg:px-8 lg:pb-24">
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold tracking-[0.28em] text-[#0A2D67] uppercase">
                {productHero.eyebrow}
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl leading-[1.04] font-semibold tracking-tight text-[#101828] sm:text-5xl md:mt-4 md:text-7xl">
                {productHero.headline}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#526070] md:mt-5 md:text-lg md:leading-8">
                {productHero.subheadline}
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row md:mt-8">
                <Link
                  href={productHero.primaryCta.href}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#101828] px-6 text-base font-semibold text-white shadow-xl shadow-[#101828]/15 transition hover:bg-[#253244] md:h-12"
                >
                  {productHero.primaryCta.label}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href={productHero.secondaryCta.href}
                  className="hidden h-12 items-center justify-center rounded-full border border-[#B8C7D9] bg-white/70 px-6 text-base font-semibold text-[#101828] transition hover:bg-white sm:inline-flex"
                >
                  {productHero.secondaryCta.label}
                </Link>
              </div>
              <div className="mt-7 hidden flex-wrap gap-2 sm:flex">
                {productHero.trustSignals.map((signal) => (
                  <span
                    key={signal}
                    className="inline-flex items-center gap-2 rounded-full border border-[#D7E3F0] bg-white px-3 py-1.5 text-sm text-[#253244]"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {signal}
                  </span>
                ))}
              </div>
            </div>
            <HeroProductSurface hero={productHero} />
          </div>
        </section>

        <GettingStartedSection steps={quickStartSteps} />

        <section id="paths" className="scroll-mt-24 bg-[#F8FAFC] py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold tracking-[0.24em] text-[#0A2D67] uppercase">
              Who is it for
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[#101828] md:text-5xl">
              One product, three rental operations paths.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#526070]">
              DominionDesk adapts to how you operate: owning a few rentals, running a portfolio, or
              placing tenants for landlords.
            </p>
            <div className="mt-10">
              <AudiencePathGrid paths={audiencePaths} />
            </div>
          </div>
        </section>

        <section id="lifecycle" className="scroll-mt-24 bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold tracking-[0.24em] text-[#0A2D67] uppercase">
              Lifecycle rail
            </p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[#101828] md:text-5xl">
              From mandate to reports, every handoff stays visible.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#526070]">
              Placement and management live in the same operational line, so agencies and landlords
              do not lose context when a prospect becomes a tenant.
            </p>
            <div className="mt-10">
              <LifecycleRail stages={lifecycleStages} />
            </div>
          </div>
        </section>

        <div className="bg-[#F8FAFC]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {featureSuites.map((suite) => (
              <FeatureSuiteSection key={suite.id} suite={suite} />
            ))}
          </div>
        </div>

        <CapabilityGrid capabilities={productCapabilities} />

        <PricingSection plans={pricingPlans} />
        <FaqSection items={faqItems} />

        <section className="bg-[#F8FAFC] py-20 text-[#101828]">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-xs font-bold tracking-[0.24em] text-[#0A2D67] uppercase">
              Founding access
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Move DominionDesk from project to product with your first live workflows.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#526070]">
              Start with the workflows you use today, then grow into placement, portal, financial,
              and operations control as your portfolio or agency expands.
            </p>
            <Link
              href={productHero.primaryCta.href}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-[#101828] px-6 text-base font-semibold text-white shadow-xl shadow-[#101828]/15 transition hover:bg-[#253244]"
            >
              {productHero.primaryCta.label}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#101828] py-10 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 sm:px-6 md:flex-row lg:px-8">
          <Link href="/" className="flex items-center">
            <img
              src="/logos/logo-dark.svg"
              alt="DominionDesk"
              width={160}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
          <div className="flex flex-wrap justify-center gap-5 text-sm">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <a href="mailto:support@dominiondesk.com" className="hover:text-white">
              Contact
            </a>
          </div>
          <div className="text-sm">© {new Date().getFullYear()} DominionDesk CRM.</div>
        </div>
      </footer>
    </div>
  );
}
