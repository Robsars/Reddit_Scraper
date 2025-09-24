import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const PostSummary = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  subreddit: z.string(),
  url: z.string().url(),
  score: z.number(),
  createdUtc: z.number(),
  numComments: z.number(),
  nsfw: z.boolean(),
  flair: z.string().optional(),
})

const SaveBody = z.object({
  action: z.literal('save'),
  post: PostSummary,
  collectionId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

const UnsaveBody = z.object({
  action: z.literal('unsave'),
  savedId: z.string(),
})

const CreateCollection = z.object({
  action: z.literal('createCollection'),
  name: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const save = SaveBody.safeParse(body)
  if (save.success) {
    const { post, collectionId } = save.data
    const collection = collectionId ? await prisma.collection.findUnique({ where: { id: collectionId } }) : await prisma.collection.findFirst()
    const col = collection ?? await prisma.collection.create({ data: { name: 'Default' } })
    const created = await prisma.savedPost.create({ data: {
      collectionId: col.id,
      externalId: post.id,
      title: post.title,
      subreddit: post.subreddit,
      author: post.author,
      url: post.url,
      score: post.score,
      createdUtc: post.createdUtc,
      nsfw: post.nsfw,
    }})
    return NextResponse.json(created)
  }
  const unsave = UnsaveBody.safeParse(body)
  if (unsave.success) {
    await prisma.savedPost.delete({ where: { id: unsave.data.savedId } })
    return NextResponse.json({ ok: true })
  }
  const create = CreateCollection.safeParse(body)
  if (create.success) {
    const c = await prisma.collection.create({ data: { name: create.data.name } })
    return NextResponse.json(c)
  }
  return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
}

