# Beta launch: bank reconciliation, beta scope, pricing, landing page

Branch: `feature/beta-reconciliation-launch` → `develop`

## Why

The beta pitch is "stop chasing rent", but landlords still had to open their
banking app and match EFTs by hand. Card gateways are hard to get and most SA
tenants pay by EFT anyway. This PR makes the core loop work without a gateway:
**upload your bank statement, see who hasn't paid.**

## What changed

### Bank reconciliation (new)

- `PropertyTenant.paymentReference`: stable per-lease EFT reference (`DD-XXXXXX`, no 0/O/1/I).
- New models `BankStatementImport`, `BankTransaction` (dedupe via `@@unique([userId, fingerprint])`).
- `lib/features/reconciliation`: CSV parser (SA bank layouts, manual column mapping fallback),
  scoring engine (reference +60, amount +25, surname +20, timing +5; suggest ≥50, strong ≥80),
  service with confirm / reject / ignore / restore / unmatch / confirm-all.
- Confirming updates the invoice to `PAID` / `PARTIALLY_PAID`; undo recalculates.
- API: `/api/reconciliation` (+ `/import`, `/transactions/[id]`, `/confirm-all`, `/open-payments`, `/rematch`).
  Landlords + team members with `canManageFinancials` only; audit-logged.
- UI: `/financials/reconciliation` with upload, mapping dialog, review tabs, invoice picker,
  and tenant reference list with WhatsApp send.
- Tenant portal shows the lease reference; disabled card option removed.

### Beta scope (`lib/config/beta-scope.ts`)

- Hidden: Bookings, Placement, Integrations (nav + middleware redirect).
- Mock Paystack/Stripe APIs return 404 (`betaApiGuard`, since middleware skips `/api`).
- Dashboard "Recent bookings" replaced by a reconciliation CTA.
- Flags: `NEXT_PUBLIC_BETA_MODE=false`, `NEXT_PUBLIC_ENABLE_PLACEMENT=true`.

### Pricing (`lib/config/pricing.ts`)

- R99 per occupied unit (active lease), minimum R299, cap R999. Vacant units free.
- Trial property limit default raised 2 → 50 so prospects can load a full portfolio.

### Cron

- `/api/cron/daily` (GET + POST) runs all daily jobs in order; `vercel.json` schedules it at 04:00 UTC (06:00 SAST).
- Fixes: Vercel Cron sends GET, but every job endpoint was POST-only.
- `.github/workflows/daily-cron.yml`: manual trigger (not scheduled, to avoid double reminders).

### Landing page

- Rebuilt around an interactive statement → rent-roll demo, honest "not built yet" list,
  per-unit pricing calculator, FAQ. Removed invented stats and placement-first copy.

### Invoices (bug fixes)

- Invoice emails never showed the landlord's bank details (they moved to encrypted storage but
  the template still read `payment.user`). New `invoiceService.buildInvoice()` loads them; all
  six senders use it.
- Plain-text invoices contained 567 NUL bytes and corrupted emoji; repaired, with a regression test.
- Invoices now show the lease reference (`DD-XXXXXX`) in a prominent "pay with this reference" box.
- New leases get a reference automatically before monthly rent generation.

### App-wide typography fix

- `globals.css` defined `--font-bold: 700` inside `@theme`. In Tailwind v4 `--font-*` means font
  family, so `.font-bold` compiled to `font-family: 700` and **every bold/semibold in the app
  rendered at regular weight**. Renamed to `--font-weight-*`. Expect headings across the
  dashboard to look noticeably bolder, as originally designed.

### Admin

- Subscription settings show the live per-unit pricing with examples; legacy % fields hidden;
  warning when the trial property limit is below 10. Card-fee setting hidden during beta.

### Housekeeping

- Fixed pre-existing lint error (`Date.now()` in render) and a time-bomb in `subscription.service.test.ts`.

## Verification

- `npm run type-check` clean
- `NODE_ENV=test npx vitest run`: **183/183 passing** (was 23 failing, all caused by `NODE_ENV=production` in the shell)
- `npm run build` succeeds

## Deploy checklist

1. Back up Railway Postgres.
2. `npx prisma migrate deploy` (adds tables, backfills lease references).
3. Vercel env: `CRON_SECRET` set. Optional: `NEXT_PUBLIC_BETA_MODE`, `NEXT_PUBLIC_ENABLE_PLACEMENT`.
4. Admin → Settings → Subscription: confirm trial property limit (DB value overrides code default).
5. Disable cron-job.org jobs after the first successful Vercel cron run.
6. Smoke test: register landlord → add 2 tenants → generate rent → upload a real bank CSV → confirm matches → check tenant portal reference.

## Known follow-ups

- Bank CSV fixtures from real FNB/Absa/Nedbank/Standard Bank/Capitec exports (only synthetic layouts tested).
- Restart any running `next dev` after pulling: the typography fix is in `globals.css` and a long-running dev server may serve stale CSS.
