import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({ orderBy: { createdAt: 'desc' } })
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Collections</h2>
      <form action={async (formData: FormData) => {
        'use server'
        const name = (formData.get('name') as string | null)?.trim()
        if (!name) return
        await prisma.collection.create({ data: { name } })
      }} className="flex gap-2">
        <input name="name" placeholder="New collection name" className="w-80 rounded border px-3 py-2" />
        <button className="rounded bg-blue-600 px-3 py-2 text-white">Create</button>
      </form>
      <ul className="space-y-2">
        {collections.map((c) => (
          <li key={c.id} className="rounded border p-3">
            <Link className="font-medium hover:underline" href={`/collections/${c.id}`}>{c.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
