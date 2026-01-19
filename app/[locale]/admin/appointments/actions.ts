"use server"

import { auth } from "@/app/auth"
import { prisma } from "@/lib/db"
import { requirePermission } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import { addMinutes, format, parse, isAfter, isBefore, isEqual, startOfDay, endOfDay } from "date-fns"

// ============================================================================
// WEEKLY SCHEDULE MANAGEMENT
// ============================================================================

export async function getLocationSchedule(locationId: string) {
    await requirePermission("etc.appointments.manage")

    const schedules = await prisma.locationWeeklySchedule.findMany({
        where: { locationId },
        orderBy: { dayOfWeek: 'asc' }
    })

    // Return all 7 days, fill missing with closed
    const allDays = []
    for (let day = 0; day < 7; day++) {
        const existing = schedules.find(s => s.dayOfWeek === day)
        allDays.push(existing || {
            dayOfWeek: day,
            isOpen: false,
            openTime: null,
            closeTime: null
        })
    }

    return allDays
}

export async function updateLocationSchedule(locationId: string, dayOfWeek: number, data: {
    isOpen: boolean
    openTime?: string | null
    closeTime?: string | null
}) {
    await requirePermission("etc.appointments.manage")

    if (data.isOpen && (!data.openTime || !data.closeTime)) {
        throw new Error("Open and close times required when location is open")
    }

    await prisma.locationWeeklySchedule.upsert({
        where: {
            locationId_dayOfWeek: {
                locationId,
                dayOfWeek
            }
        },
        update: {
            isOpen: data.isOpen,
            openTime: data.isOpen ? data.openTime : null,
            closeTime: data.isOpen ? data.closeTime : null
        },
        create: {
            locationId,
            dayOfWeek,
            isOpen: data.isOpen,
            openTime: data.isOpen ? data.openTime : null,
            closeTime: data.isOpen ? data.closeTime : null
        }
    })

    revalidatePath('/admin/appointments')
}

export async function copyScheduleToDay(locationId: string, fromDay: number, toDay: number) {
    await requirePermission("etc.appointments.manage")

    const source = await prisma.locationWeeklySchedule.findUnique({
        where: {
            locationId_dayOfWeek: {
                locationId,
                dayOfWeek: fromDay
            }
        }
    })

    if (!source) {
        throw new Error("Source day schedule not found")
    }

    await prisma.locationWeeklySchedule.upsert({
        where: {
            locationId_dayOfWeek: {
                locationId,
                dayOfWeek: toDay
            }
        },
        update: {
            isOpen: source.isOpen,
            openTime: source.openTime,
            closeTime: source.closeTime
        },
        create: {
            locationId,
            dayOfWeek: toDay,
            isOpen: source.isOpen,
            openTime: source.openTime,
            closeTime: source.closeTime
        }
    })

    revalidatePath('/admin/appointments')
}

// ============================================================================
// CAPACITY RULES MANAGEMENT
// ============================================================================

export async function getLocationCapacityRules(locationId: string) {
    await requirePermission("etc.appointments.manage")

    return await prisma.locationCapacityRule.findMany({
        where: { locationId },
        orderBy: [
            { priority: 'desc' },
            { dayOfWeek: 'asc' }
        ]
    })
}

export async function createCapacityRule(data: {
    locationId: string
    dayOfWeek?: number | null
    startTime?: string | null
    endTime?: string | null
    capacity: number
    priority?: number
}) {
    await requirePermission("etc.appointments.manage")

    await prisma.locationCapacityRule.create({
        data: {
            locationId: data.locationId,
            dayOfWeek: data.dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
            capacity: data.capacity,
            priority: data.priority || 0
        }
    })

    revalidatePath('/admin/appointments')
}

export async function updateCapacityRule(ruleId: string, data: {
    capacity?: number
    priority?: number
}) {
    await requirePermission("etc.appointments.manage")

    await prisma.locationCapacityRule.update({
        where: { id: ruleId },
        data
    })

    revalidatePath('/admin/appointments')
}

export async function deleteCapacityRule(ruleId: string) {
    await requirePermission("etc.appointments.manage")

    await prisma.locationCapacityRule.delete({
        where: { id: ruleId }
    })

    revalidatePath('/admin/appointments')
}

// ============================================================================
// CALENDAR BLOCKS MANAGEMENT
// ============================================================================

export async function getLocationCalendarBlocks(locationId: string, fromDate?: Date, toDate?: Date) {
    await requirePermission("etc.appointments.manage")

    const where: any = { locationId }

    if (fromDate && toDate) {
        where.OR = [
            {
                blockType: 'FULL_DAY',
                blockDate: {
                    gte: fromDate,
                    lte: toDate
                }
            },
            {
                blockType: 'TIME_RANGE',
                startAt: {
                    lte: toDate
                },
                endAt: {
                    gte: fromDate
                }
            }
        ]
    }

    return await prisma.locationCalendarBlock.findMany({
        where,
        include: {
            createdBy: {
                select: {
                    name: true,
                    email: true
                }
            }
        },
        orderBy: [
            { blockDate: 'asc' },
            { startAt: 'asc' }
        ]
    })
}

export async function createCalendarBlock(data: {
    locationId: string
    blockType: 'FULL_DAY' | 'TIME_RANGE'
    blockDate?: Date
    startAt?: Date
    endAt?: Date
    reason?: string
}) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await requirePermission("etc.appointments.manage")

    if (data.blockType === 'FULL_DAY' && !data.blockDate) {
        throw new Error("Block date required for full day blocks")
    }

    if (data.blockType === 'TIME_RANGE' && (!data.startAt || !data.endAt)) {
        throw new Error("Start and end times required for time range blocks")
    }

    await prisma.locationCalendarBlock.create({
        data: {
            locationId: data.locationId,
            blockType: data.blockType,
            blockDate: data.blockType === 'FULL_DAY' ? data.blockDate : null,
            startAt: data.blockType === 'TIME_RANGE' ? data.startAt : null,
            endAt: data.blockType === 'TIME_RANGE' ? data.endAt : null,
            reason: data.reason,
            createdById: session.user.id
        }
    })

    revalidatePath('/admin/appointments')
}

export async function deleteCalendarBlock(blockId: string) {
    await requirePermission("etc.appointments.manage")

    await prisma.locationCalendarBlock.delete({
        where: { id: blockId }
    })

    revalidatePath('/admin/appointments')
}

// ============================================================================
// SLOT CONFIGURATION MANAGEMENT
// ============================================================================

export async function getLocationSlotConfig(locationId: string) {
    await requirePermission("etc.appointments.manage")

    let config = await prisma.locationSlotConfig.findUnique({
        where: { locationId }
    })

    // Create default if doesn't exist
    if (!config) {
        config = await prisma.locationSlotConfig.create({
            data: {
                locationId,
                serviceDuration: 60,
                bufferBefore: 0,
                bufferAfter: 0,
                minAdvanceHours: 24,
                maxAdvanceDays: 30
            }
        })
    }

    return config
}

export async function updateLocationSlotConfig(locationId: string, data: {
    slotDuration?: number
    serviceDuration?: number
    bufferBefore?: number
    bufferAfter?: number
    minAdvanceHours?: number
    maxAdvanceDays?: number
}) {
    await requirePermission("etc.appointments.manage")

    await prisma.locationSlotConfig.upsert({
        where: { locationId },
        update: data,
        create: {
            locationId,
            ...data
        }
    })

    revalidatePath('/admin/appointments')
}

// ============================================================================
// AVAILABILITY CALCULATION
// ============================================================================

interface TimeSlot {
    time: string  // "09:00"
    dateTime: Date
    available: boolean
    capacity: number
    booked: number
    reason?: string
}

export async function getAvailableSlots(locationId: string, date: Date) {
    // Can be called by customers, so no permission check

    const dayOfWeek = date.getDay()

    // 1. Get weekly schedule for this day
    const schedule = await prisma.locationWeeklySchedule.findUnique({
        where: {
            locationId_dayOfWeek: {
                locationId,
                dayOfWeek
            }
        }
    })

    if (!schedule || !schedule.isOpen) {
        return {
            slots: [],
            message: "Location is closed on this day"
        }
    }

    // 2. Get slot configuration
    const config = await getLocationSlotConfig(locationId)

    // 3. Check calendar blocks for this date
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)

    const blocks = await prisma.locationCalendarBlock.findMany({
        where: {
            locationId,
            OR: [
                {
                    blockType: 'FULL_DAY',
                    blockDate: dayStart
                },
                {
                    blockType: 'TIME_RANGE',
                    startAt: { lte: dayEnd },
                    endAt: { gte: dayStart }
                }
            ]
        }
    })

    // If full day block exists, no slots available
    if (blocks.some(b => b.blockType === 'FULL_DAY')) {
        return {
            slots: [],
            message: blocks.find(b => b.blockType === 'FULL_DAY')?.reason || "Location is blocked on this date"
        }
    }

    //4. Generate time slots
    const slots: TimeSlot[] = []
    const openTime = parse(schedule.openTime!, 'HH:mm', date)
    const closeTime = parse(schedule.closeTime!, 'HH:mm', date)

    let currentTime = openTime

    while (isBefore(currentTime, closeTime)) {
        const slotEndTime = addMinutes(currentTime, config.serviceDuration)

        // Check if service duration fits within working hours
        if (isAfter(slotEndTime, closeTime)) {
            break
        }

        // Check if this time overlaps any time-range blocks
        const isBlocked = blocks.some(block => {
            if (block.blockType === 'TIME_RANGE' && block.startAt && block.endAt) {
                return (
                    (isAfter(currentTime, block.startAt) || isEqual(currentTime, block.startAt)) &&
                    isBefore(currentTime, block.endAt)
                ) || (
                        isAfter(slotEndTime, block.startAt) &&
                        (isBefore(slotEndTime, block.endAt) || isEqual(slotEndTime, block.endAt))
                    )
            }
            return false
        })

        if (isBlocked) {
            slots.push({
                time: format(currentTime, 'HH:mm'),
                dateTime: currentTime,
                available: false,
                capacity: 0,
                booked: 0,
                reason: "Blocked"
            })
            currentTime = addMinutes(currentTime, config.serviceDuration)
            continue
        }

        // Get applicable capacity for this slot
        const capacity = await getSlotCapacity(locationId, dayOfWeek, format(currentTime, 'HH:mm'))

        // Count bookings that overlap this time slot (simpler now - just check overlap)
        const booked = await prisma.requestAppointmentAttempt.count({
            where: {
                locationId,
                status: { in: ['PENDING', 'CONFIRMED'] },
                scheduledStartAt: { lt: slotEndTime },
                scheduledEndAt: { gt: currentTime }
            }
        })

        slots.push({
            time: format(currentTime, 'HH:mm'),
            dateTime: currentTime,
            available: booked < capacity,
            capacity,
            booked,
        })

        currentTime = addMinutes(currentTime, config.serviceDuration)
    }

    return { slots, message: null }
}

async function getSlotCapacity(locationId: string, dayOfWeek: number, time: string): Promise<number> {
    const rules = await prisma.locationCapacityRule.findMany({
        where: {
            locationId,
            OR: [
                { dayOfWeek: null },  // Applies to all days
                { dayOfWeek }
            ]
        },
        orderBy: { priority: 'desc' }
    })

    // Find the highest priority matching rule
    for (const rule of rules) {
        // If rule has time restrictions, check if current time falls within
        if (rule.startTime && rule.endTime) {
            if (time >= rule.startTime && time < rule.endTime) {
                return rule.capacity
            }
        } else if (rule.startTime && !rule.endTime) {
            if (time >= rule.startTime) {
                return rule.capacity
            }
        } else if (!rule.startTime && rule.endTime) {
            if (time < rule.endTime) {
                return rule.capacity
            }
        } else {
            // No time restriction, applies to all times
            return rule.capacity
        }
    }

    // Default capacity if no rules match
    return 1
}

export async function getLocations() {
    return await prisma.installationLocation.findMany({
        where: { active: true },
        include: {
            slotConfig: true,
            weeklySchedules: true
        },
        orderBy: { name: 'asc' }
    })
}
