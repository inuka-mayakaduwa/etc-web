"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/app/auth"
import { revalidatePath } from "next/cache"
import { hasPermission } from "@/lib/permissions"

async function requirePermission(node: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")
    const allowed = await hasPermission(session.user.id, node)
    if (!allowed) throw new Error(`Missing permission: ${node}`)
}

// --- Request Listing ---

export async function getRequests(filters?: {
    statusCode?: string
    dateFrom?: Date
    dateTo?: Date
    officerId?: string
    locationId?: string
}) {
    await requirePermission("etc.requests.view")

    const where: any = {}

    if (filters?.statusCode) {
        where.currentStatus = { code: filters.statusCode }
    }
    if (filters?.dateFrom || filters?.dateTo) {
        where.submittedAt = {}
        if (filters.dateFrom) where.submittedAt.gte = filters.dateFrom
        if (filters.dateTo) where.submittedAt.lte = filters.dateTo
    }
    if (filters?.officerId) {
        where.assignedOfficerId = filters.officerId
    }
    if (filters?.locationId) {
        where.preferredLocationId = filters.locationId
    }

    return await prisma.eTCRegistrationRequest.findMany({
        where,
        include: {
            currentStatus: true,
            vehicleType: true,
            assignedOfficer: true,
            preferredLocation: true
        },
        orderBy: {
            submittedAt: 'desc'
        },
        take: 100
    })
}

// --- Request Details ---

export async function getRequestDetails(requestId: string) {
    await requirePermission("etc.requests.view")

    const request = await prisma.eTCRegistrationRequest.findUnique({
        where: { id: requestId },
        include: {
            currentStatus: true,
            vehicleType: true,
            assignedOfficer: true,
            preferredLocation: true,
            activePaymentAttempt: true,
            activeAppointmentAttempt: {
                include: {
                    location: true
                }
            },
            paymentAttempts: {
                orderBy: { attemptNo: 'desc' },
                include: {
                    verifiedBy: true
                }
            },
            appointmentAttempts: {
                orderBy: { createdAt: 'desc' },
                include: {
                    location: true
                }
            },
            comments: {
                orderBy: { createdAt: 'desc' },
                include: {
                    createdBy: true
                }
            },
            auditLogs: {
                orderBy: { doneAt: 'desc' },
                take: 50,
                include: {
                    doneBy: true
                }
            },
            installedBy: true
        }
    })

    if (!request) return null

    // Convert Decimal amounts to strings for client serialization
    return {
        ...request,
        paymentAttempts: request.paymentAttempts.map(p => ({
            ...p,
            amount: p.amount?.toString() || null
        })),
        activePaymentAttempt: request.activePaymentAttempt ? {
            ...request.activePaymentAttempt,
            amount: request.activePaymentAttempt.amount?.toString() || null
        } : null
    }
}

// ---Status Transitions ---

export async function updateRequestStatus(
    requestId: string,
    newStatusCode: string,
    comment?: string,
    metadata?: Record<string, any>
) {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) throw new Error("Unauthorized")

    const request = await prisma.eTCRegistrationRequest.findUnique({
        where: { id: requestId },
        include: { currentStatus: true }
    })

    if (!request) throw new Error("Request not found")

    const newStatus = await prisma.requestStatus.findFirst({
        where: { code: newStatusCode, active: true }
    })

    if (!newStatus) throw new Error(`Status ${newStatusCode} not found`)

    // Check transition permissions (simplified - you can enhance with RequestStatusTransition validation)
    const transitionPerms: Record<string, string> = {
        'PENDING_INFORMATION_REVIEW': 'etc.payment.verify',
        'PENDING_TAG_CREATION': 'etc.requests.approve_info',
        'PENDING_INFORMATION_EDIT': 'etc.requests.review_info',
        'PENDING_REFUND': 'etc.requests.reject',
        'AWAITING_APPOINTMENT': 'etc.requests.manage_tags',
        'CANCELED': 'etc.requests.cancel'
    }

    console.log('🔐 Status Transition Check:', {
        userId: userId,
        from: request.currentStatus.code,
        to: newStatusCode,
        requiredPermission: transitionPerms[newStatusCode]
    })

    if (transitionPerms[newStatusCode]) {
        await requirePermission(transitionPerms[newStatusCode])
    }

    await prisma.$transaction(async (tx) => {
        await tx.eTCRegistrationRequest.update({
            where: { id: requestId },
            data: { currentStatusId: newStatus.id }
        })

        await tx.requestAuditLog.create({
            data: {
                requestId,
                action: 'STATUS_CHANGED',
                oldData: { statusCode: request.currentStatus.code },
                newData: { statusCode: newStatusCode, ...metadata },
                doneById: userId
            }
        })

        if (comment) {
            // If requesting edits, make comment visible to customer
            const visibility = newStatusCode === 'PENDING_INFORMATION_EDIT'
                ? 'INTERNAL_AND_CUSTOMER'
                : 'INTERNAL_ONLY'

            await tx.requestComment.create({
                data: {
                    requestId,
                    comment,
                    visibility,
                    createdById: userId
                }
            })
        }
    })

    revalidatePath("/admin/requests")
    return { success: true }
}

// --- Comments ---

export async function addComment(requestId: string, comment: string, visibility: 'INTERNAL_ONLY' | 'INTERNAL_AND_CUSTOMER') {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) throw new Error("Unauthorized")

    await requirePermission("etc.requests.view")

    await prisma.requestComment.create({
        data: {
            requestId,
            comment,
            visibility,
            createdById: userId
        }
    })

    revalidatePath("/admin/requests")
    return { success: true }
}

// --- Assignments ---

export async function assignRequest(requestId: string, officerId: string | null) {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) throw new Error("Unauthorized")

    await requirePermission("etc.requests.view")

    await prisma.$transaction(async (tx) => {
        await tx.eTCRegistrationRequest.update({
            where: { id: requestId },
            data: { assignedOfficerId: officerId }
        })

        await tx.requestAuditLog.create({
            data: {
                requestId,
                action: 'ASSIGNED_CHANGED',
                newData: { officerId },
                doneById: userId
            }
        })
    })

    revalidatePath("/admin/requests")
    return { success: true }
}

// --- Toggle Allow Edit ---

export async function toggleAllowEdit(requestId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await requirePermission("etc.requests.review_info")

    const request = await prisma.eTCRegistrationRequest.findUnique({
        where: { id: requestId }
    })

    if (!request) throw new Error("Request not found")

    await prisma.eTCRegistrationRequest.update({
        where: { id: requestId },
        data: {
            allowEditRequest: !request.allowEditRequest,
            allowEditUpdatedById: session.user.id,
            allowEditUpdatedAt: new Date()
        }
    })

    revalidatePath("/admin/requests")
    return { success: true, newValue: !request.allowEditRequest }
}

// --- RFID Management ---

export async function setRfidValue(requestId: string, rfidValue: string) {
    await requirePermission("etc.requests.manage_tags")

    const session = await auth()
    const userId = session?.user?.id
    if (!userId) throw new Error("Unauthorized")

    await prisma.$transaction(async (tx) => {
        await tx.eTCRegistrationRequest.update({
            where: { id: requestId },
            data: { rfidValue }
        })

        await tx.requestAuditLog.create({
            data: {
                requestId,
                action: 'REQUEST_UPDATED',
                newData: { rfidValue },
                doneById: userId
            }
        })
    })

    revalidatePath("/admin/requests")
    return { success: true }
}
