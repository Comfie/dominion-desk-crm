'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Menu, X } from 'lucide-react';
import {
  audiencePaths,
  faqItems,
  featureSuites,
  lifecycleStages,
  pricingPlans,
  productHero,
} from './landing/product-page-content';
import {
  AudiencePathGrid,
  FaqSection,
  FeatureSuiteSection,
  HeroProductSurface,
  LifecycleRail,
  PricingSection,
} from './landing/product-page-sections';

const navItems = [
  { label: 'Paths', href: '#paths' },
  { label: 'Lifecycle', href: '#lifecycle' },
  { label: 'Features', href: '#placement' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-950 selection:bg-sky-200">
      <header
        className={`fixed top-0 right-0 left-0 z-50 transition ${
          scrolled
            ? 'border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <img
              src={scrolled ? '/logos/logo-light.svg' : '/logos/logo-dark.svg'}
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
                    ? 'text-slate-600 hover:text-slate-950'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className={`text-sm font-semibold ${scrolled ? 'text-slate-700' : 'text-white'}`}
            >
              Log in
            </Link>
            <Link
              href={productHero.primaryCta.href}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#F59E0B] px-4 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600"
            >
              {productHero.primaryCta.label}
            </Link>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            className={`rounded-md p-2 md:hidden ${scrolled ? 'text-slate-950' : 'text-white'}`}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white p-4 shadow-xl md:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Log in
              </Link>
              <Link
                href={productHero.primaryCta.href}
                className="inline-flex h-10 items-center justify-center rounded-md bg-sky-700 px-4 text-sm font-semibold text-white"
              >
                {productHero.primaryCta.label}
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#08233F] pt-28 text-white md:pt-36">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-20 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:pb-24">
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold tracking-[0.28em] text-sky-300 uppercase">
                {productHero.eyebrow}
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl leading-[1.02] font-bold tracking-tight md:text-6xl">
                {productHero.headline}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                {productHero.subheadline}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={productHero.primaryCta.href}
                  className="inline-flex h-12 items-center justify-center rounded-md bg-[#F59E0B] px-6 text-base font-semibold text-white shadow-xl shadow-amber-500/20 transition hover:bg-amber-600"
                >
                  {productHero.primaryCta.label}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href={productHero.secondaryCta.href}
                  className="inline-flex h-12 items-center justify-center rounded-md border border-white/20 px-6 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  {productHero.secondaryCta.label}
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-2">
                {productHero.trustSignals.map((signal) => (
                  <span
                    key={signal}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-slate-100"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {signal}
                  </span>
                ))}
              </div>
            </div>
            <HeroProductSurface hero={productHero} />
          </div>
        </section>

        <section id="paths" className="scroll-mt-24 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold tracking-[0.24em] text-sky-700 uppercase">
              Choose your workflow
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950">
              One product, three rental operations paths.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              DominionDesk adapts to how you operate: owning a few rentals, running a portfolio, or
              placing tenants for landlords.
            </p>
            <div className="mt-10">
              <AudiencePathGrid paths={audiencePaths} />
            </div>
          </div>
        </section>

        <section id="lifecycle" className="scroll-mt-24 bg-slate-100 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold tracking-[0.24em] text-sky-700 uppercase">
              Lifecycle rail
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-slate-950">
              From mandate to reports, every handoff stays visible.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Placement and management live in the same operational line, so agencies and landlords
              do not lose context when a prospect becomes a tenant.
            </p>
            <div className="mt-10">
              <LifecycleRail stages={lifecycleStages} />
            </div>
          </div>
        </section>

        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {featureSuites.map((suite) => (
              <FeatureSuiteSection key={suite.id} suite={suite} />
            ))}
          </div>
        </div>

        <PricingSection plans={pricingPlans} />
        <FaqSection items={faqItems} />

        <section className="bg-[#08233F] py-20 text-white">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-xs font-bold tracking-[0.24em] text-sky-300 uppercase">
              Founding access
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">
              Move DominionDesk from project to product with your first live workflows.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-200">
              Start with the workflows you use today, then grow into placement, portal, financial,
              and operations control as your portfolio or agency expands.
            </p>
            <Link
              href={productHero.primaryCta.href}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-[#F59E0B] px-6 text-base font-semibold text-white shadow-xl shadow-amber-500/20 transition hover:bg-amber-600"
            >
              {productHero.primaryCta.label}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-10 text-slate-400">
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
