"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { Check, X, Eye, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { approvePayment, rejectPayment } from "./actions"

export function PaymentListTable({ payments }: { payments: any[] }) {
    const router = useRouter()
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [approveOpen, setApproveOpen] = useState(false)
    const [rejectOpen, setRejectOpen] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState<any>(null)
    const [notes, setNotes] = useState("")
    const [rejectReason, setRejectReason] = useState("")
    const [loading, setLoading] = useState(false)

    const handleApprove = async () => {
        if (!selectedPayment) return
        setLoading(true)
        try {
            await approvePayment(selectedPayment.id, notes)
            toast.success("Payment approved")
            setApproveOpen(false)
            setNotes("")
            router.refresh() // Refresh server data
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
            router.refresh() // Refresh server data
        } catch (error: any) {
            toast.error(error.message || "Failed to reject payment")
        } finally {
            setLoading(false)
        }
    }

    const getMethodBadge = (method: string) => {
        const colors: Record<string, string> = {
            GOVPAY: "bg-blue-500",
            BANK_TRANSFER: "bg-green-500",
            IPG: "bg-purple-500",
            CASH: "bg-orange-500"
        }
        return <Badge className={colors[method] || ""}>{method}</Badge>
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            PENDING_REVIEW: "warning",
            COMPLETED: "default",
            REJECTED: "destructive",
            PENDING: "secondary"
        }
        return <Badge variant={variants[status] || "default"}>{status.replace('_', ' ')}</Badge>
    }

    return (
        <>
            <div className="border rounded-md">
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
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center text-muted-foreground">
                                    No payments found
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium">{payment.request.requestNo}</TableCell>
                                    <TableCell>{payment.request.applicantName}</TableCell>
                                    <TableCell>{payment.request.lpn}</TableCell>
                                    <TableCell>{payment.amount ? `Rs. ${payment.amount}` : '-'}</TableCell>
                                    <TableCell>{getMethodBadge(payment.method)}</TableCell>
                                    <TableCell className="max-w-[150px] truncate">{payment.reference || '-'}</TableCell>
                                    <TableCell>{format(new Date(payment.createdAt), 'MMM dd, yyyy')}</TableCell>
                                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => { setSelectedPayment(payment); setDetailsOpen(true); }} title="View Details">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {payment.status === 'PENDING_REVIEW' && (
                                                <>
                                                    <Button variant="ghost" size="sm" className="text-green-600" onClick={() => { setSelectedPayment(payment); setApproveOpen(true); }} title="Approve">
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => { setSelectedPayment(payment); setRejectOpen(true); }} title="Reject">
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
                                    <img src={selectedPayment.proofUrl} alt="Payment proof" className="mt-2 max-w-full h-auto border rounded" />
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
