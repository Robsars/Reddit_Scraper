# AGENTS.md — Operational Guide for Coding Agent

## Project
**Name:** Reddit Explorer (GUI)  
**Goal:** A web-only GUI to authenticate with Reddit and browse/search subreddits, then save posts into user collections. No CLI features for end users.

---

## Setup Commands (run in project root)
- Install: `pnpm install`  (or `npm install` if PNPM unavailable)
- Dev server: `pnpm dev`  # runs on http://localhost:3000
- Build: `pnpm build`
- Start (prod): `pnpm start`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Unit tests: `pnpm test`
- E2E tests (headless): `pnpm e2e`
- DB migrations: `pnpm prisma:migrate`  # wrapper for `prisma migrate dev`

> The agent should **prefer PNPM**; fall back to NPM only if PNPM is missing.

### Required Versions
- Node.js **20.x**
- PNPM **9.x** (preferred) or NPM **10.x**
- Prisma CLI via local devDependency

### Environment Variables
Copy `.env.example` to `.env` and populate:
- `DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DB`
- `NEXTAUTH_SECRET=<random-long-string>`
- `REDDIT_CLIENT_ID=<from reddit app>`
- `REDDIT_CLIENT_SECRET=<from reddit app>`
- `REDDIT_REDIRECT_URI=http://localhost:3000/api/auth/callback/reddit`

Optional:
- `NEXTAUTH_URL=http://localhost:3000`
- `SENTRY_DSN=`
- `REDIS_URL=` (not required for v1)

---

## Approval & Safety
- **Approval mode:** `auto`
- Ask before: enabling network outside dev server, adding new services, or modifying anything under `/infra/`.
- Never commit secrets. Use `.env` only.

## Repository Layout Expectations
- Next.js 14 (App Router) in `/src/app`
- API Route Handlers under `/src/app/api/*`
- Prisma schema in `/prisma/schema.prisma`
- Shared libs in `/src/lib`
- UI in `/src/components` and feature-local components under `/src/app/**/components`

## Verification Steps (run after any change)
1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test`  # unit tests must pass
4. `pnpm e2e`   # smoke: Login → Search → Save → View Collection

Build must succeed without warnings that break CI.

## Coding Constraints
- All Reddit API calls must execute **server-side only** (Route Handlers). No secrets or tokens in client bundles.
- Respect Reddit API OAuth scopes: `identity`, `read`.
- Implement a minimal **60–120s cache** per search query to reduce calls; surface error and cooldown states if rate-limited.
- Accessibility: keyboard navigation, focus management, labels, and WCAG AA contrast.
- Use TypeScript everywhere; data contracts validated with Zod on request/response boundaries.

## Don’ts
- Do not add CLI features for end users.
- Do not use global installs or Docker in v1.
- Do not commit `.env` or generated assets to git.
- Do not call Reddit from the browser.

## CI Gates (must remain green)
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test` (unit)
- Optional: headless Playwright smoke in CI

## Quick Troubleshooting
- If OAuth fails locally: verify `REDDIT_REDIRECT_URI` matches Reddit app config exactly.
- If Prisma errors: run `pnpm prisma:generate` and `pnpm prisma:migrate`.
- If rate-limited: implement exponential backoff and show a non-blocking cooldown banner.