# Documentation History

This file replaces the previous archive of implementation summaries, prompts, plans, and one-off fix notes. The original files were useful while the project was being built, but they duplicated current docs and made the folder difficult to navigate.

## Consolidated Sources

The cleanup merged useful details from these themes:

- Original CRM master plan and roadmap
- Project status and launch planning
- Architecture refactor notes
- Payment feature summaries and payment testing guides
- Lease validation notes
- Multi-tenant test results
- Automation and messaging documentation
- Historical implementation session summaries
- Landing page prompts and plans
- Superpowers plans/specs for previous feature work

## Historical Milestones

### Foundation And Architecture

- The codebase moved toward a three-layer API/service/repository pattern.
- Core shared pieces were added: auth helpers, DTO validation, error handling, audit logging, and multi-tenant scoping.
- Service-layer coverage is strong for core modules but not universal.

### Core Property CRM

- Property, booking, tenant, payment, maintenance, expense, task, document, inquiry, and reporting modules were implemented.
- Property document folders, valuations, inspections, and advanced reports were added later.
- Tenant portal and landlord dashboard flows became central user surfaces.

### Payment And Rent Collection

- Monthly rent generation, reminders, invoices, proof-of-payment handling, rent collection dashboard, manual invoices, tenant payment ledgers, and payment health badges were implemented.
- Banking details moved to encrypted storage.
- Multi-tenant property support changed payment generation from tenant-level to lease-level.

### Billing

- PayFast subscription billing was added for landlord subscriptions.
- Billing history, cancellation, webhook records, subscription statuses, and admin monitoring were introduced.
- Sandbox and production verification remain launch-readiness requirements.

### Messaging

- Messaging automation design, backend services, scheduled queue, and UI were implemented.
- Email delivery is the practical current channel.
- SMS/WhatsApp and AI enhancement remain future/partial.

### Team And Admin

- Team member invitations, role presets, permission controls, and team settings were implemented.
- Super admin user and subscription monitoring pages were added.

### Placement

- Agency-specific placement flows were added for landlord owners, mandates, viewings, rental applications, screening, and placement completion.

### Product And Launch Direction

- The product positioning narrowed toward an operations-first long-term rental CRM for beta.
- Launch guidance emphasizes rent collection, arrears visibility, lease tracking, tenant self-service, maintenance, documents, and inspections.

## Archived Content Policy

Future historical notes should be summarized here only when they add durable project context. Avoid adding separate markdown files for:

- "Final fix" notes
- Session summaries
- Temporary prompts
- One-off verification logs
- Implementation plans that are already completed
