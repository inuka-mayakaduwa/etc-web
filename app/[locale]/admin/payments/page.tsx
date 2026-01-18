import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPendingPayments, getPaymentsByStatus } from "./actions"
import { PaymentListTable } from "./components"
import { hasPermission } from "@/lib/permissions"
import { auth } from "@/app/auth"
import { redirect } from "next/navigation"

export default async function PaymentsPage() {
    const session = await auth()
    if (!session?.user?.id) {
        redirect("/admin/login")
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

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Payment Management</h2>
                    <p className="text-muted-foreground">
                        Review and verify payment submissions
                    </p>
                </div>
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
                            <PaymentListTable
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
                            <PaymentListTable
                                payments={allPayments}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
