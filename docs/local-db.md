# Local Database (PostgreSQL with Docker)

## Prerequisite
Install Docker Desktop (with WSL integration if you use WSL).

## Start database
```bash
pnpm db:up
```

## Check status
```bash
pnpm db:ps
```

## Tail logs
```bash
pnpm db:logs
```

## Run Prisma steps
```bash
pnpm prisma:generate
pnpm prisma:migrate:dev -- --name init
```

## Stop database
```bash
pnpm db:down
```
