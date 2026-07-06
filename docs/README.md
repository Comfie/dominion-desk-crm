# Documentation

This folder contains the maintained project documentation. Older implementation notes, one-off prompts, and duplicate plans were consolidated so the useful information is easier to find.

## Maintained Docs

- [Project Status](PROJECT_STATUS.md) - What is built, what is partial, and what blocks beta launch.
- [Architecture Guide](ARCHITECTURE_GUIDE.md) - Code organization, service/repository patterns, auth, tenancy, and validation rules.
- [Operations Guide](OPERATIONS_GUIDE.md) - Automations, payments, billing, integrations, environment variables, and production caveats.
- [Testing Guide](TESTING_GUIDE.md) - UAT checklist plus focused scenarios for payments, multi-tenant leases, and launch readiness.
- [History](HISTORY.md) - Condensed index of archived implementation notes and planning documents.

## Quick Paths

For day-to-day development, start with [Architecture Guide](ARCHITECTURE_GUIDE.md).

For product or release planning, start with [Project Status](PROJECT_STATUS.md).

For QA, start with [Testing Guide](TESTING_GUIDE.md).

For deployment and environment setup, start with [Operations Guide](OPERATIONS_GUIDE.md).

## Documentation Rules

- Add durable guidance to one of the maintained docs above.
- Do not add session summaries, "final fix" notes, or prompt dumps as new top-level docs.
- If historical detail is still useful, summarize it in [History](HISTORY.md) instead of keeping another markdown file.
- Keep status claims tied to the current repository whenever possible.

Last updated: 2026-07-06
