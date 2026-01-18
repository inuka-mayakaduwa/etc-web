"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { Check, X, Eye, DollarSign, Search } from "lucide-react"
import { toast } from "sonner"
import { approvePayment, rejectPayment } from "./actions"
import { DataTableToolbar } from "@/components/admin/data-table-toolbar"
import { FilterPopover } from "@/components/admin/filter-popover"
import { EmptyState } from "@/components/admin/empty-state"

export function PaymentListTableEnhanced({ payments }: { payments: any[] }) {
    const router = useRouter()
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [approveOpen, setApproveOpen] = useState(false)
    const [rejectOpen, setRejectOpen] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState<any>(null)
    const [notes, setNotes] = useState("")
    const [rejectReason, setRejectReason] = useState("")
    const [loading, setLoading] = useState(false)

    // Filters
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [methodFilter, setMethodFilter] = useState<string>("all")

    const filteredPayments = useMemo(() => {
        return payments.filter((payment) => {
            const matchesSearch =
                payment.request.requestNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                payment.request.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                payment.request.lpn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (payment.reference || "").toLowerCase().includes(searchQuery.toLowerCase())

            const matchesStatus = statusFilter === "all" || payment.status === statusFilter
            const matchesMethod = methodFilter === "all" || payment.method === methodFilter

            return matchesSearch && matchesStatus && matchesMethod
        })
    }, [payments, searchQuery, statusFilter, methodFilter])

    const activeFilterCount =
        (statusFilter !== "all" ? 1 : 0) +
        (methodFilter !== "all" ? 1 : 0)

    const handleApprove = async () => {
        if (!selectedPayment) return
        setLoading(true)
        try {
            await approvePayment(selectedPayment.id, notes)
            toast.success("Payment approved")
            setApproveOpen(false)
            setNotes("")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to approve payment")
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async () => {
        if (!selectedPayment || !rejectReason.trim()) {
            toast.error("Rejection reason is required")
            return
        }
        setLoading(true)
        try {
            await rejectPayment(selectedPayment.id, rejectReason)
            toast.success("Payment rejected")
            setRejectOpen(false)
            setRejectReason("")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to reject payment")
        } finally {
            setLoading(false)
        }
    }

    const getMethodBadge = (method: string) => {
        const colors: Record<string, string> = {
            GOVPAY: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
            BANK_TRANSFER: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
            IPG: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
            CASH: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20"
        }
        return <Badge variant="outline" className={colors[method] || ""}>{method.replace('_', ' ')}</Badge>
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            PENDING_REVIEW: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
            COMPLETED: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
            REJECTED: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
            PENDING: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
        }
        return <Badge variant="outline" className={variants[status] || ""}>{status.replace('_', ' ')}</Badge>
    }

    const paymentMethods = useMemo(() => {
        const methods = new Set(payments.map(p => p.method))
        return Array.from(methods)
    }, [payments])

    return (
        <>
            <div className="space-y-4">
                <DataTableToolbar
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search by request no, applicant, LPN, or reference..."
                >
                    <FilterPopover activeCount={activeFilterCount} title="Filters">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium">Status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="REJECTED">Rejected</SelectItem>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-medium">Payment Method</Label>
                                <Select value={methodFilter} onValueChange={setMethodFilter}>
                                    <SelectTrigger className="h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Methods</SelectItem>
                                        {paymentMethods.map((method) => (
                                            <SelectItem key={method} value={method}>
                                                {method.replace('_', ' ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </FilterPopover>
                </DataTableToolbar>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Request No</TableHead>
                                <TableHead>Applicant</TableHead>
                                <TableHead>LPN</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-64">
                                        <EmptyState
                                            icon={DollarSign}
                                            title="No payments found"
                                            description={
                                                searchQuery || activeFilterCount > 0
                                                    ? "Try adjusting your search or filters."
                                                    : "There are no payment submissions yet."
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <TableRow key={payment.id} className="group">
                                        <TableCell className="font-medium">{payment.request.requestNo}</TableCell>
                                        <TableCell>{payment.request.applicantName}</TableCell>
                                        <TableCell>{payment.request.lpn}</TableCell>
                                        <TableCell className="font-medium">{payment.amount ? `Rs. ${payment.amount}` : '-'}</TableCell>
                                        <TableCell>{getMethodBadge(payment.method)}</TableCell>
                                        <TableCell className="max-w-[150px] truncate">{payment.reference || '-'}</TableCell>
                                        <TableCell>{format(new Date(payment.createdAt), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-1 justify-end">
                                                <Button variant="ghost" size="sm" onClick={() => { setSelectedPayment(payment); setDetailsOpen(true); }}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {payment.status === 'PENDING_REVIEW' && (
                                                    <>
                                                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => { setSelectedPayment(payment); setApproveOpen(true); }}>
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { setSelectedPayment(payment); setRejectOpen(true); }}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                        Showing {filteredPayments.length} of {payments.length} payments
                    </div>
                </div>
            </div>

            {/* Payment Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Payment Details</DialogTitle>
                    </DialogHeader>
                    {selectedPayment && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><strong>Request No:</strong> {selectedPayment.request.requestNo}</div>
                                <div><strong>Status:</strong> {getStatusBadge(selectedPayment.status)}</div>
                                <div><strong>Applicant:</strong> {selectedPayment.request.applicantName}</div>
                                <div><strong>Mobile:</strong> {selectedPayment.request.applicantMobile}</div>
                                <div><strong>Vehicle (LPN):</strong> {selectedPayment.request.lpn}</div>
                                <div><strong>Vehicle Type:</strong> {selectedPayment.request.vehicleType.label}</div>
                                <div><strong>Amount:</strong> Rs. {selectedPayment.amount || 'N/A'}</div>
                                <div><strong>Method:</strong> {getMethodBadge(selectedPayment.method)}</div>
                                <div><strong>Reference:</strong> {selectedPayment.reference || 'N/A'}</div>
                                <div><strong>Submitted:</strong> {format(new Date(selectedPayment.createdAt), 'PPP')}</div>
                                {selectedPayment.verifiedBy && (
                                    <>
                                        <div><strong>Verified By:</strong> {selectedPayment.verifiedBy.name}</div>
                                        <div><strong>Verified At:</strong> {format(new Date(selectedPayment.verifiedAt), 'PPP')}</div>
                                    </>
                                )}
                            </div>
                            {selectedPayment.proofUrl && (
                                <div>
                                    <strong>Payment Proof:</strong>
                                    <img src={selectedPayment.proofUrl} alt="Payment proof" className="mt-2 max-w-full h-auto border rounded-lg" />
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Payment</DialogTitle>
                        <DialogDescription>
                            Approving this payment will move the request to "Pending Information Review" status.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Notes (Optional)</Label>
                            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any notes about this approval..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveOpen(false)}>Cancel</Button>
                        <Button onClick={handleApprove} disabled={loading}>
                            {loading ? "Approving..." : "Approve Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Payment</DialogTitle>
                        <DialogDescription>
                            Rejecting this payment will return the request to "Pending Payment" status, allowing the customer to retry.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Rejection Reason *</Label>
                            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Enter reason for rejection..." required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={loading || !rejectReason.trim()}>
                            {loading ? "Rejecting..." : "Reject Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
