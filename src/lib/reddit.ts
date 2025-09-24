import { prisma } from '@/lib/prisma'

type TokenRecord = {
  access_token: string
  refresh_token?: string | null
  expires_at?: number | null // seconds since epoch
}

const USER_AGENT = process.env.REDDIT_USER_AGENT || 'RedditExplorer/1.0 (by u/yourusername)'

async function refreshRedditToken(refreshToken: string): Promise<{ access_token: string; expires_in: number; refresh_token?: string } | null> {
  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  })
  if (!res.ok) return null
  const json = await res.json()
  return json
}

export async function getUserRedditToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({ where: { userId, provider: 'reddit' } }) as (TokenRecord & { id: string }) | null
  if (!account) return null
  const nowSec = Math.floor(Date.now() / 1000)
  if (account.expires_at && account.expires_at > nowSec + 30 && account.access_token) {
    return account.access_token
  }
  if (account.refresh_token) {
    const refreshed = await refreshRedditToken(account.refresh_token)
    if (refreshed?.access_token) {
      const newExpires = Math.floor(Date.now() / 1000) + (refreshed.expires_in || 3600)
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token ?? account.refresh_token,
          expires_at: newExpires,
        },
      })
      return refreshed.access_token
    }
  }
  return account.access_token || null
}

export type SearchParams = {
  subreddits: string[]
  query?: string
  sort?: 'hot' | 'new' | 'top'
  time?: 'day' | 'week' | 'month' | 'year' | 'all'
  after?: string
}

export type PostSummary = {
  id: string
  title: string
  author: string
  subreddit: string
  url: string
  score: number
  createdUtc: number
  numComments: number
  nsfw: boolean
  flair?: string
}

type CacheEntry = { expiresAt: number, data: { items: PostSummary[], nextPageToken?: string } }
const cache = new Map<string, CacheEntry>()
const TTL_MS = 90_000

function cacheKey(p: SearchParams) {
  return JSON.stringify([p.subreddits.slice().sort(), p.query || '', p.sort || 'hot', p.time || 'day', p.after || ''])
}

export async function searchReddit(userId: string, p: SearchParams): Promise<{ items: PostSummary[], nextPageToken?: string, cached: boolean }> {
  const key = cacheKey(p)
  const hit = cache.get(key)
  if (hit && hit.expiresAt > Date.now()) {
    return { ...hit.data, cached: true }
  }
  const accessToken = await getUserRedditToken(userId)
  if (!accessToken) throw Object.assign(new Error('Not connected to Reddit'), { status: 401 })

  const multi = p.subreddits.join('+')
  const params = new URLSearchParams()
  if (p.query) params.set('q', p.query)
  params.set('sort', p.sort || 'hot')
  if (p.sort === 'top' && p.time) params.set('t', p.time)
  params.set('restrict_sr', 'true')
  params.set('limit', '25')
  if (p.after) params.set('after', p.after)

  const url = `https://oauth.reddit.com/r/${encodeURIComponent(multi)}/search?${params.toString()}`
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': USER_AGENT,
    },
  })

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('retry-after') || '60', 10)
    const err: any = new Error('Rate limited')
    err.status = 429
    err.retryAfter = retryAfter
    throw err
  }
  if (!res.ok) {
    const text = await res.text()
    const err: any = new Error(`Reddit error: ${res.status} ${text}`)
    err.status = res.status
    throw err
  }
  const json = await res.json()
  const items: PostSummary[] = (json.data?.children || []).map((c: any) => {
    const d = c.data
    return {
      id: d.name,
      title: d.title,
      author: d.author,
      subreddit: d.subreddit,
      url: `https://reddit.com${d.permalink}`,
      score: d.score,
      createdUtc: d.created_utc,
      numComments: d.num_comments,
      nsfw: !!d.over_18,
      flair: d.link_flair_text || undefined,
    }
  })
  const nextPageToken = json.data?.after || undefined
  const data = { items, nextPageToken }
  cache.set(key, { expiresAt: Date.now() + TTL_MS, data })
  return { ...data, cached: false }
}

