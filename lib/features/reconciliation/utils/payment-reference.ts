/**
 * Lease payment references
 *
 * Every lease gets one stable EFT reference (e.g. "DD-7K3M9Q") that the tenant
 * uses every month. Reconciliation searches bank statement descriptions for it,
 * so it must survive the ways SA banks mangle references:
 * - hyphens/spaces stripped ("DD7K3M9Q")
 * - case changes
 * - truncation to ~20 chars (ours is 9, so it is safe)
 */

// No 0/O or 1/I/L, so tenants can't mistype the reference.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 6;
export const PAYMENT_REFERENCE_PREFIX = 'DD';

/** Uniform random index using Web Crypto (works in Node 20+, edge and browsers). */
function randomIndex(max: number): number {
  const buf = new Uint8Array(1);
  const limit = 256 - (256 % max); // rejection sampling avoids modulo bias
  let value: number;
  do {
    globalThis.crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % max;
}

export function generatePaymentReference(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomIndex(ALPHABET.length)];
  }
  return `${PAYMENT_REFERENCE_PREFIX}-${code}`;
}

/** Uppercase and strip everything that isn't A-Z / 0-9. */
export function normalizeForMatching(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * True when the normalized reference appears in the normalized bank
 * description. References shorter than 6 chars are ignored to avoid false
 * positives.
 */
export function descriptionContainsReference(description: string, reference: string): boolean {
  const ref = normalizeForMatching(reference);
  if (ref.length < 6) return false;
  return normalizeForMatching(description).includes(ref);
}
