# SPEC.md — Product & Technical Specification (v1)

## 1. Product Summary & v1 Scope
**Purpose:** A GUI-only web app that lets a signed-in user connect Reddit, browse/search subreddits, and save posts into personal collections with tags/notes.  
**Non-goals (v1):** Background crawling, comment analysis at scale, multi-user teams/roles, mobile app binaries.  
**Acceptance (v1):** A user can (a) sign in with Reddit OAuth, (b) search/browse posts for chosen subreddits/keywords, (c) open a post detail drawer, (d) save/unsave to a collection with tags/notes, and (e) view/edit their collections. E2E smoke must pass.

## 2. Tech Stack & Standards
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui components.
- **Backend:** Next.js Route Handlers (Node 20), server-only Reddit calls.
- **Data:** PostgreSQL + Prisma ORM; migrations under `/prisma`.
- **Auth:** Auth.js (NextAuth) with Reddit provider (scopes: `identity`, `read`).
- **Validation:** Zod schemas for API inputs/outputs.
- **Caching:** Simple in-memory LRU per process for search responses (TTL 60–120s).
- **Observability:** Sentry (optional), server request logging.
- **Testing:** Vitest (unit), Playwright (e2e smoke).

## 3. Architecture
### Pages (App Router)
- `/` — Landing with CTA “Sign in with Reddit” (or redirect to `/dashboard` if authed).
- `/dashboard` — Subreddit/keyword search UI and results grid.
- `/collections` — List of user collections.
- `/collections/[id]` — Collection detail (edit tags/notes, remove items).
- `/settings` — Connect/Disconnect Reddit, NSFW toggle, defaults.

### API Routes
- `POST /api/reddit/search`  
  - **Body:** `{ subreddits: string[], query?: string, sort?: "hot"|"new"|"top", time?: "day"|"week"|"month"|"year"|"all", page?: number }`  
  - **Return:** `{ items: PostSummary[], nextPage?: number, cached: boolean }`  
  - **Notes:** Server-only; applies TTL cache; respects rate limits; no secrets leaked.
- `GET /api/reddit/post?id=<full_name>` (optional v1)  
  - Detailed metadata for a single post.
- `POST /api/saved`  
  - Save/unsave and collection CRUD.  
  - **Bodies:**  
    - Save: `{ post: PostSummary, collectionId?: string, tags?: string[], notes?: string }`  
    - Unsave: `{ savedId: string }`  
    - Create collection: `{ name: string }`
  - **Returns:** updated entities.

### Data Contracts (Zod types, conceptual)
- `PostSummary` → `{ id: string, title: string, author: string, subreddit: string, url: string, score: number, createdUtc: number, numComments: number, nsfw: boolean, flair?: string }`

### State & Caching
- Server actions/routes fetch Reddit, cache per `(subreddits, query, sort, time, page)` key for 60–120s.  
- Client components hydrate with returned JSON only; no direct Reddit calls client-side.

## 4. UI/UX
- **Search panel:** Multi-subreddit input, keyword field, sort/time selectors, NSFW toggle, search button.  
- **Results grid:** Cards with title, subreddit, score, age, badges; “Open” (drawer), “Save” (choose collection, add tags/notes).  
- **Post drawer:** Metadata, preview (no heavy embeds in v1), link-out to Reddit.  
- **Collections pages:** Table/list with filters by tag/subreddit; inline edit of tags/notes.  
- **A11y:** Keyboard navigable, focus rings, ARIA labels, form labels, color contrast AA.

## 5. Data Model (Prisma, conceptual)
- `User { id, email, createdAt }` (managed via Auth.js)
- `Account { userId, provider, access_token, refresh_token?, expires_at }` (Reddit)
- `Collection { id, userId, name, createdAt }`
- `SavedPost { id, userId, collectionId, externalId, title, subreddit, author, url, score, createdUtc, nsfw, createdAt }`
- `Tag { id, userId, name }`
- `SavedPostTag { savedPostId, tagId }`

Indices: `(userId, createdAt)` on SavedPost; unique `(userId, name)` on Collection and Tag.

## 6. External Integration — Reddit
- **OAuth2 scopes:** `identity`, `read`.
- **Token handling:** Store encrypted access/refresh tokens in `Account`; refresh when expired.  
- **Rate limits:** Respect platform headers/backoff; display cooldown banner on 429.  
- **User Agent:** Identify the app per Reddit policy.

## 7. Security & Privacy
- Secrets only in server environment.  
- No tokens in client; sanitize outbound JSON.  
- Log minimal PII (user id only).  
- CSRF protection via Auth.js; input validation with Zod.

## 8. Testing Plan
- **Unit:** lib functions (query building, caching key), Zod schemas, route handlers with mocked Reddit client.  
- **E2E (Playwright):** Login → Dashboard search (returns results) → Open drawer → Save to new collection → View collection.  
- **Acceptance:** All above green in CI; v1 flows stable.

## 9. Deployment
- **Target:** Vercel  
- **Build:** `pnpm build`  
- **Env vars:** as listed in AGENTS.md  
- **Health:** Next.js default health; basic status page `/api/health` returning `{ ok: true }`.

## 10. Task List for the Agent
- [ ] Scaffold Next.js + TS + Tailwind + shadcn/ui
- [ ] Configure Auth.js (Reddit provider) + session
- [ ] Prisma schema, migrations, and DB client
- [ ] Reddit client (server-only) with OAuth token refresh
- [ ] `/dashboard` search UI + `/api/reddit/search` with TTL cache
- [ ] Save/unsave flows + collections pages + `/api/saved`
- [ ] Basic unit + e2e smoke tests
- [ ] CI configuration and deployment to Vercel