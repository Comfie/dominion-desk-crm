'use client';

import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Bell,
  Shield,
  Smartphone,
  Clock,
  TrendingUp,
  Zap,
  Star,
  MessagesSquare,
  Wrench,
  Home,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Building2,
    title: 'Property Management',
    description:
      'Manage unlimited properties with detailed information, photos, and documents all in one place.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    icon: Users,
    title: 'Tenant Management',
    description:
      'Keep track of all tenant information, lease agreements, and communication history.',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    icon: Calendar,
    title: 'Booking System',
    description:
      'Handle both long-term leases and short-term bookings with an integrated calendar.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    icon: CreditCard,
    title: 'Payment Tracking',
    description:
      'Record payments, generate receipts, and track outstanding balances automatically.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  {
    icon: Wrench,
    title: 'Maintenance Requests',
    description: 'Tenants can submit requests online and you can track progress until completion.',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  {
    icon: FileText,
    title: 'Document Storage',
    description: 'Store leases, contracts, and important documents securely in the cloud.',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  {
    icon: MessagesSquare,
    title: 'Communication Hub',
    description:
      'Send messages, notifications, and reminders to tenants directly from the platform.',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  {
    icon: BarChart3,
    title: 'Financial Reports',
    description: 'Generate income reports, expense tracking, and financial summaries instantly.',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
];

const benefits = [
  {
    icon: Clock,
    title: 'Save 10+ Hours Weekly',
    description: 'Automate repetitive tasks and focus on growing your portfolio.',
  },
  {
    icon: TrendingUp,
    title: 'Increase Revenue',
    description: 'Never miss a payment with automated reminders and tracking.',
  },
  {
    icon: Shield,
    title: 'Reduce Risk',
    description: 'Keep proper records and documentation for legal protection.',
  },
  {
    icon: Smartphone,
    title: 'Access Anywhere',
    description: 'Manage your properties from any device, anytime.',
  },
];

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Property Owner, Cape Town',
    content:
      'This system transformed how I manage my 5 rental properties. What used to take me a whole day now takes an hour!',
    rating: 5,
  },
  {
    name: 'James K.',
    role: 'Property Manager, Johannesburg',
    content:
      'The booking system is fantastic for my short-term rentals. My guests love the seamless experience.',
    rating: 5,
  },
  {
    name: 'Thandi N.',
    role: 'Landlord, Durban',
    content:
      'Finally, a property management system built for South African landlords. The Rand currency support is perfect!',
    rating: 5,
  },
];

const pricingTiers = [
  {
    name: 'Starter',
    price: 'R299',
    period: '/month',
    description: 'Perfect for individual landlords',
    features: [
      'Up to 5 properties',
      'Tenant management',
      'Payment tracking',
      'Basic reports',
      'Email support',
    ],
    popular: false,
  },
  {
    name: 'Professional',
    price: 'R599',
    period: '/month',
    description: 'For growing property portfolios',
    features: [
      'Up to 20 properties',
      'All Starter features',
      'Booking system',
      'Document storage',
      'Priority support',
      'Custom branding',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'R999',
    period: '/month',
    description: 'For property management companies',
    features: [
      'Unlimited properties',
      'All Professional features',
      'Team management',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
    ],
    popular: false,
  },
];

export default function PitchPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold">Property CRM</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/">Browse Properties</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/docs">Documentation</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:py-32">
          <div className="text-center">
            <Badge className="mb-6 bg-white/20 text-white hover:bg-white/30">
              Built for South African Property Managers
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Manage Properties
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Like a Pro
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100 sm:text-xl">
              The all-in-one property management platform that saves you time, increases revenue,
              and gives you complete control over your rental portfolio.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="bg-white px-8 text-blue-700 hover:bg-gray-100" asChild>
                <Link href="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 px-8 text-white hover:bg-white/10"
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-blue-200">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b bg-gray-50 py-12 dark:bg-gray-800/50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 sm:text-4xl">500+</div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Properties Managed
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 sm:text-4xl">98%</div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Customer Satisfaction
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 sm:text-4xl">R2M+</div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">Rent Collected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 sm:text-4xl">10hrs</div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">Saved Weekly</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <Badge variant="outline" className="mb-4">
              Features
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Everything You Need to
              <br />
              <span className="text-blue-600">Manage Properties Efficiently</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600 dark:text-gray-400">
              From tenant screening to financial reporting, our platform handles it all so you can
              focus on what matters most.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group relative overflow-hidden border-0 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <CardContent className="p-6">
                  <div className={`mb-4 inline-flex rounded-lg p-3 ${feature.bgColor}`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20 sm:py-28 dark:from-gray-800 dark:to-gray-900">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-4">
                Benefits
              </Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Why Property Managers
                <br />
                <span className="text-blue-600">Love Our Platform</span>
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Join hundreds of property managers who have transformed their business with our
                powerful, easy-to-use platform.
              </p>

              <div className="mt-8 space-y-6">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <benefit.icon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold">{benefit.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rotate-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600" />
              <div className="relative rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-800">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Home className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Dashboard Overview</div>
                    <div className="text-sm text-gray-500">Real-time insights</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                    <span className="text-sm">Monthly Revenue</span>
                    <span className="font-bold text-green-600">R45,000</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                    <span className="text-sm">Occupancy Rate</span>
                    <span className="font-bold text-blue-600">95%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                    <span className="text-sm">Pending Tasks</span>
                    <span className="font-bold text-orange-600">3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <Badge variant="outline" className="mb-4">
              How It Works
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Get Started in
              <span className="text-blue-600"> 3 Simple Steps</span>
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="relative text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                1
              </div>
              <h3 className="mb-2 text-lg font-semibold">Sign Up Free</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create your account in under 2 minutes. No credit card required.
              </p>
            </div>
            <div className="relative text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                2
              </div>
              <h3 className="mb-2 text-lg font-semibold">Add Your Properties</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Import or manually add your properties with all details and photos.
              </p>
            </div>
            <div className="relative text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                3
              </div>
              <h3 className="mb-2 text-lg font-semibold">Start Managing</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Begin tracking tenants, payments, and maintenance all in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-20 sm:py-28 dark:bg-gray-800/50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <Badge variant="outline" className="mb-4">
              Testimonials
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Trusted by Property Managers
              <span className="text-blue-600"> Across South Africa</span>
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mb-4 text-gray-600 dark:text-gray-400">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center">
            <Badge variant="outline" className="mb-4">
              Pricing
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Simple, Transparent
              <span className="text-blue-600"> Pricing</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600 dark:text-gray-400">
              Choose the plan that fits your portfolio. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={`relative border-0 shadow-lg ${tier.popular ? 'ring-2 ring-blue-600' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{tier.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-gray-500">{tier.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`mt-6 w-full ${tier.popular ? '' : 'variant-outline'}`}
                    variant={tier.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href="/register">Start Free Trial</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to Transform Your Property Management?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-blue-100">
            Join hundreds of property managers who are saving time and increasing revenue with our
            platform.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="bg-white px-8 text-blue-700 hover:bg-gray-100" asChild>
              <Link href="/register">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 px-8 text-white hover:bg-white/10"
              asChild
            >
              <Link href="/">Browse Properties</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span className="font-semibold">Property CRM</span>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Property CRM. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm text-gray-500">
              <Link href="#" className="hover:text-blue-600">
                Privacy
              </Link>
              <Link href="#" className="hover:text-blue-600">
                Terms
              </Link>
              <Link href="#" className="hover:text-blue-600">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
