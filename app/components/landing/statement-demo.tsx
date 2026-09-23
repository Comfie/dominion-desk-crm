'use client';

import { useState } from 'react';

type Outcome = 'paid' | 'part' | 'review' | 'skip';

interface StatementLine {
  date: string;
  description: string;
  amount: number;
  outcome: Outcome;
}

interface TenantRow {
  name: string;
  unit: string;
  rent: number;
  received: number;
  reason?: string;
}

const LINES: StatementLine[] = [
  { date: '01 Sep', description: 'FNB APP PAYMENT FROM DD-7K3M9Q', amount: 8500, outcome: 'paid' },
  { date: '01 Sep', description: 'ABSA TRF S DUBE RENT SEPT', amount: 7200, outcome: 'paid' },
  {
    date: '02 Sep',
    description: 'DEBIT ORDER CITY OF JHB RATES',
    amount: -2145.6,
    outcome: 'skip',
  },
  { date: '03 Sep', description: 'CAPITEC DD-M4Q8TX', amount: 3000, outcome: 'part' },
  { date: '04 Sep', description: 'CASH DEPOSIT BRAAMFONTEIN', amount: 950, outcome: 'review' },
];

const TENANTS: TenantRow[] = [
  {
    name: 'Thandi Moyo',
    unit: 'Loveday Court, Unit 2',
    rent: 8500,
    received: 8500,
    reason: 'reference DD-7K3M9Q',
  },
  {
    name: 'Sipho Dube',
    unit: 'Loveday Court, Unit 5',
    rent: 7200,
    received: 7200,
    reason: 'surname and exact amount',
  },
  {
    name: 'Lerato Khumalo',
    unit: '12 Jan Smuts Ave',
    rent: 6500,
    received: 3000,
    reason: 'reference DD-M4Q8TX',
  },
  { name: 'Johan van Wyk', unit: 'Loveday Court, Unit 7', rent: 9800, received: 0 },
];

const rand = (n: number) =>
  `${n < 0 ? '−' : ''}R ${Math.abs(n).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

const BADGE = {
  waiting: 'bg-[#EEF2F8] text-[#5B6B82]',
  paid: 'bg-[#E3F2E8] text-[#1F7A4D]',
  part: 'bg-[#FDEFD9] text-[#B45309]',
  unpaid: 'bg-[#FCE4E2] text-[#B42318]',
} as const;

/**
 * The landing page's one memorable moment: a landlord's own bank statement
 * resolving into a paid / short / unpaid rent roll when they press the button.
 * Motion only runs on click and is disabled for prefers-reduced-motion.
 */
export function StatementDemo() {
  const [matched, setMatched] = useState(false);
  const outstanding = TENANTS.reduce((sum, t) => sum + (t.rent - t.received), 0);

  return (
    <div className="overflow-hidden rounded-xl border border-[#D5DEEC] bg-white shadow-[0_24px_60px_-28px_rgba(10,45,103,0.45)]">
      <div className="flex items-baseline justify-between gap-4 border-b border-[#E6ECF5] px-5 pt-4 pb-3">
        <p className="text-sm font-semibold text-[#0A2D67]">Cheque account, September</p>
        <p className="text-xs text-[#5B6B82]">statement.csv</p>
      </div>

      <ul className="divide-y divide-[#EEF2F8]">
        {LINES.map((line, i) => {
          const tint = !matched
            ? ''
            : line.outcome === 'skip'
              ? 'opacity-40'
              : line.outcome === 'review'
                ? 'bg-[#FDF6EC]'
                : 'bg-[#F1F8F4]';
          return (
            <li
              key={line.description}
              className={`grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 px-5 py-2.5 text-sm transition-all duration-500 motion-reduce:transition-none ${tint}`}
              style={{ transitionDelay: matched ? `${i * 120}ms` : '0ms' }}
            >
              <span className="text-[#5B6B82] tabular-nums">{line.date}</span>
              <span className="truncate text-[#0E1A2B]">{line.description}</span>
              <span
                className={`text-right font-medium tabular-nums ${
                  line.amount < 0 ? 'text-[#5B6B82]' : 'text-[#1F7A4D]'
                }`}
              >
                {rand(line.amount)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-3 border-y border-[#E6ECF5] bg-[#F6F8FC] px-5 py-3">
        <p className="text-sm text-[#33445C]">
          {matched
            ? '4 deposits matched, 1 needs your eye'
            : 'Upload the CSV from your banking app'}
        </p>
        <button
          type="button"
          onClick={() => setMatched((m) => !m)}
          aria-pressed={matched}
          className="shrink-0 rounded-md bg-[#0A2D67] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#123C85] focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {matched ? 'Reset demo' : 'Match statement'}
        </button>
      </div>

      <div className="px-5 pt-3 pb-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-[#0A2D67]">September rent</p>
          <p className="text-sm text-[#33445C] tabular-nums" aria-live="polite">
            {matched ? `${rand(outstanding)} outstanding` : 'Waiting for statement'}
          </p>
        </div>
        <ul className="space-y-1.5">
          {TENANTS.map((t, i) => {
            const status = !matched
              ? 'waiting'
              : t.received >= t.rent
                ? 'paid'
                : t.received > 0
                  ? 'part'
                  : 'unpaid';
            const label = {
              waiting: 'Waiting',
              paid: 'Paid',
              part: `Short ${rand(t.rent - t.received)}`,
              unpaid: 'Not paid',
            }[status];
            const delay = { transitionDelay: matched ? `${600 + i * 120}ms` : '0ms' };
            return (
              <li key={t.name} className="flex items-center justify-between gap-3 px-2 py-1.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#0E1A2B]">{t.name}</p>
                  <p className="truncate text-xs text-[#5B6B82]">
                    {matched && t.reason ? `Matched by ${t.reason}` : t.unit}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums transition-colors duration-500 motion-reduce:transition-none ${BADGE[status]}`}
                  style={delay}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
