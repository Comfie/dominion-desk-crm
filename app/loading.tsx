import Image from 'next/image';

import { Loading } from '@/components/shared/loading';

export default function GlobalLoading() {
  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_72%)]"
        aria-hidden="true"
      />

      <div className="shell-surface-strong relative z-10 flex w-full max-w-md flex-col items-center gap-6 rounded-[2rem] border px-8 py-10 text-center">
        <Image src="/logos/logo-light.svg" alt="Dominion Desk" width={210} height={42} priority />

        <Loading
          size="lg"
          text="Loading workspace..."
          submessage="Preparing the latest portfolio, tenant, and operations data."
        />
      </div>
    </div>
  );
}
