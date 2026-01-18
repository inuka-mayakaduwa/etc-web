import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { notificationProcessor } from "@/lib/services/notification/processor"

const requestOtpSchema = z.object({
    email: z.string().email(),
})

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email } = requestOtpSchema.parse(body)

        const user = await prisma.systemUser.findUnique({
            where: { email, active: true },
        })

        if (!user) {
            // Return success even if user not found to prevent enumeration
            // But for internal system, maybe fine to return error? 
            // Plan says "Check if SystemUser exists".
            // Let's return Generic success to be safe, or just 404 for admin tool helper?
            // "System users will do Email and OTP Authentication". Usually internal tools can be more explicit.
            // But let's stick to secure default: return 200, but don't send anything.
            // However, for debugging:
            console.log(`OTP Request for ${email}: User not found`)
            return NextResponse.json({ message: "If user exists, OTP sent." })
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const otpHash = await bcrypt.hash(otp, 10)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

        await prisma.systemUserOtp.create({
            data: {
                systemUserId: user.id,
                otpHash,
                expiresAt,
                requestIp: req.headers.get("x-forwarded-for") || "unknown",
            },
        })

        // Send OTP via Notification Processor
        // It handles checking for mobile/email internally based on what's passed
        const recipient = {
            email: user.email,
            mobile: user.mobile, // SystemUser has mobile
            name: user.name
        };

        await notificationProcessor.sendNotification(recipient, 'OTP', {
            otp: otp
        });

        // console.log(`[DEVELOPMENT] OTP for ${email}: ${otp}`)

        return NextResponse.json({ message: "If user exists, OTP sent." })
    } catch (error) {
        console.error("OTP Request Error:", error)
        return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
}
