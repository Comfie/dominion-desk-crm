'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Shield,
  MessagesSquare,
  AlertCircle,
  CheckCircle,
  Menu,
  X as XIcon,
  Zap,
  DollarSign,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  TrendingUp,
  Download,
  Star,
  Sparkles,
  MessageSquare,
  Globe,
  Phone,
  Wrench,
  FileSearch,
  Clock,
  TrendingDown,
  Table2,
} from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

// --- Types & Data ---

const featuresList = {
  longTerm: [
    {
      title: 'Automated Rent Reminders',
      desc: 'Set it once. DominionDesk sends payment reminders via email automatically, 7 days before and on due date. No more awkward "just checking in" messages.',
      icon: CreditCard,
    },
    {
      title: 'Tenant Portal',
      desc: 'Tenants get their own login. They view invoices, upload proof of payment, log maintenance, and access their lease documents. You get less admin. They get transparency.',
      icon: Users,
    },
    {
      title: 'Proof of Payment Upload',
      desc: 'Tenants upload their EFT proof directly. You see it instantly and mark the payment as received. No more emailing back and forth.',
      icon: CheckCircle2,
    },
    {
      title: 'Expense & Tax Tracking',
      desc: 'Log every expense per property. Mark items as tax-deductible. Generate a full annual tax summary report with one click.',
      icon: BarChart3,
    },
    {
      title: 'Document Vault',
      desc: 'Store leases, FICA docs, inspection reports, and insurance documents per property and per tenant. Organised, searchable, always accessible.',
      icon: FileText,
    },
    {
      title: '9 Financial Reports',
      desc: 'Revenue, payments, cash flow, maintenance costs, occupancy, aging, leases, and more. All exportable to CSV for your accountant.',
      icon: Download,
    },
  ],
  shortTerm: [
    {
      title: 'Booking Management',
      desc: 'Create and manage bookings with full guest details, pricing calculation, and status tracking (pending → confirmed → checked-in → completed).',
      icon: Calendar,
    },
    {
      title: 'Availability & Conflict Detection',
      desc: 'The system automatically blocks conflicting dates and warns you before a double-booking can happen.',
      icon: AlertCircle,
    },
    {
      title: 'Guest Communication',
      desc: 'Send booking confirmations, check-in instructions, and follow-up messages. Set up automation rules triggered by booking events.',
      icon: MessagesSquare,
    },
    {
      title: 'Inquiry Pipeline',
      desc: 'Track every inquiry from every source (direct, Airbnb, WhatsApp). Convert inquiries to bookings in one click. Never lose a lead again.',
      icon: TrendingUp,
    },
    {
      title: 'Cleaning Fee & Pricing Rules',
      desc: 'Configure base rates, cleaning fees, and seasonal pricing per property. Automatic total calculation for every booking.',
      icon: Sparkles,
    },
    {
      title: 'Booking Reports',
      desc: "Revenue per property, occupancy rates, booking sources breakdown, and average daily rate. Know exactly what's working.",
      icon: BarChart3,
    },
  ],
};

const painPoints = [
  { icon: MessageSquare, text: 'Chasing tenants on WhatsApp every month for rent' },
  { icon: Table2, text: 'Managing your portfolio on Excel spreadsheets' },
  { icon: Wrench, text: 'Maintenance requests getting lost in your inbox' },
  { icon: FileSearch, text: 'Scrambling to find documents at tax time' },
  { icon: Clock, text: 'Sending manual payment reminders one by one' },
  { icon: TrendingDown, text: 'No idea which property is actually profitable' },
];

const faqItems = [
  {
    question: 'Do I need technical skills to set up DominionDesk?',
    answer:
      'None at all. If you can use WhatsApp or Excel, you can use DominionDesk. Most landlords are fully set up within 10 minutes. We also offer email support if you need a hand.',
  },
  {
    question: 'How does the 2-month free trial work?',
    answer:
      'Sign up, add up to 2 properties, and use every feature completely free for 2 months. No credit card required. At the end of your trial, you can subscribe to continue or export all your data and leave — no hard feelings.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer:
      "It's yours. You can export all tenant information, payment history, documents, and reports at any time in CSV format. We will never hold your data hostage or delete it without notice.",
  },
  {
    question: 'Does it work for both Airbnb and long-term rentals?',
    answer:
      "Yes — that's exactly what it's built for. You can manage short-term bookings and long-term leases from the same dashboard. Each property can be configured for its rental type.",
  },
  {
    question: 'How does the tenant portal work?',
    answer:
      'Tenants receive an email invitation to create their own login. From their portal, they can view invoices, upload proof of EFT payment, log maintenance requests, and access their lease documents. You stay in control of what they can see.',
  },
  {
    question: 'Is my data secure?',
    answer:
      "Yes. All data is stored on encrypted, cloud-hosted servers. Access is role-based — only you and the team members you invite can see your data. We comply with South Africa's POPIA regulations.",
  },
  {
    question: 'What payment methods do tenants use?',
    answer:
      'Currently EFT (the standard in SA). Tenants transfer rent to your bank account and upload proof of payment through their portal. You confirm receipt and the system updates automatically. Online card payments are coming soon.',
  },
];

// --- Helper Components ---

const RevealOnScroll = ({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transform transition-all duration-1000 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
};

const Badge = ({
  children,
  color = 'blue',
}: {
  children?: React.ReactNode;
  color?: 'blue' | 'amber' | 'green';
}) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    green: 'bg-green-100 text-green-800 border-green-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[color]}`}
    >
      {children}
    </span>
  );
};

const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        className="hover:text-brand-600 flex w-full items-center justify-between py-4 text-left font-medium text-slate-900 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {question}
        {isOpen ? (
          <ChevronUp className="h-5 w-5 flex-shrink-0 text-slate-500" />
        ) : (
          <ChevronDown className="h-5 w-5 flex-shrink-0 text-slate-500" />
        )}
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] pb-4 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden leading-relaxed text-slate-600">{answer}</div>
      </div>
    </div>
  );
};

// --- Main App ---

export function LandingPageClient() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'shortTerm' | 'longTerm'>('longTerm');
  const [scrolled, setScrolled] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    setHeroLoaded(true);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="selection:bg-brand-200 min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <header
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md' : 'bg-transparent'}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center">
              <img
                src={scrolled ? '/logos/logo-light.svg' : '/logos/logo-dark.svg'}
                alt="DominionDesk"
                width={160}
                height={32}
                className="h-8 w-auto"
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-8 md:flex">
              {['Features', 'Pricing', 'FAQ'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className={`hover:text-brand-500 text-sm font-medium transition-colors ${scrolled ? 'text-slate-600' : 'text-slate-100 hover:text-white'}`}
                >
                  {item}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-4 md:flex">
              <a
                href="/login"
                className={`text-sm font-semibold ${scrolled ? 'text-slate-900' : 'text-white'}`}
              >
                Log in
              </a>
              <Link href="/register">
                <Button variant="accent" size="sm">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="p-2 text-slate-600 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <XIcon />
              ) : (
                <Menu className={scrolled ? 'text-slate-900' : 'text-slate-900 lg:text-white'} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <div className="animate-in slide-in-from-top-5 absolute flex w-full flex-col gap-4 border-t border-slate-100 bg-white p-4 shadow-xl md:hidden">
            {['Features', 'Pricing', 'FAQ'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 text-base font-medium text-slate-600"
              >
                {item}
              </a>
            ))}
            <div className="my-2 h-px bg-slate-100" />
            <Link href="/login" className="block">
              <Button fullWidth variant="secondary">
                Log In
              </Button>
            </Link>
            <Link href="/register" className="block">
              <Button fullWidth variant="primary">
                Start Free Trial
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* ─── SECTION 1: HERO ─── */}
      <section className="relative overflow-hidden bg-slate-900 pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay transition-transform duration-300"
          style={{ transform: `translateY(${scrolled ? '20px' : '0px'})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-50"></div>

        <div className="animate-float-slow from-brand-500/20 absolute top-20 left-10 h-72 w-72 rounded-full bg-gradient-to-r to-purple-500/20 blur-3xl"></div>
        <div className="animate-float absolute right-10 bottom-20 h-96 w-96 rounded-full bg-gradient-to-l from-cyan-500/15 to-blue-500/15 blur-3xl"></div>

        <div
          className={`relative z-10 mx-auto max-w-7xl transform px-4 text-center transition-all duration-1000 ease-out sm:px-6 lg:px-8 ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
        >
          {/* Honest founding member badge */}
          <div
            className={`mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-300 backdrop-blur-sm transition-all duration-700 ${heroLoaded ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
            style={{ transitionDelay: '200ms' }}
          >
            <Star className="h-4 w-4 text-amber-400" />
            <span>Be one of our founding members — free access for 2 months</span>
          </div>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl">
            <span
              className={`inline-block transition-all duration-700 ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              style={{ transitionDelay: '400ms' }}
            >
              Stop Chasing Rent.
            </span>
            <br className="hidden md:block" />
            <span
              className={`from-brand-300 inline-block bg-gradient-to-r to-white bg-clip-text text-transparent transition-all duration-700 ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              style={{ transitionDelay: '600ms' }}
            >
              Start Building Wealth.
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
            DominionDesk is the all-in-one property management platform built specifically for South
            African landlords. Automate rent reminders, manage tenants, track maintenance, and
            generate tax-ready reports — all from one dashboard.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                size="xl"
                variant="accent"
                className="group w-full shadow-lg shadow-amber-500/25"
              >
                Get 2 Months Free — No Card Needed
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/demo" className="w-full sm:w-auto">
              <Button
                size="xl"
                variant="outline"
                className="w-full gap-2 border-white/30 text-white hover:bg-white/10"
              >
                <PlayCircle className="h-5 w-5" />
                See a 2-Minute Demo
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm font-semibold">
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white backdrop-blur-sm">
              <CheckCircle className="h-4 w-4 text-green-400" /> No credit card required
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white backdrop-blur-sm">
              <CheckCircle className="h-4 w-4 text-green-400" /> Up to 2 properties free
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white backdrop-blur-sm">
              <CheckCircle className="h-4 w-4 text-green-400" /> Built for South Africa
            </span>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: PAIN POINTS ─── */}
      <section className="bg-slate-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <Badge color="amber">Sound Familiar?</Badge>
              <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
                You Didn&apos;t Become a Landlord <br /> to Become a Full-Time Admin
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                If this sounds familiar, DominionDesk was built for you.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {painPoints.map((point, idx) => (
              <RevealOnScroll key={idx} delay={idx * 80}>
                <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-50">
                    <point.icon className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="pt-1 font-medium text-slate-700">{point.text}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: HOW IT WORKS (setup steps) ─── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <Badge color="blue">Simple Setup</Badge>
              <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
                Everything Running in Under 10 Minutes
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                No technical skills. No long setup. Just add your properties and go.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Step 1 */}
            <RevealOnScroll delay={100}>
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-2xl font-bold text-white shadow-lg">
                  1
                </div>
                <div className="aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-md">
                  <Image
                    src="/mockups/img-property-listing.jpg"
                    alt="Add Properties"
                    width={400}
                    height={225}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">Import Properties</h3>
                <p className="mt-2 text-slate-600">
                  Add your properties manually or import from a spreadsheet. Takes less than 5
                  minutes.
                </p>
              </div>
            </RevealOnScroll>

            {/* Step 2 */}
            <RevealOnScroll delay={200}>
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-2xl font-bold text-white shadow-lg">
                  2
                </div>
                <div className="aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-md">
                  <Image
                    src="/mockups/img-tenant-listing.jpg"
                    alt="Add Tenants"
                    width={400}
                    height={225}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">Add Your Tenants</h3>
                <p className="mt-2 text-slate-600">
                  Import tenant information, track lease agreements, and maintain complete tenant
                  records in one centralized system.
                </p>
              </div>
            </RevealOnScroll>

            {/* Step 3 */}
            <RevealOnScroll delay={300}>
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-2xl font-bold text-white shadow-lg">
                  3
                </div>
                <div className="aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-md">
                  <Image
                    src="/mockups/img-financials.jpg"
                    alt="Automate Rent Collection"
                    width={400}
                    height={225}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">Automate Rent Collection</h3>
                <p className="mt-2 text-slate-600">
                  Set up automated rent reminders, invoice generation, and payment tracking. Never
                  chase late payments again.
                </p>
              </div>
            </RevealOnScroll>

            {/* Step 4 */}
            <RevealOnScroll delay={400}>
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-2xl font-bold text-white shadow-lg">
                  4
                </div>
                <div className="aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-md">
                  <Image
                    src="/mockups/img-maintenance.jpg"
                    alt="Maintenance Management"
                    width={400}
                    height={225}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">
                  Track Maintenance Requests
                </h3>
                <p className="mt-2 text-slate-600">
                  Tenants log maintenance issues directly through their portal. Track, assign, and
                  resolve issues efficiently.
                </p>
              </div>
            </RevealOnScroll>

            {/* Step 5 */}
            <RevealOnScroll delay={500}>
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-2xl font-bold text-white shadow-lg">
                  5
                </div>
                <div className="aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-md">
                  <Image
                    src="/mockups/img-documents.jpg"
                    alt="Tenant Portal"
                    width={400}
                    height={225}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">Empower Your Tenants</h3>
                <p className="mt-2 text-slate-600">
                  Tenants get their own portal to receive payment reminders, log maintenance
                  requests, and view lease details.
                </p>
              </div>
            </RevealOnScroll>

            {/* Step 6 */}
            <RevealOnScroll delay={600}>
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 text-2xl font-bold text-white shadow-lg">
                  6
                </div>
                <div className="aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-md">
                  <Image
                    src="/mockups/img-reports-one.jpg"
                    alt="Financial Reports"
                    width={400}
                    height={225}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">
                  Generate Financial Reports
                </h3>
                <p className="mt-2 text-slate-600">
                  Track income, expenses, and profitability across your entire portfolio. Export
                  reports for tax season with one click.
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: FEATURES ─── */}
      <section id="features" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <Badge color="blue">Features</Badge>
              <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
                Everything a South African Landlord Actually Needs
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                No bloat. No features you&apos;ll never use. Just the tools that save you time and
                money.
              </p>
            </div>
          </RevealOnScroll>

          {/* Tabs */}
          <RevealOnScroll delay={100}>
            <div className="mb-12 flex justify-center">
              <div className="inline-flex rounded-xl bg-slate-100 p-1.5">
                <button
                  onClick={() => setActiveTab('longTerm')}
                  className={`rounded-lg px-6 py-3 text-sm font-bold transition-all ${activeTab === 'longTerm' ? 'text-brand-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Long-Term Rentals
                </button>
                <button
                  onClick={() => setActiveTab('shortTerm')}
                  className={`rounded-lg px-6 py-3 text-sm font-bold transition-all ${activeTab === 'shortTerm' ? 'text-brand-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Short-Term / Airbnb
                </button>
              </div>
            </div>
          </RevealOnScroll>

          {/* Feature Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuresList[activeTab].map((feature, idx) => (
              <RevealOnScroll key={`${activeTab}-${idx}`} delay={idx * 80}>
                <Card className="hover:border-brand-200 h-full transition-colors">
                  <div className="bg-brand-50 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                    <feature.icon className="text-brand-600 h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{feature.desc}</p>
                </Card>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: SOCIAL PROOF (HONEST) ─── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <Badge color="green">Built for the South African Rental Reality</Badge>
              <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
                No Fluff. No Made-Up Numbers.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Here&apos;s what DominionDesk actually does.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-8 md:grid-cols-3">
            <RevealOnScroll delay={100}>
              <div className="relative h-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <blockquote className="mb-6 leading-relaxed text-slate-700 italic">
                  &ldquo;Automated rent reminders go out automatically — on whatever day of the
                  month you configure, to every tenant, with a full invoice attached. No manual
                  work.&rdquo;
                </blockquote>
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-sm font-bold text-slate-900">Payment Reminder System</p>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={200}>
              <div className="relative h-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <blockquote className="mb-6 leading-relaxed text-slate-700 italic">
                  &ldquo;Tenants upload proof of payment directly through their portal. You get
                  notified. No more WhatsApp attachments or email threads just to confirm an
                  EFT.&rdquo;
                </blockquote>
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-sm font-bold text-slate-900">Tenant Payment Portal</p>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={300}>
              <div className="relative h-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <blockquote className="mb-6 leading-relaxed text-slate-700 italic">
                  &ldquo;Full expense tracking per property with tax-deductible flags. Export a
                  complete tax summary at year-end. No more spreadsheet chaos in February.&rdquo;
                </blockquote>
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-sm font-bold text-slate-900">Financial Reporting Module</p>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          <RevealOnScroll delay={400}>
            <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-500 italic">
              We&apos;re in early access. Be one of our first founding members and help shape the
              product — free for 2 months, no card needed.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* ─── SECTION 6: SOUTH AFRICA ─── */}
      <section className="relative overflow-hidden bg-slate-900 py-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <Badge color="blue">Made for Mzansi</Badge>
              <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl">
                Built for the South African Reality
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
                International tools don&apos;t get loadshedding, POPIA, or the ZAR. We do — because
                we&apos;re built here, for here.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-4">
            <RevealOnScroll delay={100} className="h-full">
              <div className="h-full rounded-2xl border border-slate-700 bg-slate-800 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-slate-600 bg-slate-700">
                  <DollarSign className="text-brand-400 h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">Native ZAR Support</h3>
                <p className="text-sm text-slate-400">
                  Every report, invoice, and payment is in Rand. No currency conversion. No dollar
                  pricing. Built for local portfolios.
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={200} className="h-full">
              <div className="h-full rounded-2xl border border-slate-700 bg-slate-800 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-slate-600 bg-slate-700">
                  <CreditCard className="text-brand-400 h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">EFT-First Workflow</h3>
                <p className="text-sm text-slate-400">
                  SA landlords run on EFT. Our system is built around it. Tenants upload proof of
                  payment. Landlords confirm. Done.
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={300} className="h-full">
              <div className="h-full rounded-2xl border border-slate-700 bg-slate-800 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-slate-600 bg-slate-700">
                  <Shield className="text-brand-400 h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">POPIA-Aware Data Handling</h3>
                <p className="text-sm text-slate-400">
                  Tenant data is stored securely with access controls. You control who sees what. No
                  data sold to third parties. Ever.
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={400} className="h-full">
              <div className="h-full rounded-2xl border border-slate-700 bg-slate-800 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-slate-600 bg-slate-700">
                  <Globe className="text-brand-400 h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-white">Local Support</h3>
                <p className="text-sm text-slate-400">
                  We&apos;re based in South Africa. Same timezone. We understand loadshedding,
                  municipal billing, and the SA rental housing act.
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: PRICING ─── */}
      <section id="pricing" className="border-t border-slate-100 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <Badge color="green">Pricing That Makes Sense</Badge>
              <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Start free. Pay only when you&apos;re ready to grow.
              </p>
            </div>
          </RevealOnScroll>

          <div className="mx-auto grid max-w-6xl items-stretch gap-8 lg:grid-cols-3">
            {/* Free Trial */}
            <RevealOnScroll delay={100} className="h-full">
              <div className="h-full rounded-2xl border border-slate-200 p-8">
                <h3 className="text-lg font-semibold text-slate-900">Free Trial</h3>
                <div className="my-4 flex items-baseline">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">R0</span>
                  <span className="text-sm text-slate-500">&nbsp;/ 2 months</span>
                </div>
                <p className="mb-6 text-sm text-slate-500">
                  Up to 2 properties. Full access. No card.
                </p>
                <Link href="/register" className="block">
                  <Button fullWidth variant="secondary">
                    Start Free Trial
                  </Button>
                </Link>
                <ul className="mt-8 space-y-3 text-sm text-slate-600">
                  {[
                    'Up to 2 properties',
                    'Full feature access',
                    'Tenant portal included',
                    'Financial reports included',
                    'No credit card required',
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="text-brand-600 mt-0.5 h-4 w-4 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>

            {/* Starter - Most Popular */}
            <RevealOnScroll delay={200} className="h-full">
              <div className="border-brand-500 bg-brand-50/30 shadow-brand-100 relative h-full rounded-2xl border-2 p-8 shadow-2xl lg:-mt-6 lg:mb-6">
                <div className="bg-brand-500 absolute top-0 right-0 translate-x-2 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-bold tracking-wide text-white uppercase">
                  Most Popular
                </div>
                <h3 className="text-brand-700 text-lg font-semibold">Starter</h3>
                <div className="my-4 flex items-baseline">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">R299</span>
                  <span className="text-sm text-slate-500">/month</span>
                </div>
                <p className="mb-6 text-sm text-slate-500">
                  Everything you need for up to 2 properties
                </p>
                <Link href="/register" className="block">
                  <Button fullWidth variant="primary">
                    Get Started
                  </Button>
                </Link>
                <ul className="mt-8 space-y-3 text-sm text-slate-600">
                  {[
                    'Up to 2 properties',
                    'Automated payment reminders',
                    'Tenant portal with proof of payment upload',
                    '9 financial reports + CSV export',
                    'Document vault',
                    'Maintenance request tracking',
                    'Email support',
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="text-brand-600 mt-0.5 h-4 w-4 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>

            {/* Growth */}
            <RevealOnScroll delay={300} className="h-full">
              <div className="h-full rounded-2xl border border-slate-200 p-8">
                <h3 className="text-lg font-semibold text-slate-900">Growth</h3>
                <div className="my-4">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold tracking-tight text-slate-900">R299</span>
                    <span className="text-sm text-slate-500">&nbsp;+ 4% of rental income</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Per additional property/month (Min R99 · Max R999)
                  </p>
                </div>
                <p className="mb-6 text-sm text-slate-500">
                  For growing portfolios with 3+ properties
                </p>
                <Link href="/register" className="block">
                  <Button fullWidth variant="secondary">
                    Get Started
                  </Button>
                </Link>
                <ul className="mt-8 space-y-3 text-sm text-slate-600">
                  {[
                    'Everything in Starter',
                    'Unlimited properties',
                    'First 2 properties free (base fee only)',
                    'Multi-tenant per property (room rentals)',
                    'Team member access',
                    'Priority support',
                    'Booking & Airbnb management',
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="text-brand-600 mt-0.5 h-4 w-4 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>
          </div>

          {/* Pricing Example Callout */}
          <RevealOnScroll delay={400}>
            <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
              <p>
                <strong>Example:</strong> You have 5 properties with an average rental income of
                R8,000/month.
              </p>
              <p className="mt-1">
                R299 base + (3 additional properties × R320 [which is 4% of R8k]) ={' '}
                <strong>R1,259/month total</strong>.
              </p>
              <p className="mt-1 text-slate-500">
                That&apos;s less than R252 per property to automate your entire portfolio.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ─── SECTION 8: FAQ ─── */}
      <section id="faq" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-slate-900">Common Questions</h2>
            </div>
          </RevealOnScroll>

          <div className="space-y-2">
            {faqItems.map((faq, idx) => (
              <RevealOnScroll key={idx} delay={idx * 50}>
                <FaqItem question={faq.question} answer={faq.answer} />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 9: FINAL CTA ─── */}
      <section className="relative overflow-hidden bg-slate-950 py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"></div>
        <div className="absolute top-0 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-violet-600/30 to-indigo-600/30 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl"></div>
        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-gradient-to-l from-fuchsia-600/30 to-pink-600/30 blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <RevealOnScroll>
            <h2 className="mb-6 text-3xl font-bold text-white md:text-5xl">
              Your Tenants Won&apos;t Pay Themselves.
              <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                But DominionDesk Can Remind Them.
              </span>
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 md:text-xl">
              Join the founding member group. Get 2 months completely free — no credit card, no
              commitment. Be one of the first landlords to manage their entire portfolio from one
              dashboard built for South Africa.
            </p>
            <Link href="/register">
              <Button
                size="xl"
                variant="accent"
                className="shadow-2xl shadow-amber-500/25 transition-all duration-300 hover:scale-105 hover:shadow-amber-500/40"
              >
                Get 2 Months Free — Start Now
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-400" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-400" /> Set up in under 10 minutes
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-400" /> Cancel anytime, export your data
              </span>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 py-12 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row lg:px-8">
          <Link href="/" className="flex items-center">
            <img
              src="/logos/logo-dark.svg"
              alt="DominionDesk"
              width={160}
              height={32}
              className="h-8 w-auto"
            />
          </Link>

          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
            <a
              href="mailto:support@dominiondesk.com"
              className="transition-colors hover:text-white"
            >
              Contact Support
            </a>
          </div>

          <div className="text-sm">© {new Date().getFullYear()} DominionDesk CRM.</div>
        </div>
      </footer>

      {/* Sticky Floating CTA Buttons */}
      {scrolled && (
        <div className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3">
          {/* WhatsApp Button */}
          <a
            href="https://wa.me/27849192581?text=Hi,%20I'm%20interested%20in%20DominionDesk"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-xl transition-all hover:scale-110 hover:bg-green-600"
            title="Chat on WhatsApp"
          >
            <MessageSquare className="h-6 w-6 text-white" />
          </a>

          {/* Main CTA Button */}
          <Link href="/register">
            <button className="bg-brand-600 hover:bg-brand-700 group flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white shadow-xl transition-all hover:scale-105">
              <span className="hidden sm:inline">Start Free Trial</span>
              <span className="sm:hidden">Try Free</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
