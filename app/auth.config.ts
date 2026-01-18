import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    providers: [],
    pages: {
        signIn: "/admin/login",
        error: "/admin/login",
    },
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id as string
            }
            return token
        },
        session({ session, token }) {
            if (session.user) {
                // @ts-ignore
                session.user.id = token.id as string
            }
            return session
        },
    },
    secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig
