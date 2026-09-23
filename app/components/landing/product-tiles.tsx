import { Bell, TrendingDown, Wrench } from 'lucide-react';

/**
 * Small, static product vignettes for the feature bento. Each one shows the
 * real screen in miniature rather than describing it.
 */

export function ArrearsTile() {
  const buckets = [
    { label: 'Current', value: 41200, tone: 'bg-[#34D399]' },
    { label: '1–30 days', value: 9800, tone: 'bg-[#FBBF24]' },
    { label: '31–60', value: 3500, tone: 'bg-[#F97316]' },
    { label: '60+', value: 1200, tone: 'bg-[#F87171]' },
  ];
  const max = Math.max(...buckets.map((b) => b.value));
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 text-[#9FB7E0]">
        <TrendingDown className="h-4 w-4" aria-hidden />
        <span className="text-sm">Arrears by age</span>
      </div>
      <div className="mt-5 flex flex-1 items-end gap-3" aria-hidden>
        {buckets.map((b) => (
          <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={`w-full rounded-t-md ${b.tone}`}
              style={{ height: `${Math.max(10, (b.value / max) * 120)}px` }}
            />
            <span className="text-[11px] text-[#9FB7E0]">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReminderTile() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="flex items-center gap-2 text-[#33445C]">
        <Bell className="h-4 w-4 text-[#3B82F6]" />
        <span className="text-sm">Sent automatically, 3 days before the 1st</span>
      </div>
      <div className="rounded-lg border border-[#E6ECF5] bg-white p-3 shadow-sm">
        <p className="text-xs text-[#5B6B82]">To: Thandi Moyo</p>
        <p className="mt-1 text-sm font-semibold text-[#0E1A2B]">
          October rent: R8 500 due on the 1st
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[#33445C]">
          Please pay by EFT with your reference{' '}
          <strong className="text-[#0A2D67]">DD-7K3M9Q</strong>. It&apos;s the same every month.
        </p>
      </div>
    </div>
  );
}

export function PortalTile() {
  return (
    <div className="flex h-full items-end justify-center" aria-hidden>
      <div className="w-44 rounded-[1.6rem] border-[5px] border-[#0E1A2B] bg-white p-3 shadow-xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#0E1A2B]" />
        <p className="text-[10px] text-[#5B6B82]">Your rent</p>
        <p className="text-lg font-semibold text-[#0E1A2B] tabular-nums">R 8 500</p>
        <span className="mt-1 inline-block rounded-full bg-[#FDEFD9] px-2 py-0.5 text-[10px] font-semibold text-[#B45309]">
          Due 1 Oct
        </span>
        <div className="mt-3 rounded-md bg-[#EEF4FF] p-2">
          <p className="text-[9px] text-[#33445C]">Your reference</p>
          <p className="text-sm font-bold tracking-wider text-[#0A2D67]">DD-7K3M9Q</p>
        </div>
        <div className="mt-2 space-y-1">
          {['Sep · Paid', 'Aug · Paid', 'Jul · Paid'].map((row) => (
            <div key={row} className="flex justify-between text-[10px] text-[#5B6B82]">
              <span>{row.split(' · ')[0]}</span>
              <span className="font-semibold text-[#1F7A4D]">{row.split(' · ')[1]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MaintenanceTile() {
  return (
    <div className="space-y-2" aria-hidden>
      {[
        { t: 'Geyser leaking, Unit 5', s: 'Plumber booked Thu', c: 'bg-[#DBEAFE] text-[#1D4ED8]' },
        { t: 'Gate motor stuck', s: 'Quote R1 850', c: 'bg-[#FDEFD9] text-[#B45309]' },
        { t: 'Kitchen tap, Unit 2', s: 'Done · R420', c: 'bg-[#E3F2E8] text-[#1F7A4D]' },
      ].map((job) => (
        <div
          key={job.t}
          className="flex items-center justify-between gap-3 rounded-lg border border-[#E6ECF5] bg-white px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-2">
            <Wrench className="h-3.5 w-3.5 shrink-0 text-[#5B6B82]" />
            <span className="truncate text-sm text-[#0E1A2B]">{job.t}</span>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${job.c}`}>
            {job.s}
          </span>
        </div>
      ))}
    </div>
  );
}
