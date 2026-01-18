import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { authConfig } from "./auth.config"

const loginSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: "OTP",
            credentials: {
                email: { label: "Email", type: "email" },
                otp: { label: "OTP", type: "text" },
            },
            authorize: async (credentials) => {
                try {
                    const { email, otp } = await loginSchema.parseAsync(credentials)

                    const user = await prisma.systemUser.findUnique({
                        where: { email, active: true },
                    })

                    if (!user) {
                        console.log("Auth failed: User not found or inactive")
                        return null
                    }

                    // Find valid OTP
                    const validOtp = await prisma.systemUserOtp.findFirst({
                        where: {
                            systemUserId: user.id,
                            expiresAt: { gt: new Date() },
                            usedAt: null,
                        },
                        orderBy: { requestedAt: "desc" },
                    })

                    if (!validOtp) {
                        console.log("Auth failed: No valid OTP found")
                        return null
                    }

                    // Verify Hash
                    const isValid = await bcrypt.compare(otp, validOtp.otpHash)

                    if (!isValid) {
                        console.log("Auth failed: Invalid OTP")
                        return null
                    }

                    // Mark OTP as used
                    await prisma.systemUserOtp.update({
                        where: { id: validOtp.id },
                        data: { usedAt: new Date() },
                    })

                    // Update last login
                    await prisma.systemUser.update({
                        where: { id: user.id },
                        data: { lastLoginAt: new Date() },
                    })

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        // role: ... (can add role here if needed later)
                    }
                } catch (error) {
                    console.error("Auth error:", error)
                    return null
                }
            },
        }),
    ],
})
