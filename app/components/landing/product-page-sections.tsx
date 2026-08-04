import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  KeyRound,
  MessageSquareText,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import type {
  AudiencePath,
  FaqItem,
  FeatureSuite,
  LifecycleStage,
  PricingPlan,
  ProductCapability,
  ProductHero,
  QuickStartStep,
} from './product-page-content';

const laneData = [
  {
    title: 'Placement',
    icon: ClipboardCheck,
    stat: 'Tenant handoff ready',
    rows: ['Mandate active', 'Viewing scheduled', 'Screening passed'],
  },
  {
    title: 'Rent control',
    icon: ReceiptText,
    stat: 'R18,450 tracked',
    rows: ['Invoice issued', 'EFT proof uploaded', 'Owner report ready'],
  },
  {
    title: 'Maintenance',
    icon: Wrench,
    stat: '2 open items',
    rows: ['Portal request logged', 'Photo attached', 'Task assigned'],
  },
];

const audienceIcons = {
  'private-landlords': Building2,
  'property-companies': Users,
  'rental-agents': ClipboardCheck,
} as const;

const suiteIcons = {
  placement: ClipboardCheck,
  management: Building2,
  'tenant-portal': KeyRound,
  'financial-control': CircleDollarSign,
  operations: ShieldCheck,
  'bookings-inquiries': MessageSquareText,
  'south-african-trust': FileText,
} as const;

const suiteWorkflowRows: Record<FeatureSuite['id'], string[]> = {
  placement: ['Mandate active', 'Application in screening', 'Portal handoff ready'],
  management: ['Property record updated', 'Lease assignment visible', 'Maintenance queue open'],
  'tenant-portal': ['Invoice viewed', 'Proof of payment uploaded', 'Maintenance photo attached'],
  'financial-control': [
    'Rent collection reviewed',
    'Expense marked deductible',
    'CSV export ready',
  ],
  operations: ['Team access controlled', 'Message queued', 'Audit trail updated'],
  'bookings-inquiries': ['Inquiry captured', 'Booking conflict checked', 'Guest status updated'],
  'south-african-trust': [
    'ZAR ledger active',
    'EFT proof captured',
    'POPIA-aware access controlled',
  ],
};

export function HeroProductSurface({ hero }: { hero: ProductHero }) {
  return (
    <>
      <div className="rounded-[1.5rem] border border-[#D7E3F0] bg-[#08233F] p-4 text-white shadow-xl shadow-[#08233F]/15 md:hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[#93C5FD] uppercase">
              Rental cockpit
            </p>
            <p className="mt-1 text-sm text-slate-300">{hero.eyebrow}</p>
          </div>
          <span className="rounded-full bg-[#3B82F6]/20 px-3 py-1 text-xs font-semibold text-sky-100">
            Operational view
          </span>
        </div>
        <div className="space-y-2">
          {laneData.map((lane) => {
            const Icon = lane.icon;

            return (
              <div
                key={lane.title}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.07] px-3 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="h-4 w-4 text-[#93C5FD]" />
                  {lane.title}
                </span>
                <span className="text-right text-xs text-slate-300">{lane.stat}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative hidden overflow-hidden rounded-[2rem] border border-[#D7E3F0] bg-white p-3 shadow-2xl shadow-[#08233F]/15 md:block md:p-4">
        <div className="absolute top-8 right-8 h-28 w-28 rounded-full bg-[#3B82F6]/20 blur-3xl" />
        <div className="relative rounded-[1.55rem] border border-[#1C2634]/10 bg-[#08233F] p-4 text-white shadow-xl shadow-[#08233F]/20">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-[#93C5FD] uppercase">
                Rental cockpit
              </p>
              <p className="mt-1 text-sm text-slate-300">{hero.eyebrow}</p>
            </div>
            <span className="rounded-full bg-[#3B82F6]/20 px-3 py-1 text-xs font-semibold text-sky-100">
              Operational view
            </span>
          </div>

          <div data-testid="hero-cockpit-grid" className="grid gap-4 lg:grid-cols-3">
            {laneData.map((lane) => {
              const Icon = lane.icon;

              return (
                <div
                  key={lane.title}
                  className="min-w-0 rounded-[1.15rem] border border-white/10 bg-white/[0.055] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                        <Icon className="h-4 w-4 text-[#93C5FD]" />
                      </span>
                      <h3 className="text-sm font-semibold text-white">{lane.title}</h3>
                    </div>
                  </div>
                  <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                      Current status
                    </p>
                    <p className="mt-1 text-base leading-6 font-semibold text-white">{lane.stat}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-200">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{lane.rows[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 hidden gap-3 rounded-[1.15rem] border border-white/10 bg-white/[0.055] p-3 sm:grid sm:grid-cols-3">
            {[
              ['Next action', 'Confirm July rent'],
              ['Portal activity', '3 tenant updates'],
              ['Owner packet', 'Ready to export'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white/[0.06] px-3 py-2">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function GettingStartedSection({ steps }: { steps: QuickStartStep[] }) {
  return (
    <section id="start" className="scroll-mt-24 bg-[#F8FAFC] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold tracking-[0.24em] text-[#0A2D67] uppercase">
            Getting started
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[#101828] md:text-5xl">
            Your first live workflow is five minutes away.
          </h2>
          <p className="mt-4 text-base leading-7 text-[#526070]">
            Start with the work already in front of you. DominionDesk turns the first captured
            rental into a connected operating line for tenants, rent, maintenance, and reports.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.id}
              className="flex min-h-[25rem] flex-col justify-between rounded-[1.6rem] border border-[#D7E3F0] bg-white p-6 shadow-sm shadow-[#101828]/5"
            >
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-xs font-bold tracking-[0.2em] text-[#0A2D67] uppercase">
                    {step.kicker}
                  </p>
                  <span className="rounded-full bg-[#101828] px-3 py-1 text-xs font-semibold text-white">
                    {step.metric}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-[#101828]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#526070]">{step.description}</p>
              </div>

              <div className="mt-8 space-y-2 rounded-[1.15rem] bg-[#F8FAFC] p-3">
                {step.rows.map((row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between rounded-full bg-white px-3 py-2 text-sm font-medium text-[#253244]"
                  >
                    <span>{row}</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CapabilityGrid({ capabilities }: { capabilities: ProductCapability[] }) {
  return (
    <section id="capabilities" className="scroll-mt-24 bg-[#101828] py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-bold tracking-[0.24em] text-[#3B82F6] uppercase">
              Product map
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Everything in the rental operations stack.
            </h2>
          </div>
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#3B82F6] px-5 text-sm font-semibold text-[#101828] transition hover:bg-[#60A5FA]"
          >
            Start free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((capability) => (
            <article
              key={capability.title}
              data-testid="capability-card"
              className="rounded-[1.25rem] border border-white/10 bg-white/[0.055] p-5"
            >
              <div className="mb-6 flex items-center justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <Sparkles className="h-4 w-4 text-[#3B82F6]" />
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold tracking-[0.14em] text-slate-200 uppercase">
                  {capability.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white">{capability.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{capability.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AudiencePathGrid({ paths }: { paths: AudiencePath[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {paths.map((path) => {
        const Icon = audienceIcons[path.id];

        return (
          <a
            key={path.id}
            href={path.anchor}
            className="group rounded-[1.6rem] border border-[#D7E3F0] bg-white p-6 shadow-sm shadow-[#101828]/5 transition hover:-translate-y-1 hover:border-[#3B82F6] hover:shadow-xl hover:shadow-[#101828]/10"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8FAFC] text-[#0A2D67]">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-[#101828]">{path.title}</h3>
            <p className="mt-2 min-h-12 text-sm leading-6 text-[#526070]">{path.promise}</p>
            <ul className="mt-5 space-y-2 text-sm text-[#253244]">
              {path.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0A2D67]">
              {path.cta}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </a>
        );
      })}
    </div>
  );
}

export function LifecycleRail({ stages }: { stages: LifecycleStage[] }) {
  return (
    <ol data-testid="lifecycle-rail" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stages.map((stage, index) => (
        <li
          key={stage.label}
          className="relative overflow-hidden rounded-[1.35rem] border border-[#D7E3F0] bg-white p-5 shadow-sm shadow-[#101828]/5"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#101828] via-[#3B82F6] to-emerald-500" />
          <div className="flex gap-4">
            <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#101828] text-sm font-bold text-white">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <p className="text-[11px] font-bold tracking-[0.18em] text-[#0A2D67] uppercase">
                Stage {index + 1}
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#101828]">
                {stage.label}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#526070]">{stage.description}</p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function FeatureSuiteSection({ suite }: { suite: FeatureSuite }) {
  const Icon = suiteIcons[suite.id];
  const workflowRows = suiteWorkflowRows[suite.id];

  return (
    <section id={suite.id} className="scroll-mt-24 py-10">
      <div
        data-testid="feature-suite-shell"
        className="rounded-2xl border border-[#D7E3F0] bg-gradient-to-br from-white via-[#F1F6FB] to-[#F8FAFC] p-5 shadow-xl shadow-[#101828]/8 lg:p-8"
      >
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#101828] text-white shadow-lg shadow-[#101828]/15">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold tracking-[0.24em] text-[#0A2D67] uppercase">
                {suite.label}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#101828]">
                {suite.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-[#526070]">{suite.summary}</p>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-2 border-t border-[#D7E3F0] pt-5">
              <div>
                <p className="text-[11px] font-bold tracking-[0.18em] text-[#7B8794] uppercase">
                  Suite
                </p>
                <p className="mt-1 text-sm font-semibold text-[#101828]">{suite.label}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-[0.18em] text-[#7B8794] uppercase">
                  Coverage
                </p>
                <p className="mt-1 text-sm font-semibold text-[#101828]">
                  {suite.features.length} tools
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-[0.18em] text-[#7B8794] uppercase">
                  Status
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-700">Active workflow</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#D7E3F0] bg-white p-4 shadow-sm lg:p-5">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-[#0A2D67] uppercase">
                  Workflow panel
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[#101828]">Active workflow</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Connected
              </span>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {workflowRows.map((row, index) => (
                <div key={row} className="rounded-[1rem] border border-[#D7E3F0] bg-[#F8FAFC] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101828] text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-sm leading-5 font-semibold text-[#101828]">{row}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {suite.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-2 rounded-full border border-[#D7E3F0] bg-white px-3 py-2.5 text-sm text-[#253244]"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3B82F6]" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PricingSection({ plans }: { plans: PricingPlan[] }) {
  return (
    <section id="pricing" className="scroll-mt-24 bg-[#101828] py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-bold tracking-[0.24em] text-[#3B82F6] uppercase">Pricing</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight">
          Start free. Scale by workflow.
        </h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex h-full flex-col rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-6"
            >
              <div data-testid="pricing-plan-summary" className="h-[13.5rem]">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p
                  data-testid="pricing-plan-price"
                  className="mt-3 text-[2.45rem] leading-tight font-bold tracking-normal whitespace-nowrap"
                >
                  {plan.price}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">{plan.description}</p>
              </div>
              <Link
                href={plan.cta.href}
                className="inline-flex h-10 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-[#101828] transition hover:bg-[#F8FAFC]"
              >
                {plan.cta.label}
              </Link>
              <ul className="mt-6 space-y-2 text-sm text-slate-300">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ items }: { items: FaqItem[] }) {
  return (
    <section id="faq" className="scroll-mt-24 bg-[#F8FAFC] py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-bold tracking-[0.24em] text-[#0A2D67] uppercase">FAQ</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[#101828]">
          Common questions
        </h2>
        <div className="mt-8 divide-y divide-[#D7E3F0] rounded-[1.5rem] border border-[#D7E3F0] bg-white">
          {items.map((item) => (
            <details key={item.question} className="group p-5" open>
              <summary className="cursor-pointer list-none text-base font-semibold text-[#101828]">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-6 text-[#526070]">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
