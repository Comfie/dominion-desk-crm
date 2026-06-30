import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  KeyRound,
  LayoutDashboard,
  MessageSquareText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type {
  AudiencePath,
  FaqItem,
  FeatureSuite,
  LifecycleStage,
  PricingPlan,
  ProductHero,
} from './product-page-content';

const laneData = [
  {
    title: 'Placement',
    icon: ClipboardCheck,
    rows: ['Mandate active', 'Viewing scheduled', 'Screening passed'],
  },
  {
    title: 'Management',
    icon: LayoutDashboard,
    rows: ['Rent due', 'Maintenance open', 'Report exported'],
  },
  {
    title: 'Tenant Portal',
    icon: KeyRound,
    rows: ['Invoice viewed', 'POP uploaded', 'Issue logged'],
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

export function HeroProductSurface({ hero }: { hero: ProductHero }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-3 shadow-2xl shadow-slate-950/30 backdrop-blur md:p-4">
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-sky-200 uppercase">
            DominionDesk workspace
          </p>
          <p className="mt-1 text-sm text-slate-300">{hero.eyebrow}</p>
        </div>
        <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
          Live workflow
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {laneData.map((lane) => {
          const Icon = lane.icon;

          return (
            <div key={lane.title} className="rounded-md border border-white/10 bg-slate-950/55 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Icon className="h-4 w-4 text-sky-300" />
                <h3 className="text-sm font-semibold text-white">{lane.title}</h3>
              </div>
              <div className="space-y-2">
                {lane.rows.map((row) => (
                  <div
                    key={row}
                    className="flex items-center justify-between rounded-md bg-white/[0.06] px-3 py-2 text-sm text-slate-200"
                  >
                    <span>{row}</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
            className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-100"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-sky-50 text-sky-700">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-semibold text-slate-950">{path.title}</h3>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{path.promise}</p>
            <ul className="mt-5 space-y-2 text-sm text-slate-700">
              {path.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
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
    <ol className="grid gap-3 lg:grid-cols-9">
      {stages.map((stage, index) => (
        <li
          key={stage.label}
          className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
              {index + 1}
            </span>
            <h3 className="text-sm font-semibold text-slate-950">{stage.label}</h3>
          </div>
          <p className="text-xs leading-5 text-slate-600">{stage.description}</p>
        </li>
      ))}
    </ol>
  );
}

export function FeatureSuiteSection({ suite }: { suite: FeatureSuite }) {
  const Icon = suiteIcons[suite.id];

  return (
    <section id={suite.id} className="scroll-mt-24 border-t border-slate-200 py-16">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-slate-950 text-white">
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold tracking-[0.24em] text-sky-700 uppercase">
            {suite.label}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{suite.title}</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">{suite.summary}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {suite.features.map((feature) => (
            <div
              key={feature}
              className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingSection({ plans }: { plans: PricingPlan[] }) {
  return (
    <section id="pricing" className="scroll-mt-24 bg-slate-950 py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-bold tracking-[0.24em] text-sky-300 uppercase">Pricing</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">Start free. Scale by workflow.</h2>
        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-lg border border-white/10 bg-white/[0.06] p-6">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-3 text-3xl font-bold">{plan.price}</p>
              <p className="mt-3 min-h-16 text-sm leading-6 text-slate-300">{plan.description}</p>
              <Link
                href={plan.cta.href}
                className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-md bg-white text-sm font-semibold text-slate-950 transition hover:bg-sky-100"
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
    <section id="faq" className="scroll-mt-24 bg-white py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-bold tracking-[0.24em] text-sky-700 uppercase">FAQ</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Common questions</h2>
        <div className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200">
          {items.map((item) => (
            <details key={item.question} className="group p-5" open>
              <summary className="cursor-pointer list-none text-base font-semibold text-slate-950">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
