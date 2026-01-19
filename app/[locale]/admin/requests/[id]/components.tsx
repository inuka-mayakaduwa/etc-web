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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { addComment, updateRequestStatus, setRfidValue } from "../actions"
import { MessageSquare, Tag, MoreVertical, UserPlus, CheckCircle, XCircle, Edit, AlertCircle } from "lucide-react"
import { format } from "date-fns"

export function RequestActions({ request }: { request: any }) {
    const router = useRouter()
    const [commentOpen, setCommentOpen] = useState(false)
    const [rfidOpen, setRfidOpen] = useState(false)
    const [comment, setComment] = useState("")
    const [rfid, setRfid] = useState(request.rfidValue || "")
    const [loading, setLoading] = useState(false)

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
            <div className="flex items-center gap-2">
                <Button
                    onClick={() => setCommentOpen(true)}
                    variant="outline"
                >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Comment
                </Button>

                {request.currentStatus.code === 'PENDING_TAG_CREATION' && (
                    <Button
                        onClick={() => setRfidOpen(true)}
                        variant="outline"
                    >
                        <Tag className="h-4 w-4 mr-2" />
                        {request.rfidValue ? 'Update RFID' : 'Set RFID'}
                    </Button>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {request.currentStatus.code === 'PENDING_TAG_CREATION' && request.rfidValue && (
                            <DropdownMenuItem onClick={() => handleStatusChange('AWAITING_APPOINTMENT')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Move to Awaiting Appointment
                            </DropdownMenuItem>
                        )}

                        {request.currentStatus.code === 'PENDING_INFORMATION_REVIEW' && (
                            <>
                                <DropdownMenuItem onClick={() => handleStatusChange('PENDING_TAG_CREATION')}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve Information
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    const reason = prompt("Enter reason for requesting edits:")
                                    if (reason) handleStatusChange('PENDING_INFORMATION_EDIT', reason)
                                }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Request Edits
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    const reason = prompt("Enter reason for rejection:")
                                    if (reason) handleStatusChange('PENDING_REFUND', reason)
                                }} className="text-destructive">
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject Request
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Add Comment Dialog */}
            <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Comment</DialogTitle>
                        <DialogDescription>
                            Add an internal note about this request
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Comment</Label>
                            <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Enter your comment..."
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCommentOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddComment} disabled={loading || !comment.trim()}>
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
                            Enter the RFID tag value for this vehicle
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>RFID Value</Label>
                            <Input
                                value={rfid}
                                onChange={(e) => setRfid(e.target.value)}
                                placeholder="Enter RFID value..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRfidOpen(false)}>Cancel</Button>
                        <Button onClick={handleSetRfid} disabled={loading || !rfid.trim()}>
                            {loading ? "Saving..." : request.rfidValue ? 'Update RFID' : 'Set RFID'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export function ActivityTimeline({ auditLogs }: { auditLogs: any[] }) {
    const getActionIcon = (action: string) => {
        switch (action) {
            case 'STATUS_CHANGED':
                return <CheckCircle className="h-4 w-4" />
            case 'ASSIGNED_CHANGED':
                return <UserPlus className="h-4 w-4" />
            case 'REQUEST_UPDATED':
                return <Edit className="h-4 w-4" />
            default:
                return <AlertCircle className="h-4 w-4" />
        }
    }

    const getActionColor = (action: string) => {
        switch (action) {
            case 'STATUS_CHANGED':
                return 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
            case 'ASSIGNED_CHANGED':
                return 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
            case 'REQUEST_UPDATED':
                return 'bg-green-500/10 text-green-700 dark:text-green-400'
            default:
                return 'bg-gray-500/10 text-gray-700 dark:text-gray-400'
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
                {auditLogs.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                    </div>
                ) : (
                    <div className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:bg-border">
                        {auditLogs.map((log: any, index: number) => (
                            <div key={log.id} className="relative flex gap-4 pl-8">
                                <div className={`absolute left-0 p-2 rounded-full ${getActionColor(log.action)}`}>
                                    {getActionIcon(log.action)}
                                </div>
                                <div className="flex-1 pb-4">
                                    <div className="flex items-start justify-between mb-1">
                                        <div>
                                            <p className="font-medium text-sm">
                                                {log.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                by {log.doneBy.name} • {format(new Date(log.doneAt), 'PPp')}
                                            </p>
                                        </div>
                                    </div>
                                    {log.oldData && (
                                        <div className="mt-2 text-sm">
                                            {log.oldData.statusCode && log.newData.statusCode && (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {log.oldData.statusCode}
                                                    </Badge>
                                                    <span className="text-muted-foreground">→</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {log.newData.statusCode}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
