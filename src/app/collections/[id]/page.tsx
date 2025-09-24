import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CollectionDetail({ params }: { params: { id: string } }) {
  const collection = await prisma.collection.findUnique({ where: { id: params.id } })
  if (!collection) return notFound()
  const items = await prisma.savedPost.findMany({ where: { collectionId: collection.id }, orderBy: { createdAt: 'desc' } })
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">{collection.name}</h2>
      <ul className="space-y-2">
        {items.map((p) => (
          <li key={p.id} className="rounded border p-3">
            <div className="text-sm text-gray-500">r/{p.subreddit} • by {p.author}</div>
            <a className="block font-medium hover:underline" href={p.url} target="_blank" rel="noreferrer">{p.title}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
