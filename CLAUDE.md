# Property CRM

Next.js 16 (App Router) + Prisma 7 (Postgres) + Tailwind 4 + Radix/shadcn.

## Commands

- `npm run dev` — dev server
- `npm run test:run` — tests once (vitest); `npm test` is watch mode
- `npm run type-check` / `npm run lint` / `npm run format`
- `npm run build` — runs `prisma generate` then `next build`
- `npm run db:migrate` / `db:studio` / `db:seed`
- ⚠️ NEVER run `npm run db:reset` without explicit user approval — it
  deletes `prisma/migrations/` and force-resets the database.

## Architecture

`docs/ARCHITECTURE_GUIDE.md` is the source of truth — read it before
feature work. Key rules:

- Three-layer feature pattern: `lib/features/[feature]/{repositories,services,dtos,__tests__}`
- API routes (`app/api/**/route.ts`) handle HTTP only: auth, Zod DTO
  parsing, call service, audit log, `NextResponse`. No business logic.
- 40 Prisma models, 150+ API routes — follow existing patterns over
  clever local shortcuts.
- Route groups: `app/(dashboard)`, `app/(public)`, tenant portal `app/portal`.

## Docs

- `docs/TESTING_GUIDE.md` — testing patterns
- `docs/PROJECT_STATUS.md` — current state
- `docs/AUTOMATIONS.md` — cron/automation flows

## Workflow

- Working branch is `develop`; PRs target `main`.
- Conventional commits enforced by commitlint (husky `commit-msg` hook).
- ESLint + Prettier run via lint-staged on pre-commit (incl. Tailwind
  class sorting).
