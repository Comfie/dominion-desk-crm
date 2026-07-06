# Operations Guide

This guide collects the operational details that were previously spread across payment, automation, setup, and implementation notes.

## Environment Variables

Common required variables:

```bash
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NEXT_PUBLIC_APP_URL=
CRON_SECRET=

SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=

UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=

BANKING_ENCRYPTION_KEY=

PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_PASSPHRASE=
PAYFAST_SANDBOX=true
```

Generate a banking encryption key with:

```bash
openssl rand -hex 32
```

Keep `BANKING_ENCRYPTION_KEY` backed up securely. If it is lost, encrypted banking details cannot be recovered.

## Cron Jobs

The codebase contains endpoints for scheduled work, but `vercel.json` currently has:

```json
{
  "crons": []
}
```

Before production launch, decide which jobs should run and add schedules intentionally.

Candidate schedules:

| Endpoint                               | Suggested Schedule | Purpose                               |
| -------------------------------------- | ------------------ | ------------------------------------- |
| `/api/payments/generate-monthly`       | `0 0 25 * *`       | Generate next month rent payments     |
| `/api/payments/send-reminders`         | `0 9 * * *`        | Send payment reminders                |
| `/api/payments/mark-overdue`           | `0 0 * * *`        | Mark overdue payments                 |
| `/api/payments/send-overdue-reminders` | `0 10 * * *`       | Send overdue reminders                |
| `/api/maintenance/send-follow-ups`     | `0 10 * * *`       | Follow up stale maintenance requests  |
| `/api/messaging/scheduled/process`     | `*/15 * * * *`     | Process scheduled automation messages |

These endpoints should require `Authorization: Bearer ${CRON_SECRET}` or equivalent route-level protection before production use.

## Messaging Automations

Automations support event triggers, offsets, time-of-day scheduling, templates, and property/rental filters.

Implemented channel:

- Email via SMTP

Future or partial channels:

- SMS
- WhatsApp
- In-app notifications

Supported trigger groups:

- Booking created, confirmed, check-in reminders, check-out reminders, booking completed, review request
- Payment reminder, payment received, payment overdue
- Maintenance scheduled and completed
- Lease renewal reminder
- Custom date placeholder

Template variables use `{{variableName}}` syntax. Common variables include:

- Booking: `guestName`, `propertyName`, `checkInDate`, `checkOutDate`, `totalAmount`, `bookingReference`
- Tenant/payment: `tenantName`, `propertyName`, `leaseStartDate`, `leaseEndDate`, `monthlyRent`, `amount`, `dueDate`, `paymentReference`
- Maintenance: `propertyName`, `requestTitle`, `requestDescription`, `scheduledDate`, `assignedTo`

## Rent Collection And Invoicing

Current implemented workflows:

- Monthly rent generation
- Rent collection dashboard
- Manual invoice creation
- Payment proof workflow
- Tenant and landlord payment ledgers
- Payment reminders
- Invoice HTML generation
- Banking details on invoices

Important rules:

- Multi-tenant properties generate payments per active lease.
- Lease-level rent is authoritative for rent generation.
- Unit labels should appear in invoice descriptions when present.
- EFT/manual payment workflows are the safest beta path.

## Banking Details

Banking details are encrypted with AES-256-GCM and stored in `EncryptedBankingDetails`.

API:

- `GET /api/settings/banking`
- `POST /api/settings/banking`
- `DELETE /api/settings/banking`

Security expectations:

- Never commit encryption keys.
- Do not log decrypted banking details.
- Keep backup procedures for `BANKING_ENCRYPTION_KEY`.
- Treat key rotation as future work unless explicitly implemented.

## Tenant Payment Transaction Fees

Card payment flows can calculate an online transaction fee through system settings, with a default concept of 3%. EFT payments should not add that fee.

Production caveat: Paystack/Stripe tenant payment endpoints are not launch-ready. Do not market live tenant card payments until the chosen gateway is fully implemented and tested.

## PayFast Subscription Billing

PayFast is used for landlord subscription billing, not tenant rent collection.

Implemented:

- Subscription initiation
- ITN webhook handling
- Signature and amount verification
- Billing invoice records
- Subscription cancellation
- Billing history
- Admin subscription monitoring

Launch checklist:

- Validate sandbox subscription initiation.
- Validate ITN/webhook handling through a public tunnel or deployed test environment.
- Configure production credentials.
- Validate success, cancel, failed, duplicate, and tampered webhook cases.
- Add or verify subscription lifecycle emails.
- Add failed-payment recovery/dunning before depending on recurring billing at scale.

## Integrations

Treat these as partial until proven in production:

- Airbnb calendar sync
- Booking.com calendar sync
- Google Calendar sync
- Paystack tenant payments
- Stripe tenant payments
- SMS
- WhatsApp

Do not expose placeholder sync status or mock payment success in production-facing flows.

## Deployment Readiness

Before inviting beta users:

- Run type-check, test suite, and production build.
- Verify all required environment variables in the target deployment.
- Remove demo-only credentials and internal affordances.
- Enable only the cron jobs that are secure and verified.
- Validate upload, email, rent generation, proof upload, invoice viewing, tenant portal access, and billing flows end to end.
