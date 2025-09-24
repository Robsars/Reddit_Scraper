import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const SearchBody = z.object({
  subreddits: z.array(z.string().min(1)).min(1),
  query: z.string().optional(),
  sort: z.enum(["hot","new","top"]).optional().default('hot'),
  time: z.enum(["day","week","month","year","all"]).optional().default('day'),
  page: z.number().int().min(0).optional().default(0),
})

type PostSummary = {
  id: string, title: string, author: string, subreddit: string, url: string,
  score: number, createdUtc: number, numComments: number, nsfw: boolean, flair?: string
}

type CacheEntry = { expiresAt: number, data: { items: PostSummary[], nextPage?: number } }
const cache = new Map<string, CacheEntry>()
const TTL_MS = 90_000

function keyOf(p: z.infer<typeof SearchBody>) {
  return JSON.stringify([p.subreddits.sort(), p.query || '', p.sort, p.time, p.page])
}

function mockFetch(p: z.infer<typeof SearchBody>): { items: PostSummary[], nextPage?: number } {
  const now = Math.floor(Date.now()/1000)
  const items: PostSummary[] = Array.from({ length: 10 }).map((_, i) => ({
    id: `${p.subreddits[0]}_${p.page}_${i}`,
    title: `[Mock] ${p.query || 'Post'} #${i+1} in r/${p.subreddits[0]}`,
    author: 'mock_user',
    subreddit: p.subreddits[0],
    url: `https://reddit.com/r/${p.subreddits[0]}/comments/mock_${i}`,
    score: 100 - i,
    createdUtc: now - i * 3600,
    numComments: i * 3,
    nsfw: false,
    flair: i % 3 === 0 ? 'Discussion' : undefined,
  }))
  return { items, nextPage: p.page + 1 }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = SearchBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }
  const p = parsed.data
  const key = keyOf(p)
  const hit = cache.get(key)
  if (hit && hit.expiresAt > Date.now()) {
    return NextResponse.json({ ...hit.data, cached: true })
  }
  const data = mockFetch(p)
  cache.set(key, { expiresAt: Date.now() + TTL_MS, data })
  return NextResponse.json({ ...data, cached: false })
}

