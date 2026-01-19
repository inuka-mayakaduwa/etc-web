"use server"

import { prisma } from "@/lib/db"
import { getAvailableSlots } from "@/app/[locale]/admin/appointments/actions"
import { revalidatePath } from "next/cache"
import { addDays, startOfDay } from "date-fns"
import { notificationProcessor } from "@/lib/services/notification/processor"

export async function getRequestForBooking(requestNo: string) {
    const request = await prisma.eTCRegistrationRequest.findUnique({
        where: { requestNo },
        include: {
            currentStatus: true,
            preferredLocation: true,
            activeAppointmentAttempt: {
                include: {
                    location: true
                }
            }
        }
    })

    return request
}

export async function bookAppointment(data: {
    requestId: string
    locationId: string
    datetime: Date
}) {
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
    const endTime = addDays(data.datetime, 0)
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
            mode: 'USER_PICKED',
            status: 'CONFIRMED',
            calendarProvider: 'INTERNAL'
        }
    })

    console.log('📅 [BOOKING] Created appointment:', appointment.id)

    // Get APPOINTMENT_SCHEDULED status
    const appointmentScheduledStatus = await prisma.requestStatus.findUnique({
        where: { code: 'APPOINTMENT_SCHEDULED' }
    })

    console.log('📅 [BOOKING] Found status:', appointmentScheduledStatus?.code, 'ID:', appointmentScheduledStatus?.id)

    if (!appointmentScheduledStatus) {
        console.error('❌ [BOOKING] APPOINTMENT_SCHEDULED status not found!')
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

    console.log('✅ [BOOKING] Status updated to:', updatedRequest.currentStatus.code)

    revalidatePath(`/etc/track/${request.requestNo}`)

    // --- Send Notification ---
    try {
        if (request.notifyEmail || request.notifySMS) {
            const recipient = {
                name: request.applicantName,
                email: request.applicantEmail,
                mobile: request.applicantMobile
            }

            // Format date/time
            const dateStr = data.datetime.toLocaleDateString('en-GB')
            const timeStr = data.datetime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

            // Get location details
            const location = await prisma.installationLocation.findUnique({
                where: { id: data.locationId }
            })

            const context = {
                requestNo: request.requestNo,
                date: dateStr,
                time: timeStr,
                location: location?.name || "ETC Center"
            }

            const finalRecipient = {
                ...recipient,
                email: request.notifyEmail ? recipient.email : undefined,
                mobile: request.notifySMS ? recipient.mobile : undefined
            }

            await notificationProcessor.sendNotification(finalRecipient, 'APPOINTMENT_CREATED', context)
        }
    } catch (err) {
        console.error("Failed to send booking notification", err)
    }

    return appointment
}

export async function getAvailableDates(locationId: string, fromDate: Date, daysCount: number = 30) {
    const dates = []
    let currentDate = startOfDay(fromDate)

    for (let i = 0; i < daysCount; i++) {
        const dayOfWeek = currentDate.getDay()

        // Check if location is open on this day
        const schedule = await prisma.locationWeeklySchedule.findUnique({
            where: {
                locationId_dayOfWeek: {
                    locationId,
                    dayOfWeek
                }
            }
        })

        // Check for full day blocks
        const blocks = await prisma.locationCalendarBlock.count({
            where: {
                locationId,
                blockType: 'FULL_DAY',
                blockDate: currentDate
            }
        })

        const isAvailable = schedule?.isOpen && blocks === 0

        dates.push({
            date: new Date(currentDate),
            dayOfWeek,
            available: isAvailable
        })

        currentDate = addDays(currentDate, 1)
    }

    return dates
}

export { getAvailableSlots }

// ============================================================================
// APPOINTMENT RESCHEDULING (CUSTOMER)
// ============================================================================

export async function rescheduleAppointment(data: {
    requestId: string
    locationId: string
    datetime: Date
}) {
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

    if (request.currentStatus.code !== 'APPOINTMENT_SCHEDULED') {
        throw new Error("Request does not have a scheduled appointment")
    }

    if (!request.activeAppointmentAttempt) {
        throw new Error("No active appointment found")
    }

    // Get location config to calculate end time
    const config = await prisma.locationSlotConfig.findUnique({
        where: { locationId: data.locationId }
    })

    const serviceDuration = config?.serviceDuration || 60
    const endTime = new Date(data.datetime)
    endTime.setMinutes(endTime.getMinutes() + serviceDuration)

    // Create new appointment attempt (increment attempt number)
    const nextAttemptNo = (request.appointmentAttempts[0]?.attemptNo || 0) + 1

    const newAppointment = await prisma.requestAppointmentAttempt.create({
        data: {
            requestId: data.requestId,
            attemptNo: nextAttemptNo,
            locationId: data.locationId,
            scheduledStartAt: data.datetime,
            scheduledEndAt: endTime,
            mode: 'USER_PICKED',
            status: 'CONFIRMED',
            calendarProvider: 'INTERNAL'
        }
    })

    console.log('🔄 [RESCHEDULE] Created new appointment:', newAppointment.id, 'Attempt:', nextAttemptNo)

    // Update request to point to new appointment
    await prisma.eTCRegistrationRequest.update({
        where: { id: data.requestId },
        data: {
            activeAppointmentAttemptId: newAppointment.id
        }
    })

    console.log('✅ [RESCHEDULE] Updated active appointment')

    revalidatePath(`/etc/track/${request.requestNo}`)

    // --- Send Notification ---
    try {
        if (request.notifyEmail || request.notifySMS) {
            const recipient = {
                name: request.applicantName,
                email: request.applicantEmail,
                mobile: request.applicantMobile
            }

            // Format date/time
            const dateStr = data.datetime.toLocaleDateString('en-GB')
            const timeStr = data.datetime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

            // Get location details
            const location = await prisma.installationLocation.findUnique({
                where: { id: data.locationId }
            })

            const context = {
                requestNo: request.requestNo,
                date: dateStr,
                time: timeStr,
                location: location?.name || "ETC Center"
            }

            const finalRecipient = {
                ...recipient,
                email: request.notifyEmail ? recipient.email : undefined,
                mobile: request.notifySMS ? recipient.mobile : undefined
            }

            await notificationProcessor.sendNotification(finalRecipient, 'APPOINTMENT_CREATED', context)
        }
    } catch (err) {
        console.error("Failed to send reschedule notification", err)
    }

    return newAppointment
}
