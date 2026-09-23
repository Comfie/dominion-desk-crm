'use client';

import { useId, useState } from 'react';

import { calculateUnitPricing, PRICING, UNITS_TO_CAP } from '@/lib/config/pricing';

export function PricingCalculator() {
  const [units, setUnits] = useState(6);
  const id = useId();
  const price = calculateUnitPricing(units);
  const founding = Math.round(price.total * (1 - PRICING.foundingDiscountPercent / 100));

  return (
    <div className="rounded-xl border border-[#D5DEEC] bg-white p-6 sm:p-8">
      <label htmlFor={id} className="block text-sm font-medium text-[#33445C]">
        How many of your units have a tenant in them?
      </label>
      <div className="mt-3 flex items-center gap-4">
        <input
          id={id}
          type="range"
          min={1}
          max={30}
          value={units}
          onChange={(e) => setUnits(Number(e.target.value))}
          className="h-2 w-full cursor-pointer accent-[#0A2D67]"
        />
        <span className="w-12 text-right text-2xl font-semibold text-[#0A2D67] tabular-nums">
          {units}
        </span>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-t border-[#E6ECF5] pt-6">
        <div>
          <p className="text-sm text-[#5B6B82]">After your free {PRICING.foundingTrialDays} days</p>
          <p
            className="mt-1 text-5xl font-semibold tracking-tight text-[#0E1A2B] tabular-nums"
            data-testid="calculated-price"
          >
            R{price.total}
            <span className="text-lg font-normal text-[#5B6B82]">/month</span>
          </p>
          <p className="mt-2 text-sm text-[#5B6B82]">
            {price.minimumApplied
              ? `The R${PRICING.minimumMonthly} minimum covers up to 3 units.`
              : price.capApplied
                ? `Capped at R${PRICING.maximumMonthly}. Units beyond ${UNITS_TO_CAP} cost nothing.`
                : `${units} units × R${PRICING.perUnit}.`}
          </p>
        </div>
        <div className="rounded-lg bg-[#EEF4FF] px-4 py-3 text-sm">
          <p className="font-semibold text-[#0A2D67]">Founding landlords pay R{founding}/month</p>
          <p className="text-[#33445C]">
            {PRICING.foundingDiscountPercent}% off for the first {PRICING.foundingDiscountMonths}{' '}
            months
          </p>
        </div>
      </div>
    </div>
  );
}
