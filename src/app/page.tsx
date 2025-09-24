import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <h1 className="text-3xl font-bold">Reddit Explorer</h1>
      <p className="text-gray-600 dark:text-gray-300">Sign in to search subreddits and save posts.</p>
      <div className="flex items-center gap-3">
        <Link className="rounded bg-blue-600 px-4 py-2 text-white" href="/api/auth/signin">Sign in</Link>
        <Link className="rounded border px-4 py-2" href="/dashboard">Go to Dashboard</Link>
      </div>
    </div>
  )
}

