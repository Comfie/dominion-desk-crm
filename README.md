# Property CRM

A full-stack property management CRM for South African landlords, property managers, and rental agencies.

## Overview

Property CRM supports long-term rental operations across properties, tenants, leases, rent collection, maintenance, documents, reporting, messaging, and billing. The current beta direction is operations-first: rent collection, arrears visibility, lease tracking, tenant self-service, maintenance coordination, documents, and inspections.

## Current Status

Core landlord workflows are implemented. Some integrations and payment-provider flows are still partial or mocked, and cron schedules are not currently enabled in `vercel.json`.

Read [Project Status](docs/PROJECT_STATUS.md) for the current feature and launch-readiness view.

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL
- npm

### Setup

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful Scripts

```bash
npm run dev
npm run type-check
npm test -- --run
npm run build
npm run db:migrate
npm run db:seed
```

## Documentation

- [Documentation Index](docs/README.md)
- [Project Status](docs/PROJECT_STATUS.md)
- [Architecture Guide](docs/ARCHITECTURE_GUIDE.md)
- [Operations Guide](docs/OPERATIONS_GUIDE.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [History](docs/HISTORY.md)

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- PostgreSQL and Prisma 7
- NextAuth.js
- Tailwind CSS and Radix UI components
- Vitest and Testing Library
- UploadThing
- Nodemailer/SMTP
- PayFast subscription billing

## Roles

- `SUPER_ADMIN`: platform administration and user management
- `CUSTOMER`: landlord/property manager workspace
- `TENANT`: tenant portal access

## License

Proprietary. All rights reserved.
