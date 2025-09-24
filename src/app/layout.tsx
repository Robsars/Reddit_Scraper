import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'Reddit Explorer',
  description: 'Browse and save Reddit posts',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <main className="mx-auto max-w-5xl p-4">{children}</main>
      </body>
    </html>
  )
}

