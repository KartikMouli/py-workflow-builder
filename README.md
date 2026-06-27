# Py — Galaxy.ai Workflow Builder Clone

**Live demo:** <https://py-workflow-builder-gamma.vercel.app/>
**Demo video:** <https://drive.google.com/drive/folders/1qPNfQ6TIeJqXHyPkmGpAa83xwMdun1mu?usp=sharing>

A pixel-faithful clone of the Galaxy.ai (Magica) LLM workflow builder. Build node-based
workflows on a React Flow canvas, execute every node on Trigger.dev, and watch live progress
with a pulsating glow driven by Trigger.dev Realtime.

Three pages only: Clerk sign-in/up, a Dashboard of the user's workflows, and the Workflow
Canvas (sidebar + canvas + execution-history panel). Unauthenticated traffic is redirected
straight to Clerk.

## Stack

Next.js 16 (App Router, TS strict) · PostgreSQL (Neon) + Prisma · Clerk · React Flow
(`@xyflow/react`) · Trigger.dev v4 · Transloadit · FFmpeg (inside the Trigger.dev task) ·
Tailwind v4 · Zustand · Zod · `@google/generative-ai` · Lucide React. Deployed on Vercel.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values (see below)
pnpm prisma migrate deploy   # apply migrations to your database
pnpm dev                     # Next.js dev server
npx trigger.dev@latest dev   # in a second terminal — runs node executions locally
```

Open <http://localhost:3000>.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` / `DIRECT_URL` | Neon Postgres (pooled / direct for migrations) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk auth |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `…SIGN_UP_URL` / `…FALLBACK_REDIRECT_URL` | Clerk routing |
| `TRIGGER_PROJECT_ID`, `TRIGGER_SECRET_KEY` | Trigger.dev project + task auth |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini (Google AI Studio) |
| `TRANSLOADIT_KEY`, `TRANSLOADIT_SECRET`, `TRANSLOADIT_TEMPLATE_ID` | image uploads (signature auth) |
| `NEXT_PUBLIC_CANDIDATE_LINKEDIN_URL` | logged once per page as `[Py] Candidate LinkedIn: <url>` |

## Architecture notes

**Execution = one Trigger.dev orchestrator task.** All node execution happens inside a single
`run-workflow` Trigger.dev task ([`src/trigger/run-workflow.ts`](src/trigger/run-workflow.ts)),
which schedules nodes through memoized per-node promises and native `Promise.all`. This is a
deliberate choice: it guarantees true parallel fan-out — a node starts the instant *its* direct
parents resolve and never blocks on unrelated siblings — and lets the live glow stream through a
single run's `metadata`/`useRealtimeRun` channel. Spawning a separate child task per node and
awaiting them would checkpoint the parent and serialize the parallel branches, defeating the #1
requirement. Request-Inputs and Response are local-only (value resolution / result capture); only
Gemini and Crop Image perform real work.

**Crop Image** runs FFmpeg inside the task (Transloadit handles only the original upload) and
**awaits ≥30s** (`CROP_MIN_WAIT_MS`) before returning, per the spec's mandatory delay.

**Selective execution.** A node's Run button runs just that node (`SINGLE`); selecting 2+ nodes
shows a "Run N selected nodes" bar (`PARTIAL`); the top bar runs the whole graph (`FULL`). Single
and partial runs execute only the targeted nodes — a node depends only on parents that are
themselves in the run set, so unselected upstream nodes are never re-run. Every run is persisted
as a `Run` + per-node `NodeRun` rows (status, inputs used, output, duration, error).

**Gemini model label.** The provided Google AI key only authorizes one Gemini model
(`gemini-3-flash-preview`). To match the reference UI the node header presents a model selector
defaulting to **Gemini 3.1 Pro**; every option resolves to the authorized model at execution.

## Required sample workflow

A "Trial Task Workflow" matching the spec's marketing-post pipeline is pre-built in
[`src/lib/templates.ts`](src/lib/templates.ts) and seeded via the dashboard's System Workflows
card: Request-Inputs → two parallel crops + a 3-stage Gemini chain → Response, with the final
Gemini receiving both crops on its Image (Vision) handle.

## Deploy

Live at <https://py-workflow-builder-gamma.vercel.app/>, deployed on Vercel. Set every
environment variable above in the Vercel project, run `pnpm prisma migrate deploy` against the
production database, and `npx trigger.dev@latest deploy` to ship the task to the Trigger.dev
production environment. Note that the task's own env vars (`DATABASE_URL`,
`GOOGLE_GENERATIVE_AI_API_KEY`) are set in the Trigger.dev dashboard, not Vercel.
