import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPendingPayments, getPaymentsByStatus } from "./actions"
import { PaymentListTableEnhanced } from "./components"
import { hasPermission } from "@/lib/permissions"
import { auth } from "@/app/auth"
import { redirect } from "next/navigation"
import { StatCard } from "@/components/admin/stat-card"
import { DollarSign, Clock, CheckCircle, XCircle } from "lucide-react"

export default async function PaymentsPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/login")
    }

    const canView = await hasPermission(session.user.id, "etc.payment.view")
    if (!canView) {
        return (
            <div className="flex h-full items-center justify-center">
                <Card>
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You don't have permission to view payments.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const [pendingPayments, allPayments] = await Promise.all([
        getPendingPayments(),
        getPaymentsByStatus('ALL')
    ])

    // Calculate stats
    const completedPayments = allPayments.filter(p => p.status === 'COMPLETED').length
    const rejectedPayments = allPayments.filter(p => p.status === 'REJECTED').length

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
                    <p className="text-muted-foreground">
                        Review and verify payment submissions
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Payments"
                    value={allPayments.length}
                    icon={DollarSign}
                    variant="default"
                    description="All time"
                />
                <StatCard
                    title="Pending Review"
                    value={pendingPayments.length}
                    icon={Clock}
                    variant="warning"
                    description="Awaiting verification"
                />
                <StatCard
                    title="Approved"
                    value={completedPayments}
                    icon={CheckCircle}
                    variant="success"
                    description="Verified payments"
                />
                <StatCard
                    title="Rejected"
                    value={rejectedPayments}
                    icon={XCircle}
                    variant="danger"
                    description="Failed verification"
                />
            </div>

            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pending">
                        Pending Review ({pendingPayments.length})
                    </TabsTrigger>
                    <TabsTrigger value="all">All Payments</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Payment Reviews</CardTitle>
                            <CardDescription>
                                Payment submissions awaiting verification
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PaymentListTableEnhanced
                                payments={pendingPayments}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Payments</CardTitle>
                            <CardDescription>
                                Complete payment history
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PaymentListTableEnhanced
                                payments={allPayments}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
