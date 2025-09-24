# Reddit Explorer (GUI)

A web-only Next.js app to authenticate with Reddit and browse/search subreddits, then save posts into user collections.

## Requirements

- Node.js 20.x (this repo bootstraps a local copy under `.tools/` automatically)
- PNPM 9.x (preferred) or NPM 10.x — this project falls back to NPM if PNPM is unavailable

## Setup

1) Install deps

```
npm install
```

2) Env vars

```
cp .env.example .env
# For local dev/testing, SQLite is used:
# DATABASE_URL="file:./dev.db"
```

3) Prisma client and DB

```
npm run prisma:generate
npm run prisma:migrate
```

## Dev

```
npm run dev
# http://localhost:3000
```

You can log in using the test credentials provider (Auth.js), or configure Reddit OAuth:

- REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_REDIRECT_URI in `.env`

## Build & Start (prod)

```
npm run build
npm run start
```

## Verification (CI gates)

```
npm run typecheck
npm run lint
npm run test
npm run e2e   # requires Playwright browsers + system deps
```

Note: E2E requires Playwright browsers installed:

```
npx playwright install chromium
# On minimal Linux images also install system deps (if permitted):
# sudo npx playwright install-deps
```

## Notes

- All Reddit API calls are server-side only. For v1, `/api/reddit/search` returns mocked data with a 60–120s TTL cache. Replace `mockFetch` with real Reddit client when credentials are available.
- SQLite is used for local development. The Prisma schema is compatible with PostgreSQL for deployment; switch datasource provider + `DATABASE_URL` for Postgres.

