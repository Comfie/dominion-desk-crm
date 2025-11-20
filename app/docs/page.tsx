'use client';

import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  Home,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Wrench,
  MessageSquare,
  BarChart3,
  Settings,
  Globe,
  Shield,
  HelpCircle,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const sections = [
  { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
  { id: 'dashboard', title: 'Dashboard Overview', icon: Home },
  { id: 'properties', title: 'Property Management', icon: Building2 },
  { id: 'tenants', title: 'Tenant Management', icon: Users },
  { id: 'bookings', title: 'Booking System', icon: Calendar },
  { id: 'payments', title: 'Payment Tracking', icon: CreditCard },
  { id: 'maintenance', title: 'Maintenance Requests', icon: Wrench },
  { id: 'documents', title: 'Document Storage', icon: FileText },
  { id: 'messages', title: 'Communication', icon: MessageSquare },
  { id: 'reports', title: 'Financial Reports', icon: BarChart3 },
  { id: 'settings', title: 'Settings', icon: Settings },
  { id: 'public-pages', title: 'Public Pages & Tenant Portal', icon: Globe },
  { id: 'security', title: 'Security & Privacy', icon: Shield },
  { id: 'support', title: 'Support & FAQ', icon: HelpCircle },
];

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur dark:bg-gray-800/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold">Property CRM</span>
            </Link>
            <Badge variant="outline">Documentation</Badge>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <h3 className="mb-4 font-semibold">Contents</h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  >
                    <section.icon className="h-4 w-4" />
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
            {/* Hero */}
            <div className="mb-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
              <h1 className="text-3xl font-bold sm:text-4xl">Property CRM User Guide</h1>
              <p className="mt-2 text-blue-100">
                Complete documentation to help you manage your properties efficiently
              </p>
              <p className="mt-4 text-sm text-blue-200">
                Version 1.0 • Last updated:{' '}
                {new Date().toLocaleDateString('en-ZA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* Getting Started */}
            <section id="getting-started" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <BookOpen className="h-6 w-6 text-blue-600" />
                Getting Started
              </h2>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Welcome to Property CRM</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  <p>
                    Property CRM is a comprehensive property management platform designed
                    specifically for South African landlords and property managers. This guide will
                    help you get started and make the most of all available features.
                  </p>

                  <h4>Quick Start Steps:</h4>
                  <ol>
                    <li>
                      <strong>Create an Account</strong> - Sign up at the registration page with
                      your email and business details
                    </li>
                    <li>
                      <strong>Add Your First Property</strong> - Navigate to Properties → Add
                      Property and fill in the details
                    </li>
                    <li>
                      <strong>Set Up Tenants</strong> - Add your tenants and link them to properties
                    </li>
                    <li>
                      <strong>Configure Settings</strong> - Customize your preferences in the
                      Settings page
                    </li>
                    <li>
                      <strong>Start Managing</strong> - Use the dashboard to track everything in one
                      place
                    </li>
                  </ol>

                  <h4>System Requirements:</h4>
                  <ul>
                    <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                    <li>Internet connection</li>
                    <li>Mobile device or computer</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Dashboard */}
            <section id="dashboard" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <Home className="h-6 w-6 text-blue-600" />
                Dashboard Overview
              </h2>

              <Card className="mb-6">
                <CardContent className="prose dark:prose-invert max-w-none pt-6">
                  <p>
                    The dashboard is your central hub for monitoring all property management
                    activities. It provides a quick overview of your portfolio's performance.
                  </p>

                  <h4>Dashboard Components:</h4>

                  <h5>Key Metrics Cards</h5>
                  <ul>
                    <li>
                      <strong>Total Properties</strong> - Number of properties in your portfolio
                    </li>
                    <li>
                      <strong>Active Tenants</strong> - Current occupied units
                    </li>
                    <li>
                      <strong>Monthly Revenue</strong> - Total rent collected this month
                    </li>
                    <li>
                      <strong>Pending Tasks</strong> - Maintenance and follow-ups requiring
                      attention
                    </li>
                  </ul>

                  <h5>Charts and Analytics</h5>
                  <ul>
                    <li>
                      <strong>Revenue Chart</strong> - Monthly income trends over 6-12 months
                    </li>
                    <li>
                      <strong>Occupancy Rate</strong> - Percentage of occupied vs vacant units
                    </li>
                    <li>
                      <strong>Payment Status</strong> - Overview of paid, pending, and overdue
                      payments
                    </li>
                  </ul>

                  <h5>Recent Activity</h5>
                  <ul>
                    <li>Latest bookings and inquiries</li>
                    <li>Recent payments received</li>
                    <li>New maintenance requests</li>
                    <li>Upcoming lease expirations</li>
                  </ul>

                  <h4>Quick Actions:</h4>
                  <p>
                    Use the quick action buttons to rapidly add properties, record payments, or
                    create tasks without navigating away from the dashboard.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Properties */}
            <section id="properties" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <Building2 className="h-6 w-6 text-blue-600" />
                Property Management
              </h2>

              <Card className="mb-6">
                <CardContent className="prose dark:prose-invert max-w-none pt-6">
                  <h4>Adding a New Property</h4>
                  <ol>
                    <li>
                      Navigate to <strong>Properties</strong> in the sidebar
                    </li>
                    <li>
                      Click <strong>Add Property</strong>
                    </li>
                    <li>
                      Fill in the required information:
                      <ul>
                        <li>Property name and description</li>
                        <li>Property type (House, Apartment, Townhouse, etc.)</li>
                        <li>Full address including province</li>
                        <li>Number of bedrooms, bathrooms, and parking spaces</li>
                        <li>Size in square meters</li>
                      </ul>
                    </li>
                    <li>
                      Set rental details:
                      <ul>
                        <li>Rental type (Long-term, Short-term, or Both)</li>
                        <li>Monthly rent and/or daily rate</li>
                        <li>Security deposit amount</li>
                      </ul>
                    </li>
                    <li>
                      Configure features:
                      <ul>
                        <li>Furnished/Unfurnished</li>
                        <li>Pets allowed</li>
                        <li>Smoking allowed</li>
                        <li>Amenities (Pool, Gym, Security, etc.)</li>
                      </ul>
                    </li>
                    <li>Upload property photos</li>
                    <li>
                      Click <strong>Save Property</strong>
                    </li>
                  </ol>

                  <h4>Managing Properties</h4>
                  <ul>
                    <li>
                      <strong>View</strong> - Click on any property to see full details
                    </li>
                    <li>
                      <strong>Edit</strong> - Update property information anytime
                    </li>
                    <li>
                      <strong>Status</strong> - Set as Active, Occupied, Maintenance, or Inactive
                    </li>
                    <li>
                      <strong>Photos</strong> - Add, remove, or reorder property images
                    </li>
                    <li>
                      <strong>Documents</strong> - Attach relevant property documents
                    </li>
                  </ul>

                  <h4>Property Statuses:</h4>
                  <ul>
                    <li>
                      <strong>Active</strong> - Available for rent, shown on public listings
                    </li>
                    <li>
                      <strong>Occupied</strong> - Currently rented, still visible on listings
                    </li>
                    <li>
                      <strong>Maintenance</strong> - Under repair, hidden from listings
                    </li>
                    <li>
                      <strong>Inactive</strong> - Not available, hidden from listings
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Tenants */}
            <section id="tenants" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <Users className="h-6 w-6 text-blue-600" />
                Tenant Management
              </h2>

              <Card className="mb-6">
                <CardContent className="prose dark:prose-invert max-w-none pt-6">
                  <h4>Adding a New Tenant</h4>
                  <ol>
                    <li>
                      Navigate to <strong>Tenants</strong> in the sidebar
                    </li>
                    <li>
                      Click <strong>Add Tenant</strong>
                    </li>
                    <li>
                      Enter tenant information:
                      <ul>
                        <li>Full name</li>
                        <li>Email address</li>
                        <li>Phone number</li>
                        <li>ID number (optional)</li>
                        <li>Emergency contact details</li>
                      </ul>
                    </li>
                    <li>Assign to a property</li>
                    <li>
                      Set lease details:
                      <ul>
                        <li>Start and end dates</li>
                        <li>Monthly rent amount</li>
                        <li>Payment due date</li>
                        <li>Security deposit</li>
                      </ul>
                    </li>
                    <li>
                      Click <strong>Save Tenant</strong>
                    </li>
                  </ol>

                  <h4>Tenant Information Tracking</h4>
                  <ul>
                    <li>
                      <strong>Lease History</strong> - View past and current leases
                    </li>
                    <li>
                      <strong>Payment History</strong> - Track all payments made
                    </li>
                    <li>
                      <strong>Maintenance Requests</strong> - See all requests submitted
                    </li>
                    <li>
                      <strong>Documents</strong> - Store lease agreements and ID copies
                    </li>
                    <li>
                      <strong>Communication Log</strong> - Record of all messages
                    </li>
                  </ul>

                  <h4>Tenant Statuses:</h4>
                  <ul>
                    <li>
                      <strong>Active</strong> - Currently renting
                    </li>
                    <li>
                      <strong>Pending</strong> - Awaiting move-in
                    </li>
                    <li>
                      <strong>Past</strong> - Previous tenant
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Bookings */}
            <section id="bookings" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <Calendar className="h-6 w-6 text-blue-600" />
                Booking System
              </h2>

              <Card className="mb-6">
                <CardContent className="prose dark:prose-invert max-w-none pt-6">
                  <h4>Understanding Booking Types</h4>
                  <p>The system supports two rental types:</p>
                  <ul>
                    <li>
                      <strong>Long-term Rentals</strong> - Traditional monthly leases (inquiries
                      come through the inquiry form)
                    </li>
                    <li>
                      <strong>Short-term Rentals</strong> - Daily/weekly stays (bookings with
                      specific check-in/check-out dates)
                    </li>
                  </ul>

                  <h4>Managing Bookings</h4>
                  <ol>
                    <li>
                      Navigate to <strong>Bookings</strong> in the sidebar
                    </li>
                    <li>View the booking calendar showing all reservations</li>
                    <li>
                      Click on a booking to see details:
                      <ul>
                        <li>Guest information</li>
                        <li>Check-in and check-out dates</li>
                        <li>Number of guests</li>
                        <li>Total amount</li>
                        <li>Special requests</li>
                      </ul>
                    </li>
                  </ol>

                  <h4>Booking Statuses:</h4>
                  <ul>
                    <li>
                      <strong>Pending</strong> - Awaiting confirmation
                    </li>
                    <li>
                      <strong>Confirmed</strong> - Approved and scheduled
                    </li>
                    <li>
                      <strong>Checked In</strong> - Guest has arrived
                    </li>
                    <li>
                      <strong>Completed</strong> - Stay finished
                    </li>
                    <li>
                      <strong>Cancelled</strong> - Booking was cancelled
                    </li>
                  </ul>

                  <h4>Handling Inquiries</h4>
                  <p>
                    Inquiries from potential tenants appear in the Inquiries section. You can view
                    contact details, respond via email/phone, and convert inquiries into tenants
                    once approved.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Payments */}
            <section id="payments" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <CreditCard className="h-6 w-6 text-blue-600" />
                Payment Tracking
              </h2>

              <Card className="mb-6">
                <CardContent className="prose dark:prose-invert max-w-none pt-6">
                  <h4>Recording Payments</h4>
                  <ol>
                    <li>
                      Navigate to <strong>Payments</strong> in the sidebar
                    </li>
                    <li>
                      Click <strong>Record Payment</strong>
                    </li>
                    <li>Select the tenant</li>
                    <li>
                      Enter payment details:
                      <ul>
                        <li>Amount received</li>
                        <li>Payment date</li>
                        <li>Payment method (EFT, Cash, Card, etc.)</li>
                        <li>Reference number</li>
                        <li>Notes (optional)</li>
                      </ul>
                    </li>
                    <li>
                      Click <strong>Save Payment</strong>
                    </li>
                  </ol>

                  <h4>Payment Types:</h4>
                  <ul>
                    <li>
                      <strong>Rent</strong> - Monthly rental payment
                    </li>
                    <li>
                      <strong>Deposit</strong> - Security deposit
                    </li>
                    <li>
                      <strong>Utilities</strong> - Water, electricity, etc.
                    </li>
                    <li>
                      <strong>Maintenance</strong> - Repair costs
                    </li>
                    <li>
                      <strong>Other</strong> - Miscellaneous payments
                    </li>
                  </ul>

                  <h4>Payment Features:</h4>
                  <ul>
                    <li>
                      <strong>Payment History</strong> - View all transactions by tenant or property
                    </li>
                    <li>
                      <strong>Receipt Generation</strong> - Create professional receipts for tenants
                    </li>
                    <li>
                      <strong>Outstanding Balances</strong> - Track unpaid amounts
                    </li>
                    <li>
                      <strong>Payment Reminders</strong> - Send automated reminders for due payments
                    </li>
                  </ul>

                  <h4>Tracking Expenses</h4>
                  <p>
                    Record property-related expenses in the Expenses section to track maintenance
                    costs, property taxes, insurance, and other outgoings for accurate profit
                    calculation.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Maintenance */}
            <section id="maintenance" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <Wrench className="h-6 w-6 text-blue-600" />
                Maintenance Requests
              </h2>

              <Card className="mb-6">
                <CardContent className="prose dark:prose-invert max-w-none pt-6">
                  <h4>How Maintenance Requests Work</h4>
                  <p>
                    Tenants can submit maintenance requests through their tenant portal. You receive
                    these requests in your dashboard and can track them through to completion.
                  </p>

                  <h4>Managing Requests</h4>
                  <ol>
                    <li>
                      Navigate to <strong>Maintenance</strong> in the sidebar
                    </li>
                    <li>View all pending, in-progress, and completed requests</li>
                    <li>
                      Click on a request to:
                      <ul>
                        <li>View the issue description and photos</li>
                        <li>Update the status</li>
                        <li>Add notes or updates</li>
                        <li>Assign to a contractor</li>
                        <li>Record costs</li>
                      </ul>
                    </li>
                  </ol>

                  <h4>Request Priorities:</h4>
                  <ul>
                    <li>
                      <strong>Emergency</strong> - Requires immediate attention (flooding, no
                      electricity)
                    </li>
                    <li>
                      <strong>High</strong> - Should be addressed within 24-48 hours
                    </li>
                    <li>
                      <strong>Medium</strong> - Can wait a few days
                    </li>
                    <li>
                      <strong>Low</strong> - Non-urgent repairs
                    </li>
                  </ul>

                  <h4>Request Statuses:</h4>
                  <ul>
                    <li>
                      <strong>Open</strong> - New request, not yet addressed
                    </li>
                    <li>
                      <strong>In Progress</strong> - Being worked on
                    </li>
                    <li>
                      <strong>On Hold</strong> - Waiting for parts/contractor
                    </li>
                    <li>
                      <strong>Completed</strong> - Issue resolved
                    </li>
                    <li>
                      <strong>Cancelled</strong> - Request cancelled
                    </li>
                  </ul>

                  <h4>Creating Tasks</h4>
                  <p>
                    You can also create your own maintenance tasks for preventive maintenance,
                    inspections, or scheduled repairs using the Tasks feature.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Documents */}
            <section id="documents" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <FileText className="h-6 w-6 text-blue-600" />
                Document Storage
              </h2>

              <Card className="mb-6">
                <CardContent className="prose dark:prose-invert max-w-none pt-6">
                  <h4>Uploading Documents</h4>
                  <ol>
                    <li>
                      Navigate to <strong>Documents</strong> in the sidebar
                    </li>
                    <li>
                      Click <strong>Upload Document</strong>
                    </li>
                    <li>Select the file (PDF, DOC, JPG, PNG supported)</li>
                    <li>
                      Choose document type:
                      <ul>
                        <li>Lease Agreement</li>
                        <li>ID Document</li>
                        <li>Property Title Deed</li>
                        <li>Insurance Policy</li>
                        <li>Inspection Report</li>
                        <li>Receipt</li>
                        <li>Other</li>
                      </ul>
                    </li>
                    <li>Link to property or tenant (optional)</li>
                    <li>Add description</li>
                    <li>
                      Click <strong>Upload</strong>
                    </li>
                  </ol>

                  <h4>Document Organization</h4>
                  <ul>
                    <li>Filter by document type, property, or tenant</li>
                    <li>Search documents by name or description</li>
                    <li>View upload date and file size</li>
                    <li>Download or delete documents</li>
                  </ul>

                  <h4>Best Practices:</h4>
                  <ul>
                    <li>Use descriptive names for easy searching</li>
                    <li>Keep lease agreements linked to both property and tenant</li>
                    <li>Regularly backup important documents</li>
                    <li>Set reminders for document renewals (insurance, compliance)</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Messages */}
            <section id="messages" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <MessageSquare className="h-6 w-6 text-blue-600" />
                Communication
              </h2>

              <Card className="mb-6">
                <CardContent className="prose dark:prose-invert max-w-none pt-6">
                  <h4>Sending Messages</h4>
                  <ol>
                    <li>
                      Navigate to <strong>Messages</strong> in the sidebar
                    </li>
                    <li>
                      Click <strong>New Message</strong>
                    </li>
                    <li>Select recipient(s) - individual tenant or all tenants</li>
                    <li>
                      Choose message type:
                      <ul>
                        <li>General</li>
                        <li>Payment Reminder</li>
                        <li>Maintenance Update</li>
                        <li>Announcement</li>
                      </ul>
                    </li>
                    <li>Write your message</li>
                    <li>
                      Click <strong>Send</strong>
                    </li>
                  </ol>

                  <h4>Message Templates</h4>
                  <p>
                    Save time by creating reusable templates for common messages like payment
                    reminders, lease renewals, and welcome messages.
                  </p>

                  <h4>Notifications</h4>
                  <p>The system can send automatic notifications for:</p>
                  <ul>
                    <li>Payment due dates</li>
                    <li>Lease expiration reminders</li>
                    <li>Maintenance updates</li>
                    <li>Booking confirmations</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Reports */}
            <section id="reports" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                Financial Reports
              </h2>

              <Card className="mb-6">
                <CardContent className="prose dark:prose-invert max-w-none pt-6">
                  <h4>Available Reports</h4>

                  <h5>Income Report</h5>
                  <p>
                    View all income by property, tenant, or time period. Includes rent payments,
                    deposits, and other income.
                  </p>

                  <h5>Expense Report</h5>
                  <p>
                    Track all property-related expenses including maintenance, taxes, insurance, and
                    utilities.
                  </p>

                  <h5>Profit & Loss</h5>
                  <p>
                    Calculate net profit by comparing income against expenses for each property or
                    your entire portfolio.
                  </p>

                  <h5>Occupancy Report</h5>
                  <p>Monitor vacancy rates and occupancy trends over time.</p>

                  <h5>Payment Aging Report</h5>
                  <p>Identify overdue payments and outstanding balances by tenant.</p>

                  <h4>Generating Reports</h4>
                  <ol>
                    <li>
                      Navigate to <strong>Reports</strong> in the sidebar
                    </li>
                    <li>Select report type</li>
                    <li>Set date range</li>
                    <li>Filter by property (optional)</li>
                    <li>
                      Click <strong>Generate Report</strong>
                    </li>
                    <li>Export to PDF or Excel</li>
                  </ol>
                </CardContent>
              </Card>
            </section>

            {/* Settings */}
            <section id="settings" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <Settings className="h-6 w-6 text-blue-600" />
                Settings
              </h2>

              <Card className="mb-6">
                <CardContent className="prose dark:prose-invert max-w-none pt-6">
                  <h4>Account Settings</h4>
                  <ul>
                    <li>
                      <strong>Profile</strong> - Update your name, email, phone, and photo
                    </li>
                    <li>
                      <strong>Business Info</strong> - Company name and details
                    </li>
                    <li>
                      <strong>Password</strong> - Change your login password
                    </li>
                    <li>
                      <strong>Two-Factor Authentication</strong> - Add extra security
                    </li>
                  </ul>

                  <h4>Preferences</h4>
                  <ul>
                    <li>
                      <strong>Currency</strong> - Default is South African Rand (ZAR)
                    </li>
                    <li>
                      <strong>Timezone</strong> - Set your local timezone
                    </li>
                    <li>
                      <strong>Language</strong> - Choose interface language
                    </li>
                    <li>
                      <strong>Theme</strong> - Light or dark mode
                    </li>
                  </ul>

                  <h4>Notification Settings</h4>
                  <ul>
                    <li>Email notifications for new bookings</li>
                    <li>Payment receipt notifications</li>
                    <li>Maintenance request alerts</li>
                    <li>Lease expiration reminders</li>
                  </ul>

                  <h4>Subscription</h4>
                  <p>
                    View your current plan, property limits, and upgrade options. Manage billing
                    information and view invoices.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Public Pages */}
            <section id="public-pages" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <Globe className="h-6 w-6 text-blue-600" />
                Public Pages & Tenant Portal
              </h2>

              <Card className="mb-6">
                <CardContent className="prose dark:prose-invert max-w-none pt-6">
                  <h4>Public Property Listings</h4>
                  <p>
                    Properties marked as Active or Occupied are automatically displayed on the
                    public listings page. Potential tenants can:
                  </p>
                  <ul>
                    <li>Browse available properties</li>
                    <li>Filter by city</li>
                    <li>View property details and photos</li>
                    <li>Submit inquiries (for long-term rentals)</li>
                    <li>Make booking requests (for short-term rentals)</li>
                  </ul>

                  <h4>How Bookings Work</h4>
                  <p>For short-term rental properties:</p>
                  <ol>
                    <li>Guest visits your property page</li>
                    <li>Selects check-in and check-out dates</li>
                    <li>Fills in their contact information</li>
                    <li>Submits booking request</li>
                    <li>You receive the request in your dashboard</li>
                    <li>Confirm or decline the booking</li>
                    <li>Guest receives confirmation email</li>
                  </ol>

                  <h4>Tenant Portal</h4>
                  <p>Tenants can access their own portal to:</p>
                  <ul>
                    <li>View their lease details</li>
                    <li>See payment history</li>
                    <li>Submit maintenance requests</li>
                    <li>Upload documents</li>
                    <li>Communicate with you</li>
                  </ul>
                  <p>Tenants log in using the email address you have on file for them.</p>
                </CardContent>
              </Card>
            </section>

            {/* Security */}
            <section id="security" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <Shield className="h-6 w-6 text-blue-600" />
                Security & Privacy
              </h2>

              <Card className="mb-6">
                <CardContent className="prose dark:prose-invert max-w-none pt-6">
                  <h4>Data Security</h4>
                  <ul>
                    <li>All data is encrypted in transit and at rest</li>
                    <li>Secure HTTPS connections</li>
                    <li>Regular security audits</li>
                    <li>Automatic backups</li>
                  </ul>

                  <h4>Account Security</h4>
                  <ul>
                    <li>Use a strong, unique password</li>
                    <li>Enable two-factor authentication</li>
                    <li>Don't share your login credentials</li>
                    <li>Log out when using shared devices</li>
                  </ul>

                  <h4>POPIA Compliance</h4>
                  <p>
                    Property CRM is designed to help you comply with South Africa's Protection of
                    Personal Information Act (POPIA):
                  </p>
                  <ul>
                    <li>Collect only necessary tenant information</li>
                    <li>Store data securely</li>
                    <li>Allow tenants to access their information</li>
                    <li>Delete data when no longer needed</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Support */}
            <section id="support" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <HelpCircle className="h-6 w-6 text-blue-600" />
                Support & FAQ
              </h2>

              <Card className="mb-6">
                <CardContent className="prose dark:prose-invert max-w-none pt-6">
                  <h4>Getting Help</h4>
                  <ul>
                    <li>
                      <strong>Email Support</strong> - support@propertycrm.co.za
                    </li>
                    <li>
                      <strong>Response Time</strong> - Within 24 hours for standard plans, 4 hours
                      for Professional and Enterprise
                    </li>
                  </ul>

                  <h4>Frequently Asked Questions</h4>

                  <h5>How do I reset my password?</h5>
                  <p>
                    Click "Forgot Password" on the login page and follow the email instructions.
                  </p>

                  <h5>Can I import existing property data?</h5>
                  <p>
                    Yes, contact support for assistance with bulk data import from spreadsheets.
                  </p>

                  <h5>How do I upgrade my plan?</h5>
                  <p>Go to Settings → Subscription → Upgrade Plan to see available options.</p>

                  <h5>Can multiple users access the same account?</h5>
                  <p>
                    Yes, the Enterprise plan includes team management with multiple user logins.
                  </p>

                  <h5>Is my data backed up?</h5>
                  <p>Yes, automatic daily backups are performed and retained for 30 days.</p>

                  <h5>Can I export my data?</h5>
                  <p>
                    Yes, you can export reports to PDF or Excel. Contact support for full data
                    exports.
                  </p>

                  <h5>How do tenants submit maintenance requests?</h5>
                  <p>
                    Tenants log into the tenant portal using their email address and can submit
                    requests from their dashboard.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Quick Reference */}
            <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle>Quick Reference - Keyboard Shortcuts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-semibold">Navigation</h4>
                    <ul className="space-y-1 text-sm">
                      <li>
                        <kbd className="rounded bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700">G</kbd>{' '}
                        then{' '}
                        <kbd className="rounded bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700">D</kbd>{' '}
                        - Go to Dashboard
                      </li>
                      <li>
                        <kbd className="rounded bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700">G</kbd>{' '}
                        then{' '}
                        <kbd className="rounded bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700">P</kbd>{' '}
                        - Go to Properties
                      </li>
                      <li>
                        <kbd className="rounded bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700">G</kbd>{' '}
                        then{' '}
                        <kbd className="rounded bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700">T</kbd>{' '}
                        - Go to Tenants
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-semibold">Actions</h4>
                    <ul className="space-y-1 text-sm">
                      <li>
                        <kbd className="rounded bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700">N</kbd>{' '}
                        - New item
                      </li>
                      <li>
                        <kbd className="rounded bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700">S</kbd>{' '}
                        - Save
                      </li>
                      <li>
                        <kbd className="rounded bg-gray-200 px-1.5 py-0.5 dark:bg-gray-700">/</kbd>{' '}
                        - Search
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white py-8 dark:bg-gray-800">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Property CRM. All rights reserved.</p>
          <p className="mt-2">
            Need help? Contact us at{' '}
            <a href="mailto:support@propertycrm.co.za" className="text-blue-600 hover:underline">
              support@propertycrm.co.za
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
