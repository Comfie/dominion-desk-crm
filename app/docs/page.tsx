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
  Mail,
  CheckSquare,
  Receipt,
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
  { id: 'inquiries', title: 'Inquiry Management', icon: Mail },
  { id: 'payments', title: 'Payment Tracking', icon: CreditCard },
  { id: 'expenses', title: 'Expense Tracking', icon: Receipt },
  { id: 'maintenance', title: 'Maintenance Requests', icon: Wrench },
  { id: 'tasks', title: 'Tasks & Calendar', icon: CheckSquare },
  { id: 'documents', title: 'Document Storage', icon: FileText },
  { id: 'messages', title: 'Communication', icon: MessageSquare },
  { id: 'reports', title: 'Reports & Analytics', icon: BarChart3 },
  { id: 'settings', title: 'Settings', icon: Settings },
  { id: 'public-pages', title: 'Public Pages & Tenant Portal', icon: Globe },
  { id: 'security', title: 'Security & Privacy', icon: Shield },
  { id: 'support', title: 'Support & FAQ', icon: HelpCircle },
];

export default function DocumentationPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-gradient-header sticky top-0 z-50 border-b border-white/10 shadow-md backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-white">
              <Building2 className="h-6 w-6" />
              <span className="text-lg font-semibold">Veld Unity</span>
            </Link>
            <Badge variant="secondary">Documentation</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            asChild
          >
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
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
                    className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
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
            <div className="bg-gradient-blue-cyan mb-12 rounded-xl p-8 text-white shadow-lg">
              <h1 className="text-3xl font-bold sm:text-4xl">Veld Unity User Guide</h1>
              <p className="mt-2 text-white/90">
                Complete documentation to help you manage your properties efficiently
              </p>
              <p className="mt-4 text-sm text-white/80">
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
                <BookOpen className="text-primary h-6 w-6" />
                Getting Started
              </h2>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Welcome to Veld Unity</CardTitle>
                </CardHeader>
                <CardContent className="docs-content space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Veld Unity is a comprehensive property management platform designed specifically
                    for South African landlords and property managers. This guide will help you get
                    started and make the most of all available features.
                  </p>

                  <div>
                    <h4 className="mb-3 font-semibold">Quick Start Steps:</h4>
                    <ol className="text-muted-foreground ml-5 list-decimal space-y-2">
                      <li>
                        <strong className="text-foreground">Create an Account</strong> - Sign up at
                        the registration page with your email and business details
                      </li>
                      <li>
                        <strong className="text-foreground">Add Your First Property</strong> -
                        Navigate to Properties → Add Property and fill in the details
                      </li>
                      <li>
                        <strong className="text-foreground">Set Up Tenants</strong> - Add your
                        tenants and link them to properties
                      </li>
                      <li>
                        <strong className="text-foreground">Configure Settings</strong> - Customize
                        your preferences in the Settings page
                      </li>
                      <li>
                        <strong className="text-foreground">Start Managing</strong> - Use the
                        dashboard to track everything in one place
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="mb-3 font-semibold">System Requirements:</h4>
                    <ul className="text-muted-foreground ml-5 list-disc space-y-1">
                      <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                      <li>Internet connection</li>
                      <li>Mobile device or computer</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Dashboard */}
            <section id="dashboard" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <Home className="text-primary h-6 w-6" />
                Dashboard Overview
              </h2>

              <Card className="mb-6">
                <CardContent className="docs-content space-y-4">
                  <p>
                    The dashboard is your central hub for monitoring all property management
                    activities. It provides a quick overview of your portfolios performance.
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
                <Building2 className="text-primary h-6 w-6" />
                Property Management
              </h2>

              <Card className="mb-6">
                <CardContent className="docs-content space-y-4">
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
                <Users className="text-primary h-6 w-6" />
                Tenant Management
              </h2>

              <Card className="mb-6">
                <CardContent className="docs-content space-y-4">
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
                <Calendar className="text-primary h-6 w-6" />
                Booking System
              </h2>

              <Card className="mb-6">
                <CardContent className="docs-content space-y-4">
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
                </CardContent>
              </Card>
            </section>

            {/* Inquiries */}
            <section id="inquiries" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <Mail className="text-primary h-6 w-6" />
                Inquiry Management
              </h2>

              <Card className="mb-6">
                <CardContent className="docs-content space-y-4">
                  <h4>Understanding Inquiries</h4>
                  <p>
                    Inquiries are submitted through your public property listing pages. The system
                    automatically categorizes them based on property type:
                  </p>
                  <ul>
                    <li>
                      <strong>Booking Inquiries</strong> - For short-term rental properties
                    </li>
                    <li>
                      <strong>Viewing Requests</strong> - For long-term rental properties
                    </li>
                    <li>
                      <strong>General Inquiries</strong> - For properties accepting both types
                    </li>
                  </ul>

                  <h4>Managing Inquiries</h4>
                  <ol>
                    <li>
                      Navigate to <strong>Inquiries</strong> in the sidebar
                    </li>
                    <li>View all pending and responded inquiries</li>
                    <li>
                      Click on an inquiry to see:
                      <ul>
                        <li>Contact information (name, email, phone)</li>
                        <li>Property they're interested in</li>
                        <li>Preferred dates (if applicable)</li>
                        <li>Number of guests</li>
                        <li>Special requests or questions</li>
                      </ul>
                    </li>
                  </ol>

                  <h4>Inquiry Statuses:</h4>
                  <ul>
                    <li>
                      <strong>New</strong> - Just received, awaiting review
                    </li>
                    <li>
                      <strong>In Progress</strong> - You've started processing it
                    </li>
                    <li>
                      <strong>Responded</strong> - You've sent a response
                    </li>
                    <li>
                      <strong>Converted</strong> - Turned into a booking or tenant
                    </li>
                    <li>
                      <strong>Closed</strong> - No longer being pursued
                    </li>
                    <li>
                      <strong>Spam</strong> - Marked as spam
                    </li>
                  </ul>

                  <h4>Converting Inquiries</h4>
                  <p>
                    Once you've confirmed details with the inquirer, you can convert inquiries
                    directly:
                  </p>
                  <ul>
                    <li>
                      <strong>Convert to Booking</strong> - For short-term stays, automatically
                      pre-fills booking form with inquiry details
                    </li>
                    <li>
                      <strong>Convert to Tenant</strong> - For long-term rentals, pre-fills tenant
                      form with contact and lease information
                    </li>
                  </ul>

                  <h4>Responding to Inquiries</h4>
                  <p>
                    You can send responses directly from the inquiry detail page. The system records
                    your response and notifies you of any follow-up inquiries.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Payments */}
            <section id="payments" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <CreditCard className="text-primary h-6 w-6" />
                Payment Tracking
              </h2>

              <Card className="mb-6">
                <CardContent className="docs-content space-y-4">
                  <h4>Recording Payments</h4>
                  <ol>
                    <li>
                      Navigate to <strong>Payments</strong> in the sidebar
                    </li>
                    <li>
                      Click <strong>Record Payment</strong>
                    </li>
                    <li>Select the tenant or booking</li>
                    <li>
                      Enter payment details:
                      <ul>
                        <li>Payment type (Rent, Deposit, Utilities, etc.)</li>
                        <li>Amount received</li>
                        <li>Payment date</li>
                        <li>Payment method (EFT, Cash, Card, Debit Order, etc.)</li>
                        <li>Bank reference number</li>
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
                      <strong>Booking</strong> - Short-term rental booking payment
                    </li>
                    <li>
                      <strong>Cleaning Fee</strong> - Property cleaning charges
                    </li>
                    <li>
                      <strong>Utilities</strong> - Water, electricity, gas, etc.
                    </li>
                    <li>
                      <strong>Late Fee</strong> - Penalties for late payments
                    </li>
                    <li>
                      <strong>Damage</strong> - Charges for property damage
                    </li>
                    <li>
                      <strong>Refund</strong> - Returned payments
                    </li>
                    <li>
                      <strong>Other</strong> - Miscellaneous payments
                    </li>
                  </ul>

                  <h4>Payment Status Tracking</h4>
                  <p>Each payment has a clear status to track its lifecycle:</p>
                  <ul>
                    <li>
                      <strong>Pending</strong> - Payment expected but not yet received
                    </li>
                    <li>
                      <strong>Paid</strong> - Payment received and confirmed
                    </li>
                    <li>
                      <strong>Partially Paid</strong> - Partial amount received
                    </li>
                    <li>
                      <strong>Overdue</strong> - Payment past due date
                    </li>
                    <li>
                      <strong>Failed</strong> - Payment attempt unsuccessful
                    </li>
                    <li>
                      <strong>Refunded</strong> - Payment returned to payer
                    </li>
                  </ul>

                  <h4>Automated Payment Features</h4>
                  <p>The system includes powerful automation to reduce manual work:</p>

                  <h5>Automatic Rental Due Date Advancement</h5>
                  <p>
                    When you record a RENT payment as PAID, the system automatically advances the
                    tenant's next payment due date to the following month based on your configured
                    rental due day. This keeps payment tracking accurate without manual updates.
                  </p>

                  <h5>Monthly Payment Generation</h5>
                  <p>
                    On the 25th of each month, the system automatically generates rent payment
                    records for all active tenants with configured monthly rent. These payments are
                    created with:
                  </p>
                  <ul>
                    <li>Due date based on your rental due day setting</li>
                    <li>Correct monthly rent amount</li>
                    <li>Pending status for tracking</li>
                    <li>Automatic linking to tenant and property</li>
                  </ul>

                  <h5>Payment Reminders</h5>
                  <p>Automated reminder system helps ensure timely payments:</p>
                  <ul>
                    <li>
                      <strong>7 Days Before Due</strong> - First reminder sent to tenants
                    </li>
                    <li>
                      <strong>1 Day Before Due</strong> - Final reminder before due date
                    </li>
                    <li>
                      <strong>1 Day After Due</strong> - Overdue notice sent
                    </li>
                    <li>Reminders sent via email and in-app notifications</li>
                    <li>System tracks when reminders are sent</li>
                  </ul>

                  <h4>Configuring Rental Due Day</h4>
                  <p>
                    Set a global rental due day for all your properties to standardize payment
                    collection:
                  </p>
                  <ol>
                    <li>
                      Navigate to <strong>Settings</strong> → <strong>Profile</strong>
                    </li>
                    <li>
                      Scroll to the <strong>Payment Settings</strong> section
                    </li>
                    <li>Select your preferred day of the month (1-31)</li>
                    <li>The system caps at the 28th to avoid month-end issues</li>
                    <li>
                      Click <strong>Save Changes</strong>
                    </li>
                  </ol>
                  <p>This setting is used by:</p>
                  <ul>
                    <li>Automated monthly payment generation</li>
                    <li>Payment reminder system</li>
                    <li>Tenant portal next payment due display</li>
                    <li>Next payment due date calculations</li>
                  </ul>

                  <h4>Payment History & Filtering</h4>
                  <p>View and analyze all payments with powerful filtering options:</p>
                  <ul>
                    <li>
                      <strong>Filter by Status</strong> - Paid, Pending, Overdue, etc.
                    </li>
                    <li>
                      <strong>Filter by Type</strong> - Rent, Deposit, Utilities, etc.
                    </li>
                    <li>
                      <strong>Filter by Tenant</strong> - View payments for specific tenants
                    </li>
                    <li>
                      <strong>Filter by Date Range</strong> - Custom date periods
                    </li>
                    <li>
                      <strong>Search</strong> - Find payments by reference or notes
                    </li>
                    <li>
                      <strong>Summary Statistics</strong> - Total amounts by status
                    </li>
                  </ul>

                  <h4>Receipt Generation</h4>
                  <p>Generate professional payment receipts instantly:</p>
                  <ul>
                    <li>Click any payment to view details</li>
                    <li>
                      Click <strong>Generate Receipt</strong>
                    </li>
                    <li>Professional PDF receipt with your business details</li>
                    <li>Includes payment reference, amount, date, and method</li>
                    <li>Download or email directly to tenant</li>
                  </ul>

                  <h4>Tenant Portal Payment Visibility</h4>
                  <p>Tenants can view their payment information through the tenant portal:</p>
                  <ul>
                    <li>
                      <strong>Next Payment Due</strong> - Displayed prominently on dashboard
                    </li>
                    <li>
                      <strong>Payment History</strong> - Complete list of all payments
                    </li>
                    <li>
                      <strong>Outstanding Balance</strong> - Current amounts owed
                    </li>
                    <li>
                      <strong>Receipt Downloads</strong> - Access to all payment receipts
                    </li>
                    <li>
                      <strong>Payment Status</strong> - Real-time status updates
                    </li>
                  </ul>

                  <h4>Editing Property Assignments</h4>
                  <p>Update tenant property assignments and rental amounts:</p>
                  <ol>
                    <li>
                      Navigate to <strong>Tenants</strong> and select a tenant
                    </li>
                    <li>
                      Find the property card in the <strong>Properties</strong> section
                    </li>
                    <li>
                      Click the <strong>Edit</strong> button (pencil icon)
                    </li>
                    <li>
                      Update details:
                      <ul>
                        <li>Lease start and end dates</li>
                        <li>Monthly rent amount</li>
                        <li>Deposit paid</li>
                        <li>Move-in and move-out dates</li>
                      </ul>
                    </li>
                    <li>
                      Click <strong>Update Property</strong>
                    </li>
                  </ol>
                  <p>Changes to monthly rent automatically affect future payment generation.</p>

                  <h4>Tracking Expenses</h4>
                  <p>
                    Record property-related expenses in the Expenses section to track maintenance
                    costs, property taxes, insurance, and other outgoings for accurate profit
                    calculation.
                  </p>

                  <h4>Best Practices</h4>
                  <ul>
                    <li>Record payments immediately when received for accurate tracking</li>
                    <li>Always include bank reference numbers for easy reconciliation</li>
                    <li>Use consistent payment methods for better reporting</li>
                    <li>Generate receipts for all paid amounts</li>
                    <li>Review outstanding payments weekly</li>
                    <li>
                      Set your rental due day early in the month (1st-5th) for better cash flow
                    </li>
                    <li>Monitor automated reminders to ensure they're being sent</li>
                    <li>Update monthly rent amounts when lease renewals occur</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Expenses */}
            <section id="expenses" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <Receipt className="text-primary h-6 w-6" />
                Expense Tracking
              </h2>

              <Card className="mb-6">
                <CardContent className="docs-content space-y-4">
                  <h4>Recording Expenses</h4>
                  <ol>
                    <li>
                      Navigate to <strong>Expenses</strong> in the sidebar
                    </li>
                    <li>
                      Click <strong>Add Expense</strong>
                    </li>
                    <li>Select the property the expense relates to</li>
                    <li>
                      Enter expense details:
                      <ul>
                        <li>Description of the expense</li>
                        <li>Category (Maintenance, Utilities, Insurance, etc.)</li>
                        <li>Amount paid</li>
                        <li>Date of expense</li>
                        <li>Payment method</li>
                        <li>Vendor/Supplier name</li>
                        <li>Receipt/Invoice number</li>
                        <li>Notes (optional)</li>
                      </ul>
                    </li>
                    <li>Attach receipts or invoices (optional)</li>
                    <li>
                      Click <strong>Save Expense</strong>
                    </li>
                  </ol>

                  <h4>Expense Categories:</h4>
                  <ul>
                    <li>
                      <strong>Maintenance</strong> - Repairs, painting, plumbing, electrical work
                    </li>
                    <li>
                      <strong>Utilities</strong> - Water, electricity, gas, internet bills
                    </li>
                    <li>
                      <strong>Insurance</strong> - Property insurance premiums
                    </li>
                    <li>
                      <strong>Property Tax</strong> - Municipal and property taxes
                    </li>
                    <li>
                      <strong>Mortgage</strong> - Mortgage or bond payments
                    </li>
                    <li>
                      <strong>Management Fees</strong> - Property management costs
                    </li>
                    <li>
                      <strong>Advertising</strong> - Marketing and listing costs
                    </li>
                    <li>
                      <strong>Legal & Professional</strong> - Attorney, accountant fees
                    </li>
                    <li>
                      <strong>Supplies</strong> - Cleaning supplies, keys, minor items
                    </li>
                    <li>
                      <strong>HOA Fees</strong> - Homeowners association fees
                    </li>
                    <li>
                      <strong>Other</strong> - Miscellaneous expenses
                    </li>
                  </ul>

                  <h4>Linking to Maintenance Requests</h4>
                  <p>
                    When you resolve maintenance requests, you can record associated costs directly.
                    These expenses are automatically categorized as Maintenance and linked to the
                    specific request and property for accurate tracking.
                  </p>

                  <h4>Expense Reports</h4>
                  <p>
                    Access comprehensive expense reports from the <strong>Reports</strong> section:
                  </p>
                  <ul>
                    <li>
                      <strong>By Property</strong> - See all expenses for each property
                    </li>
                    <li>
                      <strong>By Category</strong> - Understand where your money is going
                    </li>
                    <li>
                      <strong>By Time Period</strong> - Monthly, quarterly, or yearly expense
                      analysis
                    </li>
                    <li>
                      <strong>Tax Reports</strong> - Generate reports for tax deduction purposes
                    </li>
                  </ul>

                  <h4>Financial Impact</h4>
                  <p>Expenses are automatically included in your financial reports:</p>
                  <ul>
                    <li>
                      <strong>Net Income Calculation</strong> - Revenue minus expenses shows true
                      profitability
                    </li>
                    <li>
                      <strong>ROI Analysis</strong> - Track return on investment per property
                    </li>
                    <li>
                      <strong>Budget vs. Actual</strong> - Compare planned vs. actual expenses
                    </li>
                    <li>
                      <strong>Maintenance Cost Trends</strong> - Identify properties with high
                      maintenance costs
                    </li>
                  </ul>

                  <h4>Best Practices:</h4>
                  <ul>
                    <li>Record expenses immediately to avoid forgetting</li>
                    <li>Always attach receipts for accurate record-keeping</li>
                    <li>Use consistent vendor names for better reporting</li>
                    <li>Review expense reports monthly to identify cost-saving opportunities</li>
                    <li>Keep separate categories for tax-deductible expenses</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Maintenance */}
            <section id="maintenance" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <Wrench className="text-primary h-6 w-6" />
                Maintenance Requests
              </h2>

              <Card className="mb-6">
                <CardContent className="docs-content space-y-4">
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

            {/* Tasks */}
            <section id="tasks" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <CheckSquare className="text-primary h-6 w-6" />
                Tasks & Calendar
              </h2>

              <Card className="mb-6">
                <CardContent className="docs-content space-y-4">
                  <h4>Understanding Tasks</h4>
                  <p>
                    Tasks help you organize and track your property management activities. You can
                    create tasks for various purposes like property inspections, lease renewals,
                    preventive maintenance, rent collection, and general follow-ups.
                  </p>

                  <h4>Creating a Task</h4>
                  <ol>
                    <li>
                      Navigate to <strong>Tasks</strong> in the sidebar
                    </li>
                    <li>
                      Click <strong>Create Task</strong>
                    </li>
                    <li>
                      Enter task details:
                      <ul>
                        <li>Task title and description</li>
                        <li>Select related property (optional)</li>
                        <li>Select related tenant (optional)</li>
                        <li>Set priority (Low, Medium, High, Urgent)</li>
                        <li>Choose category (Inspection, Maintenance, Administrative, etc.)</li>
                        <li>Set due date and time</li>
                        <li>Add reminder notifications</li>
                      </ul>
                    </li>
                    <li>
                      Click <strong>Create Task</strong>
                    </li>
                  </ol>

                  <h4>Task Priorities:</h4>
                  <ul>
                    <li>
                      <strong>Urgent</strong> - Requires immediate attention, overdue or critical
                    </li>
                    <li>
                      <strong>High</strong> - Important tasks with approaching deadlines
                    </li>
                    <li>
                      <strong>Medium</strong> - Standard priority tasks
                    </li>
                    <li>
                      <strong>Low</strong> - Can be completed when time allows
                    </li>
                  </ul>

                  <h4>Task Categories:</h4>
                  <ul>
                    <li>
                      <strong>Inspection</strong> - Property inspections, move-in/out walkthroughs
                    </li>
                    <li>
                      <strong>Maintenance</strong> - Preventive maintenance, repairs
                    </li>
                    <li>
                      <strong>Administrative</strong> - Paperwork, lease renewals, documentation
                    </li>
                    <li>
                      <strong>Financial</strong> - Rent collection, payment follow-ups
                    </li>
                    <li>
                      <strong>Tenant</strong> - Tenant communication, requests, issues
                    </li>
                    <li>
                      <strong>Marketing</strong> - Property listings, showings, photography
                    </li>
                    <li>
                      <strong>Legal</strong> - Compliance, contracts, legal matters
                    </li>
                    <li>
                      <strong>Other</strong> - General tasks
                    </li>
                  </ul>

                  <h4>Task Statuses:</h4>
                  <ul>
                    <li>
                      <strong>Pending</strong> - Not yet started
                    </li>
                    <li>
                      <strong>In Progress</strong> - Currently working on it
                    </li>
                    <li>
                      <strong>Completed</strong> - Task finished
                    </li>
                    <li>
                      <strong>Cancelled</strong> - No longer needed
                    </li>
                  </ul>

                  <h4>Using the Calendar View</h4>
                  <p>
                    The calendar view provides a visual overview of all your tasks and appointments:
                  </p>
                  <ul>
                    <li>
                      <strong>Month View</strong> - See all tasks across the month
                    </li>
                    <li>
                      <strong>Week View</strong> - Detailed weekly task schedule
                    </li>
                    <li>
                      <strong>Day View</strong> - Hour-by-hour task breakdown
                    </li>
                    <li>
                      <strong>List View</strong> - All tasks in a sortable list format
                    </li>
                  </ul>

                  <h4>Task Management Features:</h4>
                  <ul>
                    <li>
                      <strong>Filtering</strong> - Filter by property, tenant, priority, category,
                      or status
                    </li>
                    <li>
                      <strong>Sorting</strong> - Sort by due date, priority, or creation date
                    </li>
                    <li>
                      <strong>Search</strong> - Quickly find specific tasks
                    </li>
                    <li>
                      <strong>Reminders</strong> - Get notified before tasks are due
                    </li>
                    <li>
                      <strong>Recurring Tasks</strong> - Set up tasks that repeat (monthly
                      inspections, quarterly reviews)
                    </li>
                    <li>
                      <strong>Task Notes</strong> - Add progress notes and updates to tasks
                    </li>
                  </ul>

                  <h4>Common Task Examples:</h4>
                  <ul>
                    <li>Monthly property inspection for 123 Main St</li>
                    <li>Lease renewal reminder - John Smith (30 days before expiry)</li>
                    <li>Schedule HVAC maintenance for all properties</li>
                    <li>Follow up on late rent payment - Apartment 4B</li>
                    <li>Take property photos for new listing</li>
                    <li>Review and update insurance policies</li>
                    <li>Submit tax documents to accountant</li>
                  </ul>

                  <h4>Notifications & Reminders</h4>
                  <p>Stay on top of your tasks with automated notifications:</p>
                  <ul>
                    <li>Email notifications for upcoming tasks</li>
                    <li>Dashboard alerts for overdue tasks</li>
                    <li>Daily digest of today's tasks</li>
                    <li>Custom reminder times (1 day, 1 week, custom)</li>
                  </ul>

                  <h4>Best Practices:</h4>
                  <ul>
                    <li>Create tasks immediately when you think of them</li>
                    <li>Set realistic due dates and priorities</li>
                    <li>Link tasks to properties and tenants for better organization</li>
                    <li>Use recurring tasks for regular maintenance and inspections</li>
                    <li>Review your task list at the start of each week</li>
                    <li>Mark tasks complete promptly to keep your list current</li>
                    <li>Use task notes to document what was done</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Documents */}
            <section id="documents" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <FileText className="text-primary h-6 w-6" />
                Document Management
              </h2>

              <Card className="mb-6">
                <CardContent className="docs-content space-y-4">
                  <p className="text-muted-foreground">
                    The document management system provides folder-based organization with real file
                    uploads powered by UploadThing. Organize documents for your business,
                    properties, and tenants.
                  </p>

                  <h4>Personal Documents (Landlord)</h4>
                  <p>
                    Navigate to <strong>Documents</strong> in the sidebar to manage your personal
                    business documents:
                  </p>
                  <ul>
                    <li>Tax records and financial statements</li>
                    <li>Business contracts and agreements</li>
                    <li>Insurance policies</li>
                    <li>Legal documents</li>
                    <li>Any other business-related files</li>
                  </ul>

                  <h4>Tenant Documents</h4>
                  <p>Manage tenant-specific documents from the tenant detail page:</p>
                  <ol>
                    <li>
                      Navigate to <strong>Tenants</strong> and select a tenant
                    </li>
                    <li>
                      Click the <strong>Documents</strong> tab or sidebar card
                    </li>
                    <li>View the tenant's document library with pre-organized folders</li>
                  </ol>
                  <p>Each tenant gets 5 default folders automatically:</p>
                  <ul>
                    <li>
                      <strong>Lease Agreements</strong> - Signed contracts and addendums
                    </li>
                    <li>
                      <strong>Personal Documents</strong> - ID, passport, driver's license
                    </li>
                    <li>
                      <strong>Financial Documents</strong> - Bank statements, payslips, tax returns
                    </li>
                    <li>
                      <strong>Proof of Residence</strong> - Utility bills, previous lease agreements
                    </li>
                    <li>
                      <strong>Other Documents</strong> - Miscellaneous files
                    </li>
                  </ul>

                  <h4>Uploading Documents</h4>
                  <ol>
                    <li>Open the document library (personal or tenant-specific)</li>
                    <li>
                      Click <strong>Upload Document</strong>
                    </li>
                    <li>Select a file (PDF, images, Word, Excel up to 16MB)</li>
                    <li>
                      Fill in document details:
                      <ul>
                        <li>
                          <strong>Title</strong> - Descriptive name
                        </li>
                        <li>
                          <strong>Type</strong> - Lease Agreement, ID Document, Bank Statement, etc.
                        </li>
                        <li>
                          <strong>Folder</strong> - Choose destination folder (optional)
                        </li>
                        <li>
                          <strong>Description</strong> - Additional notes
                        </li>
                        <li>
                          <strong>Issue/Expiry Date</strong> - For tracking renewals
                        </li>
                      </ul>
                    </li>
                    <li>
                      Click <strong>Upload Document</strong>
                    </li>
                    <li>File is uploaded to cloud storage and saved to the selected folder</li>
                  </ol>

                  <h4>Folder Management</h4>
                  <p>Organize documents efficiently with custom folders:</p>
                  <ul>
                    <li>
                      <strong>Create Folder</strong> - Click "Create Folder" button
                      <ul>
                        <li>Choose a name</li>
                        <li>Pick a color for visual distinction</li>
                        <li>Select an icon</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Edit Folder</strong> - Click the menu (⋮) next to folder name
                      <ul>
                        <li>Rename folder</li>
                        <li>Change color or icon</li>
                      </ul>
                    </li>
                    <li>
                      <strong>Delete Folder</strong> - Remove folders you no longer need
                      <ul>
                        <li>Documents can be moved to another folder before deletion</li>
                        <li>Or set to uncategorized</li>
                      </ul>
                    </li>
                  </ul>

                  <h4>Document Actions</h4>
                  <p>Manage documents with these actions:</p>
                  <ul>
                    <li>
                      <strong>View</strong> - Open document in new tab
                    </li>
                    <li>
                      <strong>Download</strong> - Save file to your computer
                    </li>
                    <li>
                      <strong>Move to Folder</strong> - Reorganize into different folder
                    </li>
                    <li>
                      <strong>Delete</strong> - Remove document permanently
                    </li>
                    <li>
                      <strong>Multi-select</strong> - Checkbox select for bulk operations
                    </li>
                  </ul>

                  <h4>View Modes</h4>
                  <ul>
                    <li>
                      <strong>Grid View</strong> - Card-based layout with file type icons
                    </li>
                    <li>
                      <strong>List View</strong> - Compact table view with detailed information
                    </li>
                  </ul>

                  <h4>Search & Filter</h4>
                  <ul>
                    <li>Real-time search across document titles and descriptions</li>
                    <li>Filter by folder using the left sidebar</li>
                    <li>Click "All Documents" to view everything</li>
                  </ul>

                  <h4>Tenant Portal Access</h4>
                  <p>Tenants can view and download their documents from the tenant portal:</p>
                  <ul>
                    <li>
                      Login at <strong>/portal/login</strong>
                    </li>
                    <li>
                      Navigate to <strong>Documents</strong>
                    </li>
                    <li>Browse folders and view/download files</li>
                    <li>
                      <strong>Read-only</strong> - Tenants cannot upload, edit, or delete
                    </li>
                  </ul>

                  <h4>File Upload Technology</h4>
                  <p>Documents are uploaded using UploadThing:</p>
                  <ul>
                    <li>
                      <strong>Real cloud storage</strong> - Files are actually uploaded (not mock
                      URLs)
                    </li>
                    <li>
                      <strong>Secure</strong> - Only authenticated landlords can upload
                    </li>
                    <li>
                      <strong>File size limits</strong> - PDFs/Office: 16MB, Images: 8MB
                    </li>
                    <li>
                      <strong>Supported formats</strong> - PDF, JPG, PNG, DOC, DOCX, XLS, XLSX
                    </li>
                    <li>
                      <strong>Progress tracking</strong> - Real-time upload status
                    </li>
                  </ul>

                  <h4>Best Practices</h4>
                  <ul>
                    <li>Use descriptive document titles for easy searching</li>
                    <li>Organize documents into appropriate folders immediately</li>
                    <li>Set expiry dates for time-sensitive documents (leases, insurance)</li>
                    <li>Use custom folders for special document categories</li>
                    <li>Regularly review and archive old documents</li>
                    <li>Add descriptions to provide context for future reference</li>
                    <li>Link documents to properties when relevant</li>
                  </ul>

                  <h4>Migration to AWS S3 (Production)</h4>
                  <p>Currently using UploadThing for development. When moving to production:</p>
                  <ul>
                    <li>Switch to AWS S3 for cost-effective scaling</li>
                    <li>Configuration is already prepared in environment variables</li>
                    <li>
                      See <code>UPLOADTHING_SETUP.md</code> for migration guide
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Messages */}
            <section id="messages" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <MessageSquare className="text-primary h-6 w-6" />
                Communication
              </h2>

              <Card className="mb-6">
                <CardContent className="docs-content space-y-4">
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
                <BarChart3 className="text-primary h-6 w-6" />
                Reports & Analytics
              </h2>

              <Card className="mb-6">
                <CardContent className="docs-content space-y-4">
                  <h4>Understanding Reports</h4>
                  <p>
                    The system provides comprehensive reporting and analytics to help you understand
                    your property portfolio's performance, track financial metrics, and make
                    data-driven decisions.
                  </p>

                  <h4>Available Reports</h4>

                  <h5>Revenue Report</h5>
                  <p>
                    Track all income streams including rent payments, booking revenue, deposits, and
                    other income. View trends over time and compare performance across properties.
                    The report includes:
                  </p>
                  <ul>
                    <li>Total revenue by month/quarter/year</li>
                    <li>Revenue breakdown by property</li>
                    <li>Income source distribution (rent, bookings, utilities, etc.)</li>
                    <li>Year-over-year growth comparisons</li>
                  </ul>

                  <h5>Expense Report</h5>
                  <p>
                    Track all property-related expenses including maintenance, taxes, insurance,
                    utilities, and more. Analyze spending patterns and identify cost-saving
                    opportunities. Includes:
                  </p>
                  <ul>
                    <li>Total expenses by category</li>
                    <li>Expense trends over time</li>
                    <li>Cost breakdown by property</li>
                    <li>Maintenance cost analysis</li>
                    <li>Tax-deductible expense summaries</li>
                  </ul>

                  <h5>Profit & Loss Statement</h5>
                  <p>
                    Calculate net profit by comparing total income against all expenses for each
                    property or your entire portfolio. This report shows:
                  </p>
                  <ul>
                    <li>Gross revenue and total expenses</li>
                    <li>Net profit/loss by property</li>
                    <li>Profit margins and ROI calculations</li>
                    <li>Portfolio-wide financial performance</li>
                    <li>Month-over-month and year-over-year comparisons</li>
                  </ul>

                  <h5>Occupancy Report</h5>
                  <p>
                    Monitor vacancy rates, occupancy trends, and booking patterns. Essential for
                    understanding property utilization:
                  </p>
                  <ul>
                    <li>Current occupancy rate by property</li>
                    <li>Average occupancy over time</li>
                    <li>Vacancy periods and duration</li>
                    <li>Booking rate for short-term rentals</li>
                    <li>Tenant turnover statistics</li>
                  </ul>

                  <h5>Payment Aging Report</h5>
                  <p>
                    Identify overdue payments and outstanding balances. Critical for cash flow
                    management:
                  </p>
                  <ul>
                    <li>Overdue payments by tenant</li>
                    <li>Aging categories (0-30, 31-60, 61-90, 90+ days)</li>
                    <li>Total outstanding balances</li>
                    <li>Payment history and trends</li>
                  </ul>

                  <h4>Analytics Dashboard</h4>
                  <p>
                    The Analytics page provides real-time insights into your property portfolio with
                    interactive charts and visualizations:
                  </p>
                  <ul>
                    <li>
                      <strong>Revenue Overview</strong> - Monthly revenue trends with line charts
                    </li>
                    <li>
                      <strong>Expense Breakdown</strong> - Category-wise expense distribution
                    </li>
                    <li>
                      <strong>Property Performance</strong> - Compare revenue across properties
                    </li>
                    <li>
                      <strong>Occupancy Metrics</strong> - Visual occupancy rate tracking
                    </li>
                    <li>
                      <strong>Booking Statistics</strong> - Short-term rental performance metrics
                    </li>
                    <li>
                      <strong>Inquiry Conversion</strong> - Track how inquiries convert to bookings
                    </li>
                    <li>
                      <strong>Top Performers</strong> - Identify your most profitable properties
                    </li>
                  </ul>

                  <h4>Generating Reports</h4>
                  <ol>
                    <li>
                      Navigate to <strong>Reports</strong> in the sidebar
                    </li>
                    <li>Select report type (Revenue, Expenses, Profit & Loss, etc.)</li>
                    <li>
                      Set date range:
                      <ul>
                        <li>This Month / Last Month</li>
                        <li>This Quarter / Last Quarter</li>
                        <li>This Year / Last Year</li>
                        <li>Custom date range</li>
                      </ul>
                    </li>
                    <li>Filter by property (optional) - View single property or all properties</li>
                    <li>
                      Click <strong>Generate Report</strong>
                    </li>
                    <li>
                      Export options:
                      <ul>
                        <li>PDF - Professional formatted reports</li>
                        <li>Excel - For further analysis and manipulation</li>
                        <li>CSV - For importing into other systems</li>
                      </ul>
                    </li>
                  </ol>

                  <h4>Report Features:</h4>
                  <ul>
                    <li>
                      <strong>Automated Scheduling</strong> - Receive reports via email on a regular
                      schedule
                    </li>
                    <li>
                      <strong>Comparative Analysis</strong> - Compare current period vs. previous
                      period
                    </li>
                    <li>
                      <strong>Visual Charts</strong> - Easy-to-understand graphs and visualizations
                    </li>
                    <li>
                      <strong>Drill-Down Details</strong> - Click on summary data to see detailed
                      transactions
                    </li>
                    <li>
                      <strong>Tax Preparation</strong> - Generate tax-ready reports with deductible
                      expenses
                    </li>
                  </ul>

                  <h4>Best Practices:</h4>
                  <ul>
                    <li>Review financial reports monthly to track performance</li>
                    <li>Use year-over-year comparisons to identify trends</li>
                    <li>Monitor occupancy rates to optimize pricing</li>
                    <li>Track expense categories to find cost-saving opportunities</li>
                    <li>Export reports regularly for accounting and tax purposes</li>
                    <li>Compare property performance to identify top performers</li>
                    <li>Use analytics to make data-driven pricing decisions</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Settings */}
            <section id="settings" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <Settings className="text-primary h-6 w-6" />
                Settings
              </h2>

              <Card className="mb-6">
                <CardContent className="docs-content space-y-4">
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
                <Globe className="text-primary h-6 w-6" />
                Public Pages & Tenant Portal
              </h2>

              <Card className="mb-6">
                <CardContent className="docs-content space-y-4">
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
                  <p>
                    Each tenant has access to their own secure portal where they can manage their
                    tenancy, communicate with you, and access important information.
                  </p>

                  <h5>Portal Access</h5>
                  <p>
                    Tenants log into the portal at <strong>/portal/auth/signin</strong> using the
                    email address you have registered for them in the system. They can set up their
                    own password on first login.
                  </p>

                  <h5>Portal Features for Tenants:</h5>
                  <ul>
                    <li>
                      <strong>Dashboard Overview</strong> - See property details, lease information,
                      and upcoming payments at a glance
                    </li>
                    <li>
                      <strong>Lease Information</strong> - View lease start/end dates, rental
                      amount, deposit paid, and lease terms
                    </li>
                    <li>
                      <strong>Property Details</strong> - Access property information, amenities,
                      and house rules
                    </li>
                    <li>
                      <strong>Payment History</strong> - Review all past payments, outstanding
                      balances, and payment receipts
                    </li>
                    <li>
                      <strong>Maintenance Requests</strong> - Submit new maintenance requests with
                      photos and descriptions, track request status
                    </li>
                    <li>
                      <strong>Document Access</strong> - View and download important documents like
                      lease agreements and receipts
                    </li>
                    <li>
                      <strong>Messages</strong> - Communicate directly with you through the portal
                    </li>
                    <li>
                      <strong>Notifications</strong> - Receive updates about maintenance, payments,
                      and announcements
                    </li>
                  </ul>

                  <h5>Submitting Maintenance Requests</h5>
                  <p>Tenants can easily submit maintenance requests through their portal:</p>
                  <ol>
                    <li>Click "Submit Request" on the dashboard</li>
                    <li>Select the issue category (Plumbing, Electrical, etc.)</li>
                    <li>Set priority level (Emergency, High, Medium, Low)</li>
                    <li>Describe the issue in detail</li>
                    <li>Upload photos of the problem (optional)</li>
                    <li>Submit the request</li>
                  </ol>
                  <p>
                    You'll be notified immediately, and tenants can track the progress of their
                    request through the portal.
                  </p>

                  <h5>Benefits of the Tenant Portal:</h5>
                  <ul>
                    <li>24/7 access to information - no need to contact you for basic details</li>
                    <li>Easy maintenance reporting - issues are documented with photos</li>
                    <li>Transparent payment history - tenants can see all transactions</li>
                    <li>Reduced communication overhead - less phone calls and emails</li>
                    <li>Professional tenant experience - modern, user-friendly interface</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Security */}
            <section id="security" className="mb-12 scroll-mt-24">
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <Shield className="text-primary h-6 w-6" />
                Security & Privacy
              </h2>

              <Card className="mb-6">
                <CardContent className="docs-content space-y-4">
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
                    Veld Unity is designed to help you comply with South Africa's Protection of
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
                <HelpCircle className="text-primary h-6 w-6" />
                Support & FAQ
              </h2>

              <Card className="mb-6">
                <CardContent className="docs-content space-y-4">
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
            <Card className="bg-muted/50 mb-6">
              <CardHeader>
                <CardTitle>Quick Reference - Keyboard Shortcuts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-semibold">Navigation</h4>
                    <ul className="space-y-1 text-sm">
                      <li>
                        <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">G</kbd>{' '}
                        then{' '}
                        <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">D</kbd> -
                        Go to Dashboard
                      </li>
                      <li>
                        <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">G</kbd>{' '}
                        then{' '}
                        <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">P</kbd> -
                        Go to Properties
                      </li>
                      <li>
                        <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">G</kbd>{' '}
                        then{' '}
                        <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">T</kbd> -
                        Go to Tenants
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-semibold">Actions</h4>
                    <ul className="space-y-1 text-sm">
                      <li>
                        <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">N</kbd> -
                        New item
                      </li>
                      <li>
                        <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">S</kbd> -
                        Save
                      </li>
                      <li>
                        <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">/</kbd> -
                        Search
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
      <footer className="bg-card border-t py-8">
        <div className="text-muted-foreground mx-auto max-w-6xl px-4 text-center text-sm">
          <p>© {new Date().getFullYear()} Veld Unity. All rights reserved.</p>
          <p className="mt-2">
            Need help? Contact us at{' '}
            <a href="mailto:support@propertycrm.co.za" className="text-primary hover:underline">
              support@propertycrm.co.za
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
