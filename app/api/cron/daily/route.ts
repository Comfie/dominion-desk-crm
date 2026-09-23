import { NextRequest, NextResponse } from 'next/server';

import { POST as sendMaintenanceFollowUps } from '@/app/api/maintenance/send-follow-ups/route';
import { POST as processScheduledMessages } from '@/app/api/messaging/scheduled/process/route';
import { POST as generateMonthlyPayments } from '@/app/api/payments/generate-monthly/route';
import { POST as markOverduePayments } from '@/app/api/payments/mark-overdue/route';
import { POST as sendOverdueReminders } from '@/app/api/payments/send-overdue-reminders/route';
import { POST as sendPaymentReminders } from '@/app/api/payments/send-reminders/route';
import { logger } from '@/lib/shared/logger';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** Day of month (SAST) from which next month's rent invoices are generated. */
const GENERATE_FROM_DAY = 25;

type Job = {
  name: string;
  run: (request: NextRequest) => Promise<Response>;
  when?: (now: Date) => boolean;
};

// Order matters: create invoices, flag overdue, then send messages.
const JOBS: Job[] = [
  {
    name: 'generate-monthly-payments',
    run: generateMonthlyPayments,
    // Idempotent (duplicates are prevented per lease), so running daily from the
    // 25th means a missed run is caught the next day.
    when: (now) => sastDay(now) >= GENERATE_FROM_DAY,
  },
  { name: 'mark-overdue-payments', run: markOverduePayments },
  { name: 'send-payment-reminders', run: sendPaymentReminders },
  { name: 'send-overdue-reminders', run: sendOverdueReminders },
  { name: 'maintenance-follow-ups', run: (req) => sendMaintenanceFollowUps(req) },
  { name: 'process-scheduled-messages', run: (req) => processScheduledMessages(req) },
];

function sastDay(now: Date) {
  return Number(
    new Intl.DateTimeFormat('en-ZA', { day: 'numeric', timeZone: 'Africa/Johannesburg' }).format(
      now
    )
  );
}

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return !!secret && request.headers.get('authorization') === `Bearer ${secret}`;
}

/**
 * Daily cron dispatcher
 *
 * One endpoint that runs every daily job in sequence, so the whole schedule
 * fits in ONE Vercel Hobby cron (Hobby allows daily crons only).
 *
 * - Vercel Cron calls with GET and sends `Authorization: Bearer $CRON_SECRET`
 *   automatically when the CRON_SECRET env var is set.
 * - GitHub Actions / cron-job.org / curl can call with GET or POST and the same header.
 * - `?only=job-name` runs a single job (handy for testing).
 *
 * Each job keeps its own CRON_SECRET check; we forward the same header.
 * One failing job never stops the others.
 */
async function handle(request: NextRequest) {
  if (!authorized(request)) {
    logger.warn('Unauthorized cron dispatcher call');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const only = request.nextUrl.searchParams.get('only');
  const results: Array<{ job: string; status: 'ok' | 'skipped' | 'failed'; detail?: unknown }> = [];

  for (const job of JOBS) {
    if (only && job.name !== only) continue;
    if (!only && job.when && !job.when(now)) {
      results.push({ job: job.name, status: 'skipped' });
      continue;
    }

    const started = Date.now();
    try {
      const jobRequest = new NextRequest(new URL(request.url), {
        method: 'POST',
        headers: { authorization: request.headers.get('authorization') ?? '' },
      });
      const response = await job.run(jobRequest);
      const body = await response.json().catch(() => null);
      results.push({
        job: job.name,
        status: response.ok ? 'ok' : 'failed',
        detail: { httpStatus: response.status, ms: Date.now() - started, body },
      });
    } catch (error) {
      logger.error('Cron job crashed', { job: job.name, error });
      results.push({
        job: job.name,
        status: 'failed',
        detail: error instanceof Error ? error.message : 'unknown error',
      });
    }
  }

  const failed = results.filter((r) => r.status === 'failed').length;
  logger.info('Daily cron dispatcher finished', { failed, jobs: results.length });

  return NextResponse.json(
    { success: failed === 0, ranAt: now.toISOString(), results },
    { status: failed === 0 ? 200 : 207 }
  );
}

export const GET = handle;
export const POST = handle;
