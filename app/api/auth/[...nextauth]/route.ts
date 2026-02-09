import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { getDatabase } from "@/lib/mongodb"
import jwt from "jsonwebtoken"

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const db = await getDatabase()
          const users = db.collection('users')
          
          // Check if user email is invited/whitelisted
          const invitedUser = await users.findOne({ email: user.email })
          
          if (!invitedUser) {
            // REJECT: Email not in system
            console.log(`Access denied for ${user.email} - not invited`)
            return false
          }
          
          // ALLOW: Update user with Google ID
          await users.updateOne(
            { email: user.email },
            { 
              $set: { 
                googleId: account.providerAccountId,
                lastLogin: new Date(),
                updatedAt: new Date()
              } 
            }
          )
          
          // Log successful login
          const logs = db.collection('system_logs')
          await logs.insertOne({
            action: 'google_login',
            details: `User logged in via Google`,
            username: invitedUser.username,
            email: user.email,
            timestamp: new Date()
          })
          
          return true
        } catch (error) {
          console.error('Google sign-in error:', error)
          return false
        }
      }
      return false
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google") {
        const db = await getDatabase()
        const dbUser = await db.collection('users').findOne({ email: token.email })
        
        if (dbUser) {
          token.userId = dbUser._id.toString()
          token.username = dbUser.username
          token.role = dbUser.role || 'user'
          
          // Generate JWT token compatible with existing system
          const jwtToken = jwt.sign(
            { 
              userId: dbUser._id.toString(), 
              username: dbUser.username, 
              role: dbUser.role || 'user' 
            },
            process.env.NEXTAUTH_SECRET!,
            { expiresIn: '7d' }
          )
          token.accessToken = jwtToken
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.name = token.username as string
        session.user.role = token.role as string
        session.accessToken = token.accessToken as string
      }
      return session
    }
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: "jwt",
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
