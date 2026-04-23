# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack booking/resource management system used as a workshop for AI-driven development. It is a TypeScript monorepo with two npm workspaces: `api/` (Hono + Prisma + SQLite) and `web/` (React + Vite + TailwindCSS).

## Commands

All commands are run from this directory (the monorepo root) unless noted otherwise.

```bash
npm install            # Install all workspace dependencies
npm run dev            # Start API (:3000) and web (:5173) concurrently
npm run dev:api        # API only
npm run dev:web        # Web only (requires API running)
npm run build          # Build all workspaces
npm run typecheck      # Type-check all workspaces
npm run generate       # Regenerate Prisma client + OpenAPI schema + Orval hooks
```

No test suite exists yet.

## Code Generation Pipeline

Whenever the API schema changes, the frontend client must be regenerated:

1. API route changes in `api/src/app.ts` trigger a new OpenAPI spec
2. `npm run generate` in root (or `api/`) exports `api/openapi.json`
3. `npm run generate` in `web/` runs Orval to regenerate `web/src/api/generated/hooks.ts`

Never hand-edit `web/src/api/generated/hooks.ts` — it is fully machine-generated.

## Architecture

### API (`api/`)

- Entry: `src/index.ts` → `src/app.ts`
- All routes use `OpenAPIHono` with `createRoute()` — request/response shapes are declared as Zod schemas co-located with the route definition in `app.ts`
- Database access through a Prisma singleton in `src/db.ts`
- SQLite file at `data/workshop.db` (auto-created on first run via `prisma db push`)
- OpenAPI spec exported by `scripts/export-openapi.ts`

### Frontend (`web/`)

- Entry: `src/main.tsx` → `src/App.tsx`
- Server state managed entirely via auto-generated React Query hooks (`useGetItems`, `usePostItems`, `useDeleteItemsId`, etc.)
- Axios client configured in `src/api/client.ts`; base URL is `/api` (proxied to `:3000` by Vite in dev)
- Orval config at `web/orval.config.ts`; input is `../api/openapi.json`

### Data Model

```prisma
model Item {
  id        Int      @id @default(autoincrement())
  title     String
  createdAt DateTime @default(now())
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | `3000` | Hono server port |
| `CORS_ORIGIN` | `http://localhost:4173,http://localhost:5173` | Allowed CORS origins (comma-separated) |
| `VITE_API_BASE_URL` | `/api` | Frontend API base path |
| `VITE_API_PROXY_TARGET` | `http://localhost:3000` | Dev proxy target |

## Key Constraints

- After adding or modifying any API route, always run `npm run generate` from the root before touching frontend code.
- Prisma schema changes require `npx prisma migrate dev --schema api/prisma/schema.prisma` (or `prisma db push` for quick sync during development).
- TypeScript strict mode is enabled in both workspaces — no implicit `any`.
