# Property Management CRM

**A modern, full-stack Property Management CRM system for South African landlords and property managers.**

## 🎯 Overview

Property Management CRM enables landlords to manage both long-term rentals and short-term Airbnb properties from a single platform. The system provides automated payment reminders, tenant communication, booking management, and comprehensive financial tracking.

**Status**: ✅ Core features complete and operational  
**Version**: 1.0.0  
**Tech Stack**: Next.js 15, TypeScript, PostgreSQL, Prisma, NextAuth.js

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd property-crm

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## ✨ Core Features

### Completed ✅

- **Property Management** - Full CRUD with import/export, multiple property types
- **Booking Management** - Availability checking, automatic pricing, conflict prevention
- **Tenant Management** - Profiles, documents, lease tracking, tenant portal
- **Payment System** - Automated monthly generation, reminders, invoicing
- **Messaging System** - Automated messaging with 15 triggers, template engine
- **User Management** - Multi-role support (Admin, Landlord, Tenant), team members
- **Analytics Dashboard** - Key metrics, upcoming events, revenue tracking
- **Maintenance Management** - Work orders, status tracking, cost management
- **Expense Tracking** - Categories, reports, property assignment
- **Document Management** - Folder organization, upload/download, search
- **Inquiry Management** - Lead tracking, status workflow, conversion
- **Task Management** - To-do lists, priorities, due dates, assignment

### In Progress 🚧

- Calendar integration (Airbnb, Booking.com)
- Payment gateway integration (PayStack, Stripe)
- SMS notifications (Twilio)
- Advanced reporting and analytics

## 📚 Documentation

- **[Project Status](docs/PROJECT_STATUS.md)** - Comprehensive project overview and feature status
- **[Architecture Guide](ARCHITECTURE_GUIDE.md)** - Technical architecture and patterns
- **[Master Plan](PROPERTY_MANAGEMENT_CRM_PLAN.md)** - Original project vision and roadmap
- **[Archive](docs/archive/)** - Historical implementation documentation

## 🏗️ Tech Stack

**Frontend**: Next.js 15, TypeScript, shadcn/ui, Tailwind CSS  
**Backend**: Next.js API Routes, PostgreSQL, Prisma ORM  
**Auth**: NextAuth.js with role-based access control  
**Email**: Nodemailer (SMTP)  
**Files**: UploadThing  
**Hosting**: Vercel

**Architecture**: Three-layer (API → Service → Repository)  
**Multi-tenancy**: Organization-based data isolation  
**Automation**: Vercel Cron (3 active jobs)

## 🔑 Environment Variables

Required environment variables (see `.env.example` for complete list):

```bash
DATABASE_URL=           # PostgreSQL connection string
NEXTAUTH_SECRET=        # Session encryption secret
NEXTAUTH_URL=           # Application URL
CRON_SECRET=           # Cron job authentication
SMTP_HOST=             # Email server
SMTP_USER=             # Email username
SMTP_PASS=             # Email password
UPLOADTHING_SECRET=    # File upload secret
```

## 🤝 User Roles

- **SUPER_ADMIN** - Full system access, user management
- **CUSTOMER (Landlord)** - Manage properties, bookings, tenants, payments
- **TENANT** - View payments, invoices, documents, messages

## 📊 Key Statistics

- **Database Models**: 25+
- **API Endpoints**: 90+
- **Frontend Pages**: 50+
- **Completed Features**: 14 major phases
- **Automated Jobs**: 3 (payment generation, reminders, overdue marking)

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Build
npm run build

# Production mode
npm start
```

## 📝 License

Proprietary - All rights reserved

## 🙏 Support

For questions or issues, refer to the [documentation](docs/PROJECT_STATUS.md) or contact the development team.

---

**Built with ❤️ for South African property managers**
