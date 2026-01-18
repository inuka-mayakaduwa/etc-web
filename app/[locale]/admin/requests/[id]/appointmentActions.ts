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

// ============================================================================
// APPOINTMENT BOOKING (ADMIN)
// ============================================================================

export async function adminBookAppointment(data: {
    requestId: string
    locationId: string
    datetime: Date
}) {
    await requirePermission("etc.appointments.manage")

    // Get request to validate
    const request = await prisma.eTCRegistrationRequest.findUnique({
        where: { id: data.requestId },
        include: {
            preferredLocation: true,
            currentStatus: true,
            appointmentAttempts: {
                orderBy: { attemptNo: 'desc' },
                take: 1
            }
        }
    })

    if (!request) {
        throw new Error("Request not found")
    }

    // Check if status allows booking
    if (request.currentStatus.code !== 'AWAITING_APPOINTMENT') {
        throw new Error("Request is not in a state that allows appointment booking")
    }

    // Get location config to calculate end time
    const config = await prisma.locationSlotConfig.findUnique({
        where: { locationId: data.locationId }
    })

    const serviceDuration = config?.serviceDuration || 60
    const endTime = new Date(data.datetime)
    endTime.setMinutes(endTime.getMinutes() + serviceDuration)

    // Create new appointment attempt
    const nextAttemptNo = (request.appointmentAttempts[0]?.attemptNo || 0) + 1

    const appointment = await prisma.requestAppointmentAttempt.create({
        data: {
            requestId: data.requestId,
            attemptNo: nextAttemptNo,
            locationId: data.locationId,
            scheduledStartAt: data.datetime,
            scheduledEndAt: endTime,
            mode: 'STAFF_ASSIGNED',
            status: 'CONFIRMED',
            calendarProvider: 'INTERNAL'
        }
    })

    console.log('📅 [ADMIN BOOKING] Created appointment:', appointment.id)

    // Get APPOINTMENT_SCHEDULED status
    const appointmentScheduledStatus = await prisma.requestStatus.findUnique({
        where: { code: 'APPOINTMENT_SCHEDULED' }
    })

    console.log('📅 [ADMIN BOOKING] Found status:', appointmentScheduledStatus?.code, 'ID:', appointmentScheduledStatus?.id)

    if (!appointmentScheduledStatus) {
        throw new Error("APPOINTMENT_SCHEDULED status not found in system")
    }

    // Update request's active appointment and status
    const updatedRequest = await prisma.eTCRegistrationRequest.update({
        where: { id: data.requestId },
        data: {
            activeAppointmentAttemptId: appointment.id,
            currentStatusId: appointmentScheduledStatus.id
        },
        include: {
            currentStatus: true
        }
    })

    console.log('✅ [ADMIN BOOKING] Status updated to:', updatedRequest.currentStatus.code)

    revalidatePath(`/admin/requests/${data.requestId}`)

    return appointment
}

// Import and re-export availability functions
import { getAvailableSlots as _getAvailableSlots } from "@/app/[locale]/admin/appointments/actions"
import { getAvailableDates as _getAvailableDates } from "@/app/[locale]/etc/track/[requestNo]/actions"

export const getAvailableSlots = _getAvailableSlots
export const getAvailableDates = _getAvailableDates

// ============================================================================
// APPOINTMENT MANAGEMENT (ADMIN)
// ============================================================================

export async function markNoShow(appointmentId: string, requestId: string) {
    await requirePermission("etc.appointments.manage")

    // Get AWAITING_APPOINTMENT status
    const awaitingStatus = await prisma.requestStatus.findUnique({
        where: { code: 'AWAITING_APPOINTMENT' }
    })

    if (!awaitingStatus) {
        throw new Error("AWAITING_APPOINTMENT status not found")
    }

    // Update appointment status to NO_SHOW (MISSED)
    await prisma.requestAppointmentAttempt.update({
        where: { id: appointmentId },
        data: { status: 'MISSED' }
    })

    // Revert request status to AWAITING_APPOINTMENT and clear active appointment
    await prisma.eTCRegistrationRequest.update({
        where: { id: requestId },
        data: {
            activeAppointmentAttemptId: null,
            currentStatusId: awaitingStatus.id
        }
    })

    console.log('❌ [NO-SHOW] Marked appointment as no-show and reverted to AWAITING_APPOINTMENT:', appointmentId)

    revalidatePath(`/admin/requests/${requestId}`)

    return { success: true }
}

export async function rescheduleAppointmentAdmin(data: {
    requestId: string
    locationId: string
    datetime: Date
}) {
    await requirePermission("etc.appointments.manage")

    // Get current request with appointment
    const request = await prisma.eTCRegistrationRequest.findUnique({
        where: { id: data.requestId },
        include: {
            currentStatus: true,
            activeAppointmentAttempt: true,
            appointmentAttempts: {
                orderBy: { attemptNo: 'desc' },
                take: 1
            }
        }
    })

    if (!request) {
        throw new Error("Request not found")
    }

    // Get location config to calculate end time
    const config = await prisma.locationSlotConfig.findUnique({
        where: { locationId: data.locationId }
    })

    const serviceDuration = config?.serviceDuration || 60
    const endTime = new Date(data.datetime)
    endTime.setMinutes(endTime.getMinutes() + serviceDuration)

    // Create new appointment attempt
    const nextAttemptNo = (request.appointmentAttempts[0]?.attemptNo || 0) + 1

    const newAppointment = await prisma.requestAppointmentAttempt.create({
        data: {
            requestId: data.requestId,
            attemptNo: nextAttemptNo,
            locationId: data.locationId,
            scheduledStartAt: data.datetime,
            scheduledEndAt: endTime,
            mode: 'STAFF_ASSIGNED',
            status: 'CONFIRMED',
            calendarProvider: 'INTERNAL'
        }
    })

    console.log('🔄 [ADMIN RESCHEDULE] Created new appointment:', newAppointment.id)

    // Update request to point to new appointment  
    await prisma.eTCRegistrationRequest.update({
        where: { id: data.requestId },
        data: {
            activeAppointmentAttemptId: newAppointment.id
        }
    })

    revalidatePath(`/admin/requests/${data.requestId}`)

    return newAppointment
}

export async function cancelAppointment(appointmentId: string, requestId: string) {
    await requirePermission("etc.appointments.manage")

    // Get AWAITING_APPOINTMENT status
    const awaitingStatus = await prisma.requestStatus.findUnique({
        where: { code: 'AWAITING_APPOINTMENT' }
    })

    if (!awaitingStatus) {
        throw new Error("AWAITING_APPOINTMENT status not found")
    }

    // Update appointment status to CANCELLED
    await prisma.requestAppointmentAttempt.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' }
    })

    // Revert request status to AWAITING_APPOINTMENT and clear active appointment
    await prisma.eTCRegistrationRequest.update({
        where: { id: requestId },
        data: {
            activeAppointmentAttemptId: null,
            currentStatusId: awaitingStatus.id
        }
    })

    console.log('🗑️ [CANCEL] Cancelled appointment and reverted to AWAITING_APPOINTMENT')

    revalidatePath(`/admin/requests/${requestId}`)

    return { success: true }
}
