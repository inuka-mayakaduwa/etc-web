import { getRequests } from "./actions"
import { hasPermission } from "@/lib/permissions"
import { auth } from "@/app/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RequestListTableEnhanced } from "./components"
import { StatCard } from "@/components/admin/stat-card"
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react"
import { prisma } from "@/lib/db"

export default async function RequestsPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/login")
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

    // Fetch data
    const [requests, officers, statuses] = await Promise.all([
        getRequests(),
        prisma.systemUser.findMany({
            where: { active: true },
            select: { id: true, name: true }
        }),
        prisma.requestStatus.findMany({
            where: { active: true },
            select: { id: true, code: true, label: true, category: true }
        })
    ])

    // Calculate stats
    const totalRequests = requests.length
    const openRequests = requests.filter(r => r.currentStatus.category === 'OPEN').length
    const inProgressRequests = requests.filter(r => r.currentStatus.category === 'IN_PROGRESS').length
    const completedRequests = requests.filter(r => r.currentStatus.category === 'DONE').length

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Request Management</h1>
                    <p className="text-muted-foreground">
                        View and manage ETC registration requests
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Requests"
                    value={totalRequests}
                    icon={FileText}
                    variant="default"
                    description="All time"
                />
                <StatCard
                    title="Open"
                    value={openRequests}
                    icon={Clock}
                    variant="primary"
                    description="Awaiting action"
                />
                <StatCard
                    title="In Progress"
                    value={inProgressRequests}
                    icon={Clock}
                    variant="warning"
                    description="Being processed"
                />
                <StatCard
                    title="Completed"
                    value={completedRequests}
                    icon={CheckCircle}
                    variant="success"
                    description="Successfully processed"
                />
            </div>

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Requests</CardTitle>
                    <CardDescription>
                        Search, filter and manage ETC registration requests
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RequestListTableEnhanced
                        requests={requests}
                        officers={officers}
                        statuses={statuses}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
