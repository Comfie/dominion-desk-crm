/**
 * DominionDesk pricing (single source of truth)
 *
 * Flat and predictable, never a percentage of rent:
 *   R99 per occupied unit per month, minimum R299, capped at R999.
 * "Occupied unit" = an active lease. Vacant units are free, so landlords only
 * pay for units that are earning rent.
 */
export const PRICING = {
  perUnit: 99,
  minimumMonthly: 299,
  maximumMonthly: 999,
  foundingTrialDays: 60,
  foundingDiscountPercent: 50, // first 12 months for beta landlords
  foundingDiscountMonths: 12,
  currency: 'ZAR',
} as const;

export interface UnitPricing {
  units: number;
  perUnit: number;
  subtotal: number; // units × per-unit
  total: number; // after minimum and cap
  minimumApplied: boolean;
  capApplied: boolean;
}

export function calculateUnitPricing(units: number): UnitPricing {
  const count = Math.max(0, Math.floor(units));
  const subtotal = count * PRICING.perUnit;
  const total = Math.min(Math.max(subtotal, PRICING.minimumMonthly), PRICING.maximumMonthly);
  return {
    units: count,
    perUnit: PRICING.perUnit,
    subtotal,
    total,
    minimumApplied: subtotal < PRICING.minimumMonthly,
    capApplied: subtotal > PRICING.maximumMonthly,
  };
}

/** Units at which the cap kicks in (R999 / R99 → 11 units). */
export const UNITS_TO_CAP = Math.ceil(PRICING.maximumMonthly / PRICING.perUnit);

export const formatRand = (amount: number) => `R${amount.toLocaleString('en-ZA')}`;
