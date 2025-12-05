'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Logo } from '@/components/ui/logo';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    propertyCount: '',
    message: '',
    requestType: 'demo',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        propertyCount: '',
        message: '',
        requestType: 'demo',
      });
    } catch (err) {
      setError('Failed to send message. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center">
              <Logo variant="full" width={160} height={32} />
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                Back to Home
              </Button>
            </Link>
          </div>
        </header>

        {/* Success Message */}
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="mb-4 text-3xl font-bold text-slate-900">Message Sent!</h1>
            <p className="mb-8 text-lg text-slate-600">
              Thank you for contacting us. We'll get back to you within 24 hours.
            </p>
            <Link href="/">
              <Button variant="primary" size="lg">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center">
            <Logo variant="full" width={160} height={32} />
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Info */}
          <div className="lg:col-span-1">
            <h1 className="mb-4 text-3xl font-bold text-slate-900">Get in Touch</h1>
            <p className="mb-8 text-lg text-slate-600">
              Ready to transform your property management? We'd love to hear from you.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-brand-100 flex h-12 w-12 items-center justify-center rounded-lg">
                  <Mail className="text-brand-600 h-6 w-6" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-slate-900">Email</h3>
                  <p className="text-slate-600">comfynyatsine@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-brand-100 flex h-12 w-12 items-center justify-center rounded-lg">
                  <MapPin className="text-brand-600 h-6 w-6" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-slate-900">Location</h3>
                  <p className="text-slate-600">South Africa</p>
                </div>
              </div>
            </div>

            <div className="bg-brand-50 mt-8 rounded-lg p-6">
              <h3 className="text-brand-900 mb-2 font-semibold">Quick Response</h3>
              <p className="text-brand-700 text-sm">
                We typically respond within 24 hours during business days.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="requestType"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    I'm interested in
                  </label>
                  <select
                    id="requestType"
                    name="requestType"
                    value={formData.requestType}
                    onChange={handleChange}
                    className="focus:border-brand-500 focus:ring-brand-500/20 w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:outline-none"
                    required
                  >
                    <option value="demo">Requesting a Demo</option>
                    <option value="trial">Starting a Free Trial</option>
                    <option value="pricing">Pricing Information</option>
                    <option value="support">Technical Support</option>
                    <option value="other">General Inquiry</option>
                  </select>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="focus:border-brand-500 focus:ring-brand-500/20 w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="focus:border-brand-500 focus:ring-brand-500/20 w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+27 12 345 6789"
                      className="focus:border-brand-500 focus:ring-brand-500/20 w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="company"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Company/Agency Name
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="focus:border-brand-500 focus:ring-brand-500/20 w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="propertyCount"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Number of Properties
                  </label>
                  <select
                    id="propertyCount"
                    name="propertyCount"
                    value={formData.propertyCount}
                    onChange={handleChange}
                    className="focus:border-brand-500 focus:ring-brand-500/20 w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:outline-none"
                  >
                    <option value="">Select range</option>
                    <option value="1-5">1-5 properties</option>
                    <option value="6-20">6-20 properties</option>
                    <option value="21-50">21-50 properties</option>
                    <option value="50+">50+ properties</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="focus:border-brand-500 focus:ring-brand-500/20 w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:outline-none"
                    placeholder="Tell us about your needs..."
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
                )}

                <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
