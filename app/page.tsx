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
  Star,
  MessagesSquare,
  AlertCircle,
  Globe,
  Sparkles,
  CheckCircle,
  Menu,
  X as XIcon,
  Zap,
  DollarSign,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  TrendingUp,
  Clock,
  Download,
  MessageSquare,
} from 'lucide-react';
import { Button } from './components/Button';
import { Card } from './components/Card';

// --- Types & Data ---

interface Testimonial {
  name: string;
  role: string;
  properties: string;
  content: string;
  rating: number;
  result: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Michael T.',
    role: 'Airbnb Host',
    properties: '8 short-term rentals in Cape Town',
    content:
      'I was managing everything through WhatsApp and Google Calendar. The stress was unbearable. Since switching to DominionDesk, I have had ZERO double-bookings, and my 5-star ratings went from 73% to 96%.',
    rating: 5,
    result: '+23% in 5-star ratings',
  },
  {
    name: 'Nombuso M.',
    role: 'Residential Landlord',
    properties: '12 long-term rentals in JHB',
    content:
      'Late rent payments were killing my cash flow. I spent hours chasing tenants. Now, automated reminders mean I get paid on time 9 out of 10 times. The system has paid for itself 10x over.',
    rating: 5,
    result: '90% on-time payments',
  },
  {
    name: 'David K.',
    role: 'Property Investor',
    properties: '5 mixed portfolio in Durban',
    content:
      'We were drowning in paperwork. DominionDesk gave us our lives back. What used to take 15 hours a week now takes 2 hours. We have added 3 more properties because we can actually handle them now.',
    rating: 5,
    result: 'Saved 13 hours/week',
  },
];

const featuresList = {
  shortTerm: [
    {
      title: 'Unified Inbox',
      desc: 'WhatsApp, Airbnb, Booking.com messages in one place.',
      icon: MessagesSquare,
    },
    {
      title: 'Smart Calendar',
      desc: 'Prevent double-bookings automatically across all platforms.',
      icon: Calendar,
    },
    {
      title: 'Auto-Reviews',
      desc: 'Automatically review guests to boost your own profile.',
      icon: Star,
    },
    {
      title: 'Cleaner Scheduling',
      desc: 'Auto-notify cleaning teams when guests check out.',
      icon: Sparkles,
    },
  ],
  longTerm: [
    {
      title: 'Rent Collection',
      desc: 'Automated invoices and reminders via SMS/Email.',
      icon: CreditCard,
    },
    {
      title: 'Tenant Portal',
      desc: 'Tenants can log maintenance issues and view leases.',
      icon: Users,
    },
    {
      title: 'Expense Tracking',
      desc: 'Scan receipts and categorize for tax season.',
      icon: BarChart3,
    },
    {
      title: 'Document Vault',
      desc: 'Securely store FICA docs, leases, and inspections.',
      icon: FileText,
    },
  ],
};

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
          <ChevronUp className="h-5 w-5 text-slate-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-500" />
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

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'shortTerm' | 'longTerm'>('shortTerm');
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
      {/* Promotional Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 py-2.5 text-center text-sm font-semibold text-white">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span>Launch Special: Get 50% Off Your First 3 Months - Limited Time Only!</span>
          <Sparkles className="h-4 w-4" />
        </div>
      </div>

      {/* Navigation */}
      <header
        className={`fixed top-10 right-0 left-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md' : 'bg-transparent'}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="from-brand-600 to-brand-700 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span
                className={`text-xl font-bold tracking-tight ${scrolled ? 'text-slate-900' : 'text-slate-900 lg:text-white'}`}
              >
                DominionDesk
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-8 md:flex">
              {['Features', 'Pricing', 'Testimonials', 'FAQ'].map((item) => (
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
              <Link href="/contact">
                <Button variant="ghost" size="sm">
                  Contact Us
                </Button>
              </Link>
              <Link href="/contact">
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
            {['Features', 'Pricing', 'Testimonials'].map((item) => (
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
            <Link href="/contact" className="block">
              <Button fullWidth variant="secondary">
                Contact Us
              </Button>
            </Link>
            <Link href="/contact" className="block">
              <Button fullWidth variant="primary">
                Get Started Free
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 pt-32 pb-20 lg:pt-48 lg:pb-32">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-50"></div>

        <div
          className={`relative z-10 mx-auto max-w-7xl transform px-4 text-center transition-all duration-1000 ease-out sm:px-6 lg:px-8 ${heroLoaded ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
        >
          {/* Trust Badge with Rating */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <div className="text-slate-300">
              <span className="font-bold text-white">4.9/5</span> from 127+ property managers
            </div>
          </div>

          <div className="bg-brand-500/10 border-brand-500/20 text-brand-300 mb-8 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium backdrop-blur-sm">
            <Sparkles className="text-brand-400 h-4 w-4" />
            <span>Trusted by 500+ SA Property Managers</span>
          </div>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl">
            Stop Losing Money to <br className="hidden md:block" />
            <span className="from-brand-300 bg-gradient-to-r to-white bg-clip-text text-transparent">
              Chaos & Admin Work
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
            DominionDesk is the all-in-one CRM built specifically for South African{' '}
            <span className="font-semibold text-white">landlords</span> and{' '}
            <span className="font-semibold text-white">Airbnb hosts</span>. Automate rent, prevent
            double-bookings, and get your weekends back.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/contact" className="w-full sm:w-auto">
              <Button size="xl" variant="accent" className="group w-full">
                Start Your Free 14-Day Trial
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/contact" className="w-full sm:w-auto">
              <Button size="xl" variant="outline" className="w-full gap-2">
                <PlayCircle className="h-5 w-5" />
                Watch 2-Min Demo
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-400">
            <span className="flex items-center gap-2">
              <CheckCircle className="text-brand-400 h-4 w-4" /> No credit card required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="text-brand-400 h-4 w-4" /> Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="text-brand-400 h-4 w-4" /> Built for SA Market
            </span>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats Bar */}
      <section className="relative z-20 mx-4 -mt-10 max-w-6xl md:mx-8 lg:mx-auto">
        <RevealOnScroll delay={200}>
          <div className="rounded-2xl border-b border-slate-200 bg-white p-8 shadow-xl lg:p-12">
            <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
              <div>
                <div className="text-3xl font-bold text-slate-900 md:text-4xl">R4.2M+</div>
                <div className="mt-1 text-sm font-medium tracking-wide text-slate-500 uppercase">
                  Rent Processed
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 md:text-4xl">98%</div>
                <div className="mt-1 text-sm font-medium tracking-wide text-slate-500 uppercase">
                  Occupancy Rate
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 md:text-4xl">13hrs</div>
                <div className="mt-1 text-sm font-medium tracking-wide text-slate-500 uppercase">
                  Saved Per Week
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 md:text-4xl">Zero</div>
                <div className="mt-1 text-sm font-medium tracking-wide text-slate-500 uppercase">
                  Double Bookings
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* Product Showcase with Laptop Mockup */}
      <section className="bg-slate-50 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <Badge color="blue">See It In Action</Badge>
              <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
                Everything You Need in One Beautiful Dashboard
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                Manage your entire property portfolio from a single, intuitive interface. No more
                juggling between apps.
              </p>
            </div>
          </RevealOnScroll>

          {/* Main Dashboard Mockup */}
          <RevealOnScroll delay={200}>
            <div className="relative mx-auto max-w-5xl">
              {/* Laptop Frame */}
              <div className="relative rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-2 shadow-2xl sm:p-3">
                <div className="rounded-lg bg-slate-900 p-0.5 sm:p-1">
                  <Image
                    src="/mockups/mockup-dashboard.png"
                    alt="DominionDesk Dashboard"
                    width={1200}
                    height={675}
                    className="rounded-lg shadow-xl"
                    priority
                    unoptimized
                  />
                </div>
              </div>

              {/* Floating Feature Cards */}
              <div className="absolute top-1/4 -left-4 hidden lg:block">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Monthly Revenue</div>
                      <div className="text-lg font-bold text-slate-900">+32%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/3 -right-4 hidden lg:block">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Time Saved</div>
                      <div className="text-lg font-bold text-slate-900">13hrs/wk</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* How It Works - Step by Step */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <Badge color="blue">Simple Setup</Badge>
              <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
                From Setup to Success in Minutes
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                No technical skills required. Follow these simple steps and start saving time today.
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
                    src="/mockups/Properties Listing.jpg"
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
                    src="/mockups/Booking Calendar.jpg"
                    alt="Connect Platforms"
                    width={400}
                    height={225}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">Connect Platforms</h3>
                <p className="mt-2 text-slate-600">
                  Sync your Airbnb, Booking.com calendars. Never worry about double-bookings again.
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
                    src="/mockups/Communications.jpg"
                    alt="Automate Communications"
                    width={400}
                    height={225}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">Automate Everything</h3>
                <p className="mt-2 text-slate-600">
                  Set up automated rent reminders, maintenance alerts, and guest messages.
                </p>
              </div>
            </RevealOnScroll>

            {/* Step 4 - Add Tenants */}
            <RevealOnScroll delay={400}>
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-2xl font-bold text-white shadow-lg">
                  4
                </div>
                <div className="aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-md">
                  <Image
                    src="/mockups/Tenant Listing.jpg"
                    alt="Manage Tenants"
                    width={400}
                    height={225}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">Add & Manage Tenants</h3>
                <p className="mt-2 text-slate-600">
                  Store tenant details, track leases, and manage relationships all in one place.
                </p>
              </div>
            </RevealOnScroll>

            {/* Step 5 - Tenant Portal */}
            <RevealOnScroll delay={500}>
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-2xl font-bold text-white shadow-lg">
                  5
                </div>
                <div className="aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-md">
                  <Image
                    src="/mockups/Communications.jpg"
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

            {/* Step 6 - Track Revenue */}
            <RevealOnScroll delay={600}>
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 text-2xl font-bold text-white shadow-lg">
                  6
                </div>
                <div className="aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-md">
                  <Image
                    src="/mockups/Financials.jpg"
                    alt="Track Revenue"
                    width={400}
                    height={225}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900">Watch Revenue Grow</h3>
                <p className="mt-2 text-slate-600">
                  Real-time financial reports, expense tracking, and insights to maximize your
                  profits.
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Problem Section (Pain Points) */}
      <section className="bg-slate-50 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <Badge color="amber">The Reality Check</Badge>
              <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
                Running Properties Shouldn't <br /> Feel Like a Full-Time Crisis.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                If you're using Excel, WhatsApp, and mental notes to manage your portfolio, you're
                bleeding time and money.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-6 md:grid-cols-2 lg:gap-12">
            {/* Old Way */}
            <RevealOnScroll delay={100}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-red-100 bg-white p-8 shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                  <AlertCircle className="h-32 w-32 text-red-500" />
                </div>
                <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-red-600">
                  <XIcon className="h-6 w-6" /> The Manual Way
                </h3>
                <ul className="space-y-4">
                  {[
                    'Drowning in WhatsApp groups & lost messages',
                    'Late rent payments impacting cash flow',
                    'Double-bookings killing Airbnb ratings',
                    'Scrambling for receipts during tax season',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600">
                      <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>

            {/* New Way */}
            <RevealOnScroll delay={300}>
              <div className="border-brand-100 ring-brand-200 relative h-full overflow-hidden rounded-2xl border bg-white p-8 shadow-lg ring-1">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <CheckCircle2 className="text-brand-500 h-32 w-32" />
                </div>
                <h3 className="text-brand-600 mb-6 flex items-center gap-2 text-xl font-bold">
                  <CheckCircle className="h-6 w-6" /> The DominionDesk Way
                </h3>
                <ul className="space-y-4">
                  {[
                    'Unified inbox for all tenants & guests',
                    'Automated rent reminders & invoice generation',
                    'Sync calendars across Airbnb, Booking.com & Direct',
                    'One-click financial reports & expense tracking',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 font-medium text-slate-800">
                      <CheckCircle2 className="text-brand-500 h-5 w-5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Before/After Visual Comparison */}
      <section className="bg-white py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <Badge color="green">Real Results</Badge>
              <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
                The Difference Is Clear
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                See how DominionDesk transforms property management from chaotic to streamlined.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Before - Manual Way */}
            <RevealOnScroll delay={100}>
              <div className="overflow-hidden rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
                <div className="border-b border-red-200 bg-red-100 px-6 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <span className="text-sm font-bold text-red-900">The Manual Way</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <XIcon className="mt-1 h-5 w-5 flex-shrink-0 text-red-500" />
                      <div>
                        <div className="font-semibold text-slate-900">Scattered Data</div>
                        <div className="text-sm text-slate-600">
                          Excel files, WhatsApp messages, email threads
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <XIcon className="mt-1 h-5 w-5 flex-shrink-0 text-red-500" />
                      <div>
                        <div className="font-semibold text-slate-900">Manual Everything</div>
                        <div className="text-sm text-slate-600">
                          Hours spent chasing rent, creating invoices
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <XIcon className="mt-1 h-5 w-5 flex-shrink-0 text-red-500" />
                      <div>
                        <div className="font-semibold text-slate-900">Double-Bookings</div>
                        <div className="text-sm text-slate-600">
                          Lost revenue and angry reviews from mistakes
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <XIcon className="mt-1 h-5 w-5 flex-shrink-0 text-red-500" />
                      <div>
                        <div className="font-semibold text-slate-900">No Financial Clarity</div>
                        <div className="text-sm text-slate-600">
                          Guessing profitability, scrambling at tax time
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-700">15+ hours</div>
                      <div className="text-sm text-red-600">wasted per week</div>
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            {/* After - DominionDesk Way */}
            <RevealOnScroll delay={300}>
              <div className="border-brand-500 from-brand-50 overflow-hidden rounded-2xl border-2 bg-gradient-to-br to-white shadow-xl">
                <div className="border-brand-200 bg-brand-100 border-b px-6 py-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-brand-500 h-3 w-3 rounded-full"></div>
                    <span className="text-brand-900 text-sm font-bold">The DominionDesk Way</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="text-brand-600 mt-1 h-5 w-5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">Centralized Hub</div>
                        <div className="text-sm text-slate-600">
                          All properties, tenants, bookings in one dashboard
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="text-brand-600 mt-1 h-5 w-5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">Automated Workflows</div>
                        <div className="text-sm text-slate-600">
                          Auto-reminders, invoices, calendar syncing
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="text-brand-600 mt-1 h-5 w-5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">Smart Sync</div>
                        <div className="text-sm text-slate-600">
                          Zero double-bookings with real-time calendar sync
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="text-brand-600 mt-1 h-5 w-5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-slate-900">Financial Insights</div>
                        <div className="text-sm text-slate-600">
                          Real-time reports, expense tracking, tax-ready exports
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-brand-200 bg-brand-50 mt-6 rounded-lg border p-4">
                    <div className="text-center">
                      <div className="text-brand-700 text-2xl font-bold">2 hours</div>
                      <div className="text-brand-600 text-sm">per week (87% time savings)</div>
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* Mobile Mockup Preview */}
          <RevealOnScroll delay={400}>
            <div className="mt-16 text-center">
              <p className="mb-8 text-lg font-semibold text-slate-700">
                Manage everything on the go with our mobile app
              </p>
              <div className="mx-auto max-w-xs">
                <div className="overflow-hidden rounded-3xl border-8 border-slate-900 bg-slate-900 shadow-2xl">
                  <Image
                    src="/mockups/Mobile Dashboard.jpg"
                    alt="Mobile Dashboard"
                    width={300}
                    height={650}
                    className="w-full"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Features by Persona (Tabbed) */}
      <section id="features" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <Badge color="blue">Features</Badge>
              <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
                Tailored to Your Portfolio
              </h2>
            </div>
          </RevealOnScroll>

          {/* Tabs */}
          <RevealOnScroll delay={100}>
            <div className="mb-12 flex justify-center">
              <div className="inline-flex rounded-xl bg-slate-100 p-1.5">
                <button
                  onClick={() => setActiveTab('shortTerm')}
                  className={`rounded-lg px-6 py-3 text-sm font-bold transition-all ${activeTab === 'shortTerm' ? 'text-brand-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Airbnb & Short Term
                </button>
                <button
                  onClick={() => setActiveTab('longTerm')}
                  className={`rounded-lg px-6 py-3 text-sm font-bold transition-all ${activeTab === 'longTerm' ? 'text-brand-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Residential & Long Term
                </button>
              </div>
            </div>
          </RevealOnScroll>

          {/* Feature Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {featuresList[activeTab].map((feature, idx) => (
              <RevealOnScroll key={idx} delay={idx * 100}>
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

      {/* SA Specific Benefits */}
      <section className="relative overflow-hidden bg-slate-900 py-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <RevealOnScroll>
              <div>
                <h2 className="mb-6 text-3xl font-bold md:text-4xl">
                  Built for the South African Reality
                </h2>
                <p className="mb-8 text-lg text-slate-300">
                  Global tools don't understand our unique challenges. DominionDesk does.
                </p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
                      <DollarSign className="text-brand-400 h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Native ZAR Support</h3>
                      <p className="text-sm text-slate-400">
                        No currency conversion headaches. Reports generated in Rand.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
                      <Shield className="text-brand-400 h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">POPIA Compliant</h3>
                      <p className="text-sm text-slate-400">
                        Secure local data handling to keep you on the right side of the law.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
                      <Zap className="text-brand-400 h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Loadshedding Proof</h3>
                      <p className="text-sm text-slate-400">
                        Offline-first mobile app so you can access tenant info even when the grid is
                        down.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={300}>
              <div className="relative">
                {/* Mobile Mockup with SA Badge */}
                <div className="relative mx-auto max-w-xs">
                  <div className="from-brand-500 rotate-2 rounded-3xl bg-gradient-to-br to-purple-600 p-1 shadow-2xl transition-transform duration-500 hover:rotate-0">
                    <div className="overflow-hidden rounded-2xl bg-slate-900">
                      <Image
                        src="/mockups/Mobile Dashboard.jpg"
                        alt="Mobile Dashboard"
                        width={300}
                        height={500}
                        className="h-auto w-full object-cover"
                        unoptimized
                      />
                    </div>
                  </div>

                  {/* Made in SA Badge */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                    <div className="from-brand-500 to-brand-600 flex items-center gap-2 rounded-full bg-gradient-to-r px-6 py-3 shadow-xl">
                      <Globe className="h-5 w-5 text-white" />
                      <span className="text-sm font-bold text-white">Made in SA with ❤️</span>
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
                Don't Just Take Our Word For It
              </h2>
              <p className="mt-4 text-slate-600">
                Join 500+ happy property managers across the country.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <RevealOnScroll key={i} delay={i * 150}>
                <Card className="relative h-full bg-white">
                  <div className="mb-4 flex gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="mb-6 text-slate-700 italic">"{t.content}"</p>
                  <div className="mt-auto border-t border-slate-100 pt-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.role}</p>
                      </div>
                      <div className="rounded bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                        {t.result}
                      </div>
                    </div>
                  </div>
                </Card>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-slate-100 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <Badge color="green">Transparent Pricing</Badge>
              <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
                Pay for what you use
              </h2>
              <p className="mt-4 text-slate-600">
                Simple monthly pricing in ZAR. No hidden fees. 14-day free trial.
              </p>
            </div>
          </RevealOnScroll>

          <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-3">
            {/* Starter */}
            <RevealOnScroll delay={100}>
              <div className="h-full rounded-2xl border border-slate-200 p-8">
                <h3 className="text-lg font-semibold text-slate-900">Starter</h3>
                <div className="my-4 flex items-baseline">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">R299</span>
                  <span className="text-sm text-slate-500">/month</span>
                </div>
                <p className="mb-6 text-sm text-slate-500">
                  Perfect for getting started with up to 5 properties.
                </p>
                <Link href="/contact" className="block">
                  <Button fullWidth variant="secondary">
                    Start Free Trial
                  </Button>
                </Link>
                <ul className="mt-8 space-y-3 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <CheckCircle2 className="text-brand-600 h-4 w-4" /> Up to 5 Properties
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="text-brand-600 h-4 w-4" /> Standard Support
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="text-brand-600 h-4 w-4" /> Basic Reports
                  </li>
                </ul>
              </div>
            </RevealOnScroll>

            {/* Pro - Highlighted */}
            <RevealOnScroll delay={200}>
              <div className="border-brand-500 bg-brand-50/30 shadow-brand-100 relative h-full rounded-2xl border-2 p-8 shadow-2xl lg:-mt-4 lg:mb-4">
                <div className="bg-brand-500 absolute top-0 right-0 translate-x-2 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-bold tracking-wide text-white uppercase">
                  Most Popular
                </div>
                <h3 className="text-brand-700 text-lg font-semibold">Professional</h3>
                <div className="my-4 flex items-baseline">
                  <span className="text-4xl font-bold tracking-tight text-slate-900">R599</span>
                  <span className="text-sm text-slate-500">/month</span>
                </div>
                <p className="mb-6 text-sm text-slate-500">
                  For growing portfolios (6-20 properties).
                </p>
                <Link href="/contact" className="block">
                  <Button fullWidth variant="primary">
                    Start Free Trial
                  </Button>
                </Link>
                <ul className="mt-8 space-y-3 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <CheckCircle2 className="text-brand-600 h-4 w-4" /> Up to 20 Properties
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="text-brand-600 h-4 w-4" />{' '}
                    <strong>Automated Payment Reminders</strong>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="text-brand-600 h-4 w-4" />{' '}
                    <strong>Smart Calendar Sync</strong>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="text-brand-600 h-4 w-4" /> Tenant Portal Access
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="text-brand-600 h-4 w-4" /> Priority Email Support
                  </li>
                </ul>
              </div>
            </RevealOnScroll>

            {/* Enterprise */}
            <RevealOnScroll delay={300}>
              <div className="h-full rounded-2xl border border-slate-200 p-8">
                <h3 className="text-lg font-semibold text-slate-900">Enterprise</h3>
                <div className="my-4 flex items-baseline">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">R999</span>
                  <span className="text-sm text-slate-500">/month</span>
                </div>
                <p className="mb-6 text-sm text-slate-500">
                  Unlimited properties and advanced team features.
                </p>
                <Link href="/contact" className="block">
                  <Button fullWidth variant="secondary">
                    Contact Sales
                  </Button>
                </Link>
                <ul className="mt-8 space-y-3 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <CheckCircle2 className="text-brand-600 h-4 w-4" /> Unlimited Properties
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="text-brand-600 h-4 w-4" /> Multi-user Management
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="text-brand-600 h-4 w-4" /> API Access
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="text-brand-600 h-4 w-4" /> Phone Support
                  </li>
                </ul>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-slate-900">Common Questions</h2>
            </div>
          </RevealOnScroll>

          <div className="space-y-2">
            {[
              {
                question: 'Do I need technical skills?',
                answer:
                  'None at all. If you can use WhatsApp or Facebook, you can use DominionDesk. Our interface is designed to be dead simple.',
              },
              {
                question: 'Can I manage both Airbnb and Long-term rentals?',
                answer:
                  'Yes! That is exactly what it is built for. Manage short-term vacation rentals alongside traditional long-term leases. The system adapts to each property type automatically.',
              },
              {
                question: 'What happens if I cancel?',
                answer:
                  'You can export all your data (leases, tenant info, expense history) at any time. We will never hold your information hostage.',
              },
              {
                question: 'Is my data secure?',
                answer:
                  'Extremely. We use bank-level encryption and store data on secure servers that comply with SA POPIA regulations.',
              },
            ].map((faq, idx) => (
              <RevealOnScroll key={idx} delay={idx * 50}>
                <FaqItem question={faq.question} answer={faq.answer} />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-600 relative overflow-hidden py-20">
        <div className="bg-brand-500 absolute top-0 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/2 translate-y-1/2 rounded-full bg-purple-500 opacity-50 blur-3xl"></div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <RevealOnScroll>
            <h2 className="mb-6 text-3xl font-bold text-white md:text-5xl">
              Stop managing. Start growing.
            </h2>
            <p className="text-brand-100 mx-auto mb-10 max-w-2xl text-lg md:text-xl">
              Join 500+ South African property managers who have reclaimed their time. Try
              DominionDesk completely risk-free.
            </p>
            <Button
              size="xl"
              variant="accent"
              className="shadow-2xl shadow-slate-900/20 transition-transform hover:scale-105"
            >
              Start Your Free 14-Day Trial
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </RevealOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 py-12 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 flex h-8 w-8 items-center justify-center rounded text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-white">DominionDesk</span>
          </div>

          <div className="flex gap-6 text-sm">
            <a href="#" className="transition-colors hover:text-white">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Terms of Service
            </a>
            <a href="#" className="transition-colors hover:text-white">
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
          <Link href="/contact">
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
