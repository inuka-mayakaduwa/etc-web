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

import { DEFINED_PERMISSIONS } from "@/lib/permission-definitions"

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
