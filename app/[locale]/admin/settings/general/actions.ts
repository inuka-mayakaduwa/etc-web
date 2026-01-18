"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/app/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { hasPermission } from "@/lib/permissions"

// --- Helper Permissions ---

async function requirePermission(node: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")
    const allowed = await hasPermission(session.user.id, node)
    if (!allowed) throw new Error(`Missing permission ${node}`)
}

// --- Vehicle Types ---

const vehicleTypeSchema = z.object({
    code: z.string().min(1),
    label: z.string().min(1),
    active: z.boolean().default(true)
})

export async function getVehicleTypes() {
    // await requirePermission("etc.settings.vehicle_types.view") // strict view check if needed
    return await prisma.vehicleType.findMany({ orderBy: { code: "asc" } })
}

export async function createVehicleType(data: z.infer<typeof vehicleTypeSchema>) {
    await requirePermission("etc.settings.vehicle_types.manage")
    await prisma.vehicleType.create({ data })
    revalidatePath("/admin/settings")
    return { success: true }
}

export async function updateVehicleType(id: string, data: z.infer<typeof vehicleTypeSchema>) {
    await requirePermission("etc.settings.vehicle_types.manage")
    await prisma.vehicleType.update({ where: { id }, data })
    revalidatePath("/admin/settings")
    return { success: true }
}

export async function deleteVehicleType(id: string) {
    await requirePermission("etc.settings.vehicle_types.manage")
    // Soft delete usually safer, but schema allows... let's just set active=false if using 'active' field
    // or allow hard delete if no relations. Schema has active.
    await prisma.vehicleType.update({ where: { id }, data: { active: false } })
    revalidatePath("/admin/settings")
    return { success: true }
}


// --- Locations ---

const locationSchema = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    address: z.string().optional(),
    contactNo: z.string().optional(),
    active: z.boolean().default(true)
})

export async function getLocations() {
    // await requirePermission("etc.settings.locations.view")
    return await prisma.installationLocation.findMany({ orderBy: { name: "asc" } })
}

export async function createLocation(data: z.infer<typeof locationSchema>) {
    await requirePermission("etc.settings.locations.manage")
    await prisma.installationLocation.create({ data })
    revalidatePath("/admin/settings")
    return { success: true }
}

export async function updateLocation(id: string, data: z.infer<typeof locationSchema>) {
    await requirePermission("etc.settings.locations.manage")
    await prisma.installationLocation.update({ where: { id }, data })
    revalidatePath("/admin/settings")
    return { success: true }
}

export async function deleteLocation(id: string) {
    await requirePermission("etc.settings.locations.manage")
    await prisma.installationLocation.update({ where: { id }, data: { active: false } })
    revalidatePath("/admin/settings")
    return { success: true }
}

// --- Statuses ---

const statusSchema = z.object({
    code: z.string().min(1),
    label: z.string().min(1),
    category: z.string().min(1),
    orderIndex: z.coerce.number().default(0),
    isTerminal: z.boolean().default(false),
    isEditable: z.boolean().default(false),
    active: z.boolean().default(true)
})

export async function getRequestStatuses() {
    return await prisma.requestStatus.findMany({ orderBy: { orderIndex: "asc" } })
}

export async function createStatus(data: z.infer<typeof statusSchema>) {
    await requirePermission("etc.settings.statuses.manage")
    await prisma.requestStatus.create({ data })
    revalidatePath("/admin/settings")
    return { success: true }
}

export async function updateStatus(id: string, data: z.infer<typeof statusSchema>) {
    await requirePermission("etc.settings.statuses.manage")
    await prisma.requestStatus.update({ where: { id }, data })
    revalidatePath("/admin/settings")
    return { success: true }
}
