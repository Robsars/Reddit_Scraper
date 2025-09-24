import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { searchReddit } from '@/lib/reddit'

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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = SearchBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }
  const p = parsed.data
  const session = await auth()
  const userId = (session?.user as any)?.id as string | undefined
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const result = await searchReddit(userId, {
      subreddits: p.subreddits,
      query: p.query,
      sort: p.sort,
      time: p.time,
    })
    return NextResponse.json({ items: result.items, nextPageToken: result.nextPageToken, cached: result.cached })
  } catch (e: any) {
    const status = e.status || 500
    const resp: any = { error: e.message || 'Search failed' }
    if (e.retryAfter) resp.retryAfter = e.retryAfter
    return NextResponse.json(resp, { status })
  }
}
