"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { addComment, updateRequestStatus, setRfidValue } from "../actions"
import { MessageSquare, Tag } from "lucide-react"

export function RequestActions({ request }: { request: any }) {
    const router = useRouter()
    const [commentOpen, setCommentOpen] = useState(false)
    const [rfidOpen, setRfidOpen] = useState(false)
    const [comment, setComment] = useState("")
    const [rfid, setRfid] = useState(request.rfidValue || "")
    const [loading, setLoading] = useState(false)

    // Debug logging
    console.log("Request Status:", request.currentStatus.code)
    console.log("Request Details:", request)
    console.log("Payment Attempts:", request.paymentAttempts)

    const handleStatusChange = async (newStatus: string, comment?: string) => {
        setLoading(true)
        try {
            await updateRequestStatus(request.id, newStatus, comment)
            toast.success("Status updated")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to update status")
        } finally {
            setLoading(false)
        }
    }

    const handleAddComment = async () => {
        if (!comment.trim()) {
            toast.error("Comment cannot be empty")
            return
        }
        setLoading(true)
        try {
            await addComment(request.id, comment, 'INTERNAL_ONLY')
            toast.success("Comment added")
            setCommentOpen(false)
            setComment("")
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to add comment")
        } finally {
            setLoading(false)
        }
    }

    const handleSetRfid = async () => {
        if (!rfid.trim()) {
            toast.error("RFID value required")
            return
        }
        setLoading(true)
        try {
            await setRfidValue(request.id, rfid)
            toast.success("RFID value updated")
            setRfidOpen(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to set RFID")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {/* Always show Add Comment */}
                    <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setCommentOpen(true)}
                    >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Add Comment
                    </Button>

                    {/* Show RFID button only for PENDING_TAG_CREATION */}
                    {request.currentStatus.code === 'PENDING_TAG_CREATION' && (
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => setRfidOpen(true)}
                        >
                            <Tag className="h-4 w-4 mr-2" />
                            {request.rfidValue ? 'Update RFID' : 'Set RFID Value'}
                        </Button>
                    )}

                    {/* Status-specific actions */}
                    {request.currentStatus.code === 'PENDING_INFORMATION_REVIEW' && (
                        <>
                            <div className="pt-2 pb-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase">Information Review</p>
                            </div>
                            <Button
                                onClick={() => handleStatusChange('PENDING_TAG_CREATION', 'Information verified and approved')}
                                className="w-full justify-start bg-green-600 hover:bg-green-700"
                            >
                                ✓ Verify Information
                            </Button>
                            <Button
                                onClick={() => {
                                    const comment = prompt("Enter instructions for the customer on what needs to be edited:")
                                    if (comment) {
                                        handleStatusChange('PENDING_INFORMATION_EDIT', comment)
                                    }
                                }}
                                variant="outline"
                                className="w-full justify-start"
                            >
                                ✏️ Propose Edit
                            </Button>
                            <Button
                                onClick={() => {
                                    const reason = prompt("Enter rejection reason (e.g., fraud, invalid documents):")
                                    if (!reason) return

                                    const hasCompletedPayment = request.paymentAttempts.some((p: any) => p.status === 'COMPLETED')

                                    if (hasCompletedPayment) {
                                        handleStatusChange('PENDING_REFUND', `Rejected: ${reason}. Refund required.`)
                                        toast.info("Request moved to Pending Refund. Complete refund process before final rejection.")
                                    } else {
                                        handleStatusChange('REJECTED', `Rejected: ${reason}`)
                                    }
                                }}
                                variant="destructive"
                                className="w-full justify-start"
                            >
                                ✕ Reject Completely
                            </Button>
                        </>
                    )}

                    {request.currentStatus.code === 'PENDING_TAG_CREATION' && (
                        <>
                            <div className="pt-2 pb-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase">Tag Creation</p>
                            </div>
                            <Button
                                onClick={() => handleStatusChange('AWAITING_APPOINTMENT', 'Tag ready')}
                                className="w-full justify-start"
                            >
                                Tag Ready → Awaiting Appointment
                            </Button>
                        </>
                    )}

                    {request.currentStatus.code === 'PENDING_INFORMATION_EDIT' && (
                        <div className="p-3 bg-blue-50 rounded text-sm text-blue-800">
                            Waiting for customer to submit corrections.
                        </div>
                    )}

                    {request.currentStatus.code === 'PENDING_REFUND' && (
                        <>
                            <div className="pt-2 pb-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase">Refund Processing</p>
                            </div>
                            <Button
                                onClick={() => {
                                    const refundNote = prompt("Enter refund details (method, reference number):")
                                    if (refundNote) {
                                        handleStatusChange('REJECTED', `Refund completed: ${refundNote}`)
                                    }
                                }}
                                className="w-full justify-start"
                            >
                                Mark Refund Complete → Rejected
                            </Button>
                            <Button
                                onClick={() => {
                                    const refundNote = prompt("Enter refund details (method, reference number):")
                                    if (refundNote) {
                                        handleStatusChange('CANCELED', `Refund completed: ${refundNote}`)
                                    }
                                }}
                                variant="outline"
                                className="w-full justify-start"
                            >
                                Mark Refund Complete → Canceled
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Add Comment Dialog */}
            <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Comment</DialogTitle>
                        <DialogDescription>
                            Add an internal note to this request
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <Label>Comment</Label>
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Enter your comment..."
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCommentOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddComment} disabled={loading}>
                            {loading ? "Adding..." : "Add Comment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Set RFID Dialog */}
            <Dialog open={rfidOpen} onOpenChange={setRfidOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{request.rfidValue ? 'Update' : 'Set'} RFID Value</DialogTitle>
                        <DialogDescription>
                            Enter the RFID tag value for this request
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <Label>RFID Value</Label>
                        <Input
                            value={rfid}
                            onChange={(e) => setRfid(e.target.value)}
                            placeholder="Enter RFID value..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRfidOpen(false)}>Cancel</Button>
                        <Button onClick={handleSetRfid} disabled={loading}>
                            {loading ? "Saving..." : "Save RFID"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
