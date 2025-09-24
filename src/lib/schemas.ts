import { z } from 'zod'

export const PostSummary = z.object({
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

export type PostSummary = z.infer<typeof PostSummary>

