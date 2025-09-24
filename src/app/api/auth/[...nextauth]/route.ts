import NextAuth from "next-auth"
import Reddit from "next-auth/providers/reddit"
import Credentials from "next-auth/providers/credentials"

export const { handlers: { GET, POST } } = NextAuth({
  providers: [
    Reddit({
      clientId: process.env.REDDIT_CLIENT_ID || "",
      clientSecret: process.env.REDDIT_CLIENT_SECRET || "",
    }),
    Credentials({
      name: 'Test Login',
      credentials: { email: { label: 'Email', type: 'text' } },
      async authorize(creds) {
        const email = (creds?.email || '').toString().trim()
        if (!email) return null
        return { id: email, email }
      }
    })
  ],
  session: { strategy: 'jwt' },
  debug: false,
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret',
})
