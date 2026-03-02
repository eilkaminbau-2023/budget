import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"

// Custom tip tanımlamaları
declare module "next-auth" {
  interface User {
    rolle?: string
  }
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      rolle?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    rolle?: string
  }
}

// authOptions'ı ayrı bir değişkene al ve export et
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.email) {
          return { 
            id: "1", 
            name: "Admin", 
            email: credentials.email, 
            rolle: "ADMIN" 
          }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: '/auth/anmelden',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.rolle = user.rolle
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.rolle = token.rolle
      }
      return session
    }
  }
}

export default NextAuth(authOptions)