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
    return session.user.id
}

export async function markInstallationCompleted(requestId: string) {
    const adminId = await requirePermission("etc.requests.manage_tags") // or suitable permission

    // Find PENDING_PROVISIONING status
    const pendingProvStatus = await prisma.requestStatus.findUnique({
        where: { code: "PENDING_PROVISIONING" }
    })

    // Fallback or Error if not found (Since user manually added, it should be there, but strictly it depends on exact string)
    if (!pendingProvStatus) {
        throw new Error("PENDING_PROVISIONING status not found in database.")
    }

    await prisma.$transaction(async (tx) => {
        // Update Request
        await tx.eTCRegistrationRequest.update({
            where: { id: requestId },
            data: {
                currentStatusId: pendingProvStatus.id,
                installationStatus: "INSTALLED",
                installedAt: new Date(),
                installedById: adminId,
            }
        })

        // Audit & Log
        await tx.requestAuditLog.create({
            data: {
                requestId,
                action: "INSTALLATION_UPDATED",
                newData: { status: "INSTALLED", transitionTo: "PENDING_PROVISIONING" },
                doneById: adminId
            }
        })

        await tx.requestAuditLog.create({
            data: {
                requestId,
                action: "STATUS_CHANGED",
                newData: { statusCode: "PENDING_PROVISIONING" },
                doneById: adminId
            }
        })
    })

    revalidatePath(`/admin/requests/${requestId}`)
    return { success: true }
}

export async function provisionCompleted(requestId: string) {
    const adminId = await requirePermission("etc.requests.manage_tags") // or "etc.provisioning.manage"

    // Find COMPLETED status
    const completedStatus = await prisma.requestStatus.findUnique({
        where: { code: "COMPLETED" }
    })

    if (!completedStatus) {
        throw new Error("COMPLETED status not found in database.")
    }

    await prisma.$transaction(async (tx) => {
        // Update Request
        await tx.eTCRegistrationRequest.update({
            where: { id: requestId },
            data: {
                currentStatusId: completedStatus.id,
                provisionStatus: "CREATED",
                provisionedAt: new Date(),
            }
        })

        // In a real scenario, you might want to finalize things here

        // Audit
        await tx.requestAuditLog.create({
            data: {
                requestId,
                action: "PROVISIONING_UPDATED",
                newData: { status: "CREATED", transitionTo: "COMPLETED" },
                doneById: adminId
            }
        })

        await tx.requestAuditLog.create({
            data: {
                requestId,
                action: "STATUS_CHANGED",
                newData: { statusCode: "COMPLETED" },
                doneById: adminId
            }
        })
    })

    revalidatePath(`/admin/requests/${requestId}`)
    return { success: true }
}
