# Launch Plan

## Goal

Launch a tightly scoped beta that makes the product indispensable for small landlords managing long-term rentals.

## Beta Positioning

This beta should be sold as an operations-first landlord CRM focused on:

- Rent collection
- Arrears visibility
- Lease tracking
- Tenant self-service
- Maintenance coordination
- Documents and inspections

Do not position the beta around:

- Live online card payments unless Paystack is configured
- Airbnb / Booking.com direct sync
- SMS / WhatsApp automation

## Beta Scope

### Included in Beta

- Property management
- Tenant onboarding and lease assignment
- Monthly rent generation
- Rent collection dashboard
- Payment proof workflow
- Aging receivables
- Lease expiration reporting
- Tenant portal
- Maintenance requests
- Inspections
- Document storage

### Excluded or Hidden in Beta

- Mock card payment flows
- Placeholder platform syncs
- SMS / WhatsApp delivery
- Any demo credentials or internal-only affordances

## P0 Before Inviting Testers

- Eliminate demo and mock exposure from production flows
- Standardize tenant portal identity resolution
- Fix failing tests and type-check blockers
- Validate portal payments, proof upload, and landlord verification end-to-end
- Validate rent generation and reminder workflows for one landlord and one tenant

## P1 First Tester Cohort

- 3 to 5 landlords
- 1 to 20 properties each
- Primarily long-term rental workflows
- Weekly feedback calls
- Concierge onboarding and data import support

## Success Metrics

- At least 80% of testers use rent collection weekly
- At least 60% of testers use tenant portal features
- At least 50% of testers log or track maintenance inside the system
- At least 3 testers say they would be materially worse off without the product

## Product Direction To Become Must-Have

### Rent & Arrears

- Late fee rules
- Promise-to-pay tracking
- Arrears escalation states
- Notice templates
- Collector-style follow-up queue

### Lease Lifecycle

- Renewal pipeline
- Vacancy planning
- Deposit reconciliation
- Move-in vs move-out inspection comparison
- Lease expiry task automation

### Maintenance Operations

- Vendor directory
- Assigned jobs and ETAs
- Quote capture and approval
- Completion evidence
- SLA tracking

### Landlord Command Center

- Today’s collections
- Overdue tenants
- Expiring leases
- Vacancies
- Unresolved maintenance

## Rollout Sequence

1. Ship P0 hardening and verify quality gates.
2. Onboard first 3 landlords manually.
3. Collect friction and failure points for 2 weeks.
4. Implement top arrears and lease-lifecycle gaps.
5. Expand to 10 to 15 landlords only after stable weekly usage.
