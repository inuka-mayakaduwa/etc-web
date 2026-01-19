import { prisma } from "@/lib/db"

export async function hasPermission(userId: string, permissionNode: string): Promise<boolean> {
    // 1. Check direct permissions
    const direct = await prisma.systemUserPermission.findFirst({
        where: {
            systemUserId: userId,
            permission: { node: permissionNode, active: true },
        },
    })

    if (direct) return true

    // 2. Check role permissions
    // Find all roles of the user
    const userRoles = await prisma.systemUserRole.findMany({
        where: { systemUserId: userId },
        include: {
            role: {
                include: {
                    rolePermissions: {
                        include: {
                            permission: true
                        }
                    }
                }
            }
        }
    })

    // Check if any role has the permission
    for (const ur of userRoles) {
        if (!ur.role.active) continue;
        const has = ur.role.rolePermissions.some(rp => rp.permission.node === permissionNode && rp.permission.active)
        if (has) return true
    }

    return false
}

// Optimized version for batch checking or caching could be added here

export async function requirePermission(permissionNode: string): Promise<void> {
    const { auth } = await import("@/app/auth")
    const session = await auth()

    if (!session?.user?.id) {
        throw new Error("Unauthorized: No session")
    }

    const hasPerm = await hasPermission(session.user.id, permissionNode)

    if (!hasPerm) {
        throw new Error(`Permission denied: ${permissionNode}`)
    }
}
