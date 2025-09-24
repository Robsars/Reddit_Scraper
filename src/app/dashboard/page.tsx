"use client"
import { useState } from 'react'

type PostSummary = {
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

export default function DashboardPage() {
  const [subreddits, setSubreddits] = useState('javascript')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<PostSummary[]>([])
  const [error, setError] = useState<string | null>(null)

  async function search() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/reddit/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subreddits: subreddits.split(',').map(s => s.trim()).filter(Boolean), query }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setItems(data.items)
    } catch (e: any) {
      setError(e.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="block">
          <span className="block text-sm">Subreddits (comma-separated)</span>
          <input className="mt-1 w-80 rounded border px-3 py-2" value={subreddits} onChange={e => setSubreddits(e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm">Keywords</span>
          <input className="mt-1 w-80 rounded border px-3 py-2" value={query} onChange={e => setQuery(e.target.value)} />
        </label>
        <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={search} disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
      {error && <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-red-800">{error}</div>}
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map(item => (
          <li key={item.id} className="rounded border p-3">
            <div className="text-sm text-gray-500">r/{item.subreddit} • by {item.author}</div>
            <a className="block font-medium hover:underline" href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
            <div className="text-sm text-gray-500">Score {item.score} • Comments {item.numComments}</div>
            <form method="post" action="/api/saved" onSubmit={(e)=>{e.preventDefault(); fetch('/api/saved',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action: 'save', post: item })}).then(()=>alert('Saved'));}}>
              <button className="mt-2 rounded border px-3 py-1">Save</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  )
}

