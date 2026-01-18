import { getRequests } from "./actions"
import { hasPermission } from "@/lib/permissions"
import { auth } from "@/app/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RequestListTable } from "./components"

export default async function RequestsPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/admin/login")
    }

    const canView = await hasPermission(session.user.id, "etc.requests.view")
    if (!canView) {
        return (
            <div className="flex h-full items-center justify-center">
                <Card>
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You don't have permission to view requests.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const requests = await getRequests()

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Request Management</h2>
                    <p className="text-muted-foreground">
                        View and manage ETC registration requests
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Requests</CardTitle>
                    <CardDescription>
                        ETC registration requests and their current status
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RequestListTable requests={requests} />
                </CardContent>
            </Card>
        </div>
    )
}
