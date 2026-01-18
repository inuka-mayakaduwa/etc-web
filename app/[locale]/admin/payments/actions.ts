"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/app/auth"
import { revalidatePath } from "next/cache"
import { hasPermission } from "@/lib/permissions"

// --- Helper: Permission Check ---
async function requirePermission(node: string) {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) throw new Error("Unauthorized")
    const allowed = await hasPermission(userId, node)
    if (!allowed) throw new Error(`Missing permission: ${node}`)
}

// --- Payment Management Actions ---

export async function getPendingPayments() {
    await requirePermission("etc.payment.view")

    const payments = await prisma.requestPaymentAttempt.findMany({
        where: {
            status: {
                in: ['PENDING_REVIEW', 'PENDING']
            }
        },
        include: {
            request: {
                include: {
                    currentStatus: true,
                    vehicleType: true
                }
            },
            verifiedBy: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return payments.map(p => ({
        ...p,
        amount: p.amount?.toString() || null
    }))
}

export async function getPaymentsByStatus(status: 'PENDING_REVIEW' | 'COMPLETED' | 'REJECTED' | 'ALL') {
    await requirePermission("etc.payment.view")

    const where = status === 'ALL' ? {} : { status }

    const payments = await prisma.requestPaymentAttempt.findMany({
        where,
        include: {
            request: {
                include: {
                    currentStatus: true,
                    vehicleType: true
                }
            },
            verifiedBy: true
        },
        orderBy: {
            updatedAt: 'desc'
        },
        take: 100
    })

    return payments.map(p => ({
        ...p,
        amount: p.amount?.toString() || null
    }))
}

export async function getPaymentDetails(paymentId: string) {
    await requirePermission("etc.payment.view")

    return await prisma.requestPaymentAttempt.findUnique({
        where: { id: paymentId },
        include: {
            request: {
                include: {
                    currentStatus: true,
                    vehicleType: true,
                    preferredLocation: true,
                    assignedOfficer: true,
                    paymentAttempts: {
                        orderBy: { attemptNo: 'desc' }
                    }
                }
            },
            verifiedBy: true
        }
    })
}

export async function approvePayment(paymentId: string, notes?: string) {
    await requirePermission("etc.payment.verify")

    const session = await auth()
    const userId = session?.user?.id
    if (!userId) throw new Error("Unauthorized")

    const payment = await prisma.requestPaymentAttempt.findUnique({
        where: { id: paymentId },
        include: { request: { include: { currentStatus: true } } }
    })

    if (!payment) throw new Error("Payment not found")
    if (payment.status !== 'PENDING_REVIEW') {
        throw new Error(`Cannot approve payment with status: ${payment.status}`)
    }

    await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.requestPaymentAttempt.update({
            where: { id: paymentId },
            data: {
                status: 'COMPLETED',
                verifiedById: userId,
                verifiedAt: new Date()
            }
        })

        // Update request status to PENDING_INFORMATION_REVIEW
        const nextStatus = await tx.requestStatus.findFirst({
            where: { code: 'PENDING_INFORMATION_REVIEW', active: true }
        })

        if (!nextStatus) throw new Error("PENDING_INFORMATION_REVIEW status not found")

        await tx.eTCRegistrationRequest.update({
            where: { id: payment.requestId },
            data: { currentStatusId: nextStatus.id }
        })

        // Audit logs
        await tx.requestAuditLog.create({
            data: {
                requestId: payment.requestId,
                action: 'PAYMENT_STATUS_CHANGED',
                oldData: { status: payment.status },
                newData: { status: 'COMPLETED' },
                doneById: userId
            }
        })

        await tx.requestAuditLog.create({
            data: {
                requestId: payment.requestId,
                action: 'STATUS_CHANGED',
                oldData: { statusCode: payment.request.currentStatus.code },
                newData: { statusCode: 'PENDING_INFORMATION_REVIEW' },
                doneById: userId
            }
        })

        if (notes) {
            await tx.requestComment.create({
                data: {
                    requestId: payment.requestId,
                    comment: `Payment approved: ${notes}`,
                    visibility: 'INTERNAL_ONLY',
                    createdById: userId
                }
            })
        }
    })

    revalidatePath("/admin/payments")
    return { success: true }
}

export async function rejectPayment(paymentId: string, reason: string) {
    await requirePermission("etc.payment.verify")

    if (!reason?.trim()) throw new Error("Rejection reason is required")

    const session = await auth()
    const userId = session?.user?.id
    if (!userId) throw new Error("Unauthorized")

    const payment = await prisma.requestPaymentAttempt.findUnique({
        where: { id: paymentId },
        include: { request: { include: { currentStatus: true } } }
    })

    if (!payment) throw new Error("Payment not found")
    if (payment.status !== 'PENDING_REVIEW') {
        throw new Error(`Cannot reject payment with status: ${payment.status}`)
    }

    await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.requestPaymentAttempt.update({
            where: { id: paymentId },
            data: {
                status: 'REJECTED',
                verifiedById: userId,
                verifiedAt: new Date(),
                rejectReason: reason
            }
        })

        // Return to PENDING_PAYMENT
        const pendingStatus = await tx.requestStatus.findFirst({
            where: { code: 'PENDING_PAYMENT', active: true }
        })

        if (!pendingStatus) throw new Error("PENDING_PAYMENT status not found")

        await tx.eTCRegistrationRequest.update({
            where: { id: payment.requestId },
            data: {
                currentStatusId: pendingStatus.id
                // paymentFailedCount: { increment: 1 } // Field does not exist in schema
            }
        })

        // Audit logs
        await tx.requestAuditLog.create({
            data: {
                requestId: payment.requestId,
                action: 'PAYMENT_STATUS_CHANGED',
                oldData: { status: payment.status },
                newData: { status: 'REJECTED', reason },
                doneById: userId
            }
        })

        await tx.requestComment.create({
            data: {
                requestId: payment.requestId,
                comment: `Payment rejected: ${reason}`,
                visibility: 'INTERNAL_ONLY',
                createdById: userId
            }
        })

        // Check for intervention flag
        const updatedRequest = await tx.eTCRegistrationRequest.findUnique({
            where: { id: payment.requestId },
            include: { paymentAttempts: true }
        })

        const failedCount = updatedRequest?.paymentAttempts.filter(p => p.status === 'REJECTED').length || 0;

        if (failedCount >= 5) {
            await tx.requestComment.create({
                data: {
                    requestId: payment.requestId,
                    comment: 'SYSTEM: 5+ payment failures. Admin intervention required.',
                    visibility: 'INTERNAL_ONLY'
                }
            })
        }
    })

    revalidatePath("/admin/payments")
    return { success: true }
}

export async function verifyPayment(id: string, action: "APPROVE" | "REJECT") {
    if (action === "APPROVE") {
        return await approvePayment(id)
    } else {
        return await rejectPayment(id, "Rejected by admin")
    }
}
