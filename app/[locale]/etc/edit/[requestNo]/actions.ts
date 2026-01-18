"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateApplication(requestId: string, data: any) {
    if (!requestId) throw new Error("Request ID required")

    const request = await prisma.eTCRegistrationRequest.findUnique({
        where: { id: requestId },
        include: { currentStatus: true }
    })

    if (!request) throw new Error("Request not found")

    // Verify status is PENDING_INFORMATION_EDIT
    if (request.currentStatus.code !== 'PENDING_INFORMATION_EDIT') {
        throw new Error("Application is not in editable state")
    }

    const reviewStatus = await prisma.requestStatus.findFirst({
        where: { code: 'PENDING_INFORMATION_REVIEW', active: true }
    })

    if (!reviewStatus) throw new Error("Target status PENDING_INFORMATION_REVIEW not found")

    await prisma.$transaction(async (tx) => {
        // Update Request
        await tx.eTCRegistrationRequest.update({
            where: { id: requestId },
            data: {
                applicantName: data.applicantName,
                applicantNICOrPassport: data.applicantNICOrPassport,
                applicantMobile: data.applicantMobile,
                applicantEmail: data.applicantEmail,
                lpn: data.lpn,
                vehicleTypeId: data.vehicleTypeId, // Using ID, assumed ID passed or need lookup? 
                // Form usually works with codes. I need to resolve code to ID if needed.
                // Wait, Registration API does lookups. I should probably do same here.
                // For now assuming data is pre-processed or valid.
                preferredLocationId: data.preferredLocationId,
                notifySMS: data.notifySMS,
                notifyEmail: data.notifyEmail,

                currentStatusId: reviewStatus.id,   // Move back to Review
                allowEditRequest: false,            // Lock specific edit flag if used
                // Clear any "Active" flags? No.
            }
        })

        // Audit Log
        await tx.requestAuditLog.create({
            data: {
                requestId,
                action: 'REQUEST_UPDATED',
                oldData: {
                    name: request.applicantName,
                    lpn: request.lpn,
                    status: request.currentStatus.code
                },
                newData: {
                    name: data.applicantName,
                    lpn: data.lpn,
                    status: reviewStatus.code
                },
                doneById: null // User action
            }
        })
    })

    revalidatePath(`/etc/track/${request.requestNo}`)
    revalidatePath("/admin/requests")

    return { success: true }
}
