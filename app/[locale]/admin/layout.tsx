import { auth } from "@/app/auth"
import { hasPermission } from "@/lib/permissions"
import AdminSidebar from "./sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()
    const userId = session?.user?.id

    const permissions: Record<string, boolean> = {
        "etc.requests.view": userId ? await hasPermission(userId, "etc.requests.view") : false,
        "etc.payment.view": userId ? await hasPermission(userId, "etc.payment.view") : false,
        "etc.appointments.manage": userId ? await hasPermission(userId, "etc.appointments.manage") : false,
        "etc.settings.view": userId ? await hasPermission(userId, "etc.settings.view") : false,
    }

    return (
        <AdminSidebar permissions={permissions}>
            {children}
        </AdminSidebar>
    )
}
