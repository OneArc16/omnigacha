# Phase 18 - MVP Smoke Tests

This phase validates the end-to-end MVP flow requested in the project context.

## Covered flow
1. Register user
2. Login
3. Register user characters
4. Edit character stats
5. Analyze character recommendation
6. View recommendation detail
7. Simulate damage scenario
8. Consult recommendations and simulation history
9. Check dashboard summary counters
10. Logout

## Test suite
- `apps/api/test/mvp-flow.e2e-spec.ts`

The suite uses the real Nest application (`AppModule`) and database via Prisma.
It creates isolated fixture data using unique names/emails, then cleans up after the run.

## How to run
```bash
pnpm db:up
pnpm prisma:generate
pnpm test:e2e
```

To run only this suite:
```bash
pnpm --filter api test:e2e -- mvp-flow.e2e-spec.ts
```
