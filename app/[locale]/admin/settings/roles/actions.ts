"use server"

import { prisma } from "@/lib/db"
import { auth } from "@/app/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { hasPermission } from "@/lib/permissions"

// Actions
export async function getRoles() {
    // await requirePermission("etc.settings.roles.view")
    return await prisma.systemRole.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        include: {
            rolePermissions: {
                include: { permission: true }
            },
            userRoles: {
                include: {
                    systemUser: true
                }
            }
        }
    })
}

const DEFINED_PERMISSIONS = [
    { category: "Settings", node: "etc.settings.roles.view", description: "View Roles" },
    { category: "Settings", node: "etc.settings.roles.write", description: "Create/Edit/Delete Roles" },
    { category: "Settings", node: "etc.settings.users.view", description: "View Users" },
    { category: "Settings", node: "etc.settings.users.write", description: "Create/Edit/Delete Users" },
    { category: "Settings", node: "etc.settings.vehicle_types.manage", description: "Manage Vehicle Types" },
    { category: "Settings", node: "etc.settings.locations.manage", description: "Manage Installation Locations" },
    { category: "Settings", node: "etc.settings.statuses.manage", description: "Manage Request Statuses" },
    { node: 'etc.payment.view', description: 'View payment records' },
    { node: 'etc.payment.verify', description: 'Approve or reject payments' },

    // Appointments
    { node: 'etc.appointments.manage', description: 'Manage appointment slots and schedules' },

    // Settings
    { node: 'etc.settings.view', description: 'View system settings' },
    { category: "Request", node: "etc.requests.view", description: "View Requests" },
    { category: "Request", node: "etc.requests.approve_info", description: "Approve Request Information" },
    { category: "Request", node: "etc.requests.review_info", description: "Request Information Edits" },
    { category: "Request", node: "etc.requests.reject", description: "Reject Requests" },
    { category: "Request", node: "etc.requests.manage_tags", description: "Manage RFID Tags" },
    { category: "Request", node: "etc.requests.cancel", description: "Cancel Requests" },
    { category: "Request", node: "etc.requests.refund", description: "Process Refunds" },
    { category: "Appointment", node: "etc.appointments.manage", description: "Manage Appointments" },
    { category: "Installation", node: "etc.installations.complete", description: "Complete Installations" },
    { category: "System", node: "etc.settings.view", description: "View Settings Menu" },
    { category: "System", node: "etc.provisioning.manage", description: "Manage Provisioning" },
]

export async function getAllPermissions() {
    // Auto-seed permissions to ensure they exist in DB
    for (const p of DEFINED_PERMISSIONS) {
        await prisma.systemPermission.upsert({
            where: { node: p.node },
            update: { description: p.description },
            create: { node: p.node, description: p.description, active: true }
        })
    }

    return await prisma.systemPermission.findMany({
        where: { active: true },
        orderBy: { node: "asc" }
    })
}

export async function getCategorizedPermissions() {
    const categorized: Record<string, typeof DEFINED_PERMISSIONS> = {}

    DEFINED_PERMISSIONS.forEach(p => {
        const category = p.category || 'Other'
        if (!categorized[category]) {
            categorized[category] = []
        }
        categorized[category].push(p)
    })

    return categorized
}

const roleSchema = z.object({
    name: z.string().min(1, "Name is required"),
    permissionIds: z.array(z.string()).optional()
})
export type RoleFormData = z.infer<typeof roleSchema>

export async function createRole(data: RoleFormData) {
    await requirePermission("etc.settings.roles.write")
    const { permissionIds, ...roleData } = data

    await prisma.$transaction(async (tx) => {
        const role = await tx.systemRole.create({
            data: roleData
        })

        if (permissionIds && permissionIds.length > 0) {
            await tx.systemRolePermission.createMany({
                data: permissionIds.map(pid => ({ roleId: role.id, permissionId: pid }))
            })
        }
    })

    revalidatePath("/admin/settings")
    return { success: true }
}

export async function updateRole(id: string, data: RoleFormData) {
    // await requirePermission("etc.settings.roles.write")
    const { permissionIds, ...roleData } = data

    await prisma.$transaction(async (tx) => {
        await tx.systemRole.update({
            where: { id },
            data: roleData
        })

        await tx.systemRolePermission.deleteMany({ where: { roleId: id } })

        if (permissionIds && permissionIds.length > 0) {
            await tx.systemRolePermission.createMany({
                data: permissionIds.map(pid => ({ roleId: id, permissionId: pid }))
            })
        }
    })

    revalidatePath("/admin/settings")
    return { success: true }
}

export async function deleteRole(id: string) {
    // await requirePermission("etc.settings.roles.write")
    await prisma.systemRole.update({ where: { id }, data: { active: false } })
    revalidatePath("/admin/settings")
    return { success: true }
}

async function requirePermission(node: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")
    const allowed = await hasPermission(session.user.id, node)
    if (!allowed) console.warn(`[WARN] Missing permission ${node}`)
}
