# Coming Soon / Early Access Page — Design Spec

**Date:** 2026-03-12
**Branch:** `main` (production — dominiondesk.com)
**Goal:** Replace the full landing page on `main` with a high-converting early access page while the production DB is being fixed. Captures beta applicants via email, no database required.

---

## Purpose

DominionDesk is fully built but the production environment is temporarily unavailable. This page keeps the domain active, converts visitors into beta applicants, and communicates exclusivity ("apply now" feel).

---

## Architecture

### Files to create/modify

| File                        | Action                                                  |
| --------------------------- | ------------------------------------------------------- |
| `app/page.tsx`              | Replace with early access page (main branch only)       |
| `app/api/waitlist/route.ts` | New API route — receives name + email, sends via Resend |

### Environment variables

| Variable         | Purpose                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY` | Already set — used to send emails                                                                                           |
| `FROM_EMAIL`     | Already set — sender address                                                                                                |
| `OWNER_EMAIL`    | New — destination for beta applications (e.g. `comfynyatsine@gmail.com`)                                                    |
| `DATABASE_URL`   | Already set in Vercel production — the DB URL is present even though the DB connection fails at runtime; the app boots fine |

### Data flow

1. User fills in name + email on the page
2. Client POSTs to `/api/waitlist`
3. API route calls Resend to email `process.env.OWNER_EMAIL` with applicant details
4. Returns `{ success: true }` — UI shows confirmation message
5. No confirmation email is sent to the applicant — the success state on the page is the only acknowledgement (intentional: simpler, no spam risk)

No database calls anywhere on this page or the API route.

### Middleware note

`/api/*` routes are excluded from the middleware matcher pattern in `middleware.ts` — no middleware changes needed. The `/api/waitlist` route is publicly accessible to unauthenticated users by default.

---

## Page Structure

### Nav

- Left: DominionDesk logo (text-based, navy/white)
- Right: "Apply for Early Access" button — smooth scrolls to `#apply`

### Hero (dark navy background)

- **Headline:** "Your Property. Managed." (large, bold)
- **Subheadline:** 2 lines — what DominionDesk does and who it's for (SA landlords, property managers, Airbnb hosts)
- **Form** (`id="apply"`): Name field + Email field + "Apply for Beta Access" CTA button (sky blue)
- **Trust line:** "Free during beta · No credit card required · Built for SA landlords"

### Feature Cards (3 cards, slightly lighter navy background)

1. **Automated Rent Reminders** — Stop chasing tenants. Automated reminders before and after due date.
2. **Tenant Portal & Payments** — Tenants upload proof of payment. You get notified instantly.
3. **Financial Reports & Tax** — Income, expenses, and tax-ready reports across all your properties.

Each card: icon (Lucide), bold title, one-line description.

### Footer

- Logo + tagline left
- `support@dominiondesk.com` right
- Copyright line

---

## API Route

**`POST /api/waitlist`**

Request body:

```json
{ "name": "string", "email": "string" }
```

Validation:

- Both fields required
- Basic email format check

Rate limiting: accepted risk for this temporary page. Resend's own plan limits provide a natural ceiling. No IP-based rate limiting implemented.

On success: sends email to `process.env.OWNER_EMAIL` via Resend, returns `{ success: true }`
On failure: returns `{ error: "..." }` with appropriate status code

Email format sent to owner:

```
Subject: New Beta Application — DominionDesk
Body: Name: <name>, Email: <email>, Applied at: <timestamp>
```

---

## Design Tokens (from existing globals.css)

- Background (hero): `hsl(215 28% 10%)` — deep dark blue
- Background (cards): `hsl(215 25% 15%)`
- Primary accent: `hsl(217 91% 60%)` — sky blue
- Text: `hsl(210 20% 98%)` — off-white
- Font: Geist Sans (already configured)

---

## Success Criteria

- Page loads at dominiondesk.com with no errors
- Form submission sends an email to `OWNER_EMAIL`
- Form shows a success state after submission
- Page is responsive (mobile + desktop)
- No database calls anywhere on the page
