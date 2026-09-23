/**
 * Beta scope
 *
 * The beta is sold as an operations-first landlord CRM for long-term rentals:
 * rent collection, bank reconciliation, arrears, leases, tenant portal,
 * maintenance, inspections, documents. Anything not production-ready is hidden
 * here, in ONE place, rather than deleted, so it can come back per feature.
 *
 * Turn the whole beta filter off with NEXT_PUBLIC_BETA_MODE=false.
 * Re-enable agency placement for a controlled preview with
 * NEXT_PUBLIC_ENABLE_PLACEMENT=true.
 */

export const BETA_MODE = process.env.NEXT_PUBLIC_BETA_MODE !== 'false';
export const PLACEMENT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PLACEMENT === 'true';

/** Dashboard pages hidden during beta (prefix match). */
const HIDDEN_PAGE_PREFIXES = [
  '/bookings', // short-term bookings: Airbnb/Booking.com sync is a placeholder
  '/settings/integrations', // integrations are placeholders
  ...(PLACEMENT_ENABLED ? [] : ['/placement']), // agency placement: preview only
];

/** API routes that are mocks/placeholders and must not be reachable in beta. */
const HIDDEN_API_PREFIXES = [
  '/api/payments/paystack',
  '/api/payments/stripe',
  '/api/tenant/payments/paystack',
];

/** Tenant portal routes hidden during beta. */
const HIDDEN_PORTAL_PREFIXES = ['/portal/payments/'];
const HIDDEN_PORTAL_SUFFIX = '/pay/mock';

const matchesPrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`);

export function isPageHiddenInBeta(pathname: string, betaMode = BETA_MODE): boolean {
  if (!betaMode) return false;
  if (
    HIDDEN_PORTAL_PREFIXES.some((p) => pathname.startsWith(p)) &&
    pathname.endsWith(HIDDEN_PORTAL_SUFFIX)
  ) {
    return true;
  }
  return HIDDEN_PAGE_PREFIXES.some((p) => matchesPrefix(pathname, p));
}

export function isApiHiddenInBeta(pathname: string, betaMode = BETA_MODE): boolean {
  if (!betaMode) return false;
  return HIDDEN_API_PREFIXES.some((p) => matchesPrefix(pathname, p));
}

/**
 * Call at the top of placeholder API handlers. Returns a 404 Response while in
 * beta, or null to continue. (Middleware can't do this: its matcher skips /api.)
 */
export function betaApiGuard(request: Request): Response | null {
  const { pathname } = new URL(request.url);
  if (!isApiHiddenInBeta(pathname)) return null;
  return Response.json({ error: 'Not available during beta' }, { status: 404 });
}
