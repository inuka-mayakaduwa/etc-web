"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Eye, User } from "lucide-react"
import Link from "next/link"

export function RequestListTable({ requests }: { requests: any[] }) {
    const router = useRouter()

    const getStatusBadge = (status: any) => {
        const categoryColors: Record<string, string> = {
            'OPEN': 'bg-blue-100 text-blue-700',
            'IN_PROGRESS': 'bg-yellow-100 text-yellow-700',
            'DONE': 'bg-green-100 text-green-700',
            'FAILED': 'bg-red-100 text-red-700'
        }
        return (
            <Badge className={categoryColors[status.category] || 'bg-gray-100 text-gray-700'}>
                {status.label}
            </Badge>
        )
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Request No</TableHead>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Vehicle (LPN)</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Officer</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                                No requests found
                            </TableCell>
                        </TableRow>
                    ) : (
                        requests.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell className="font-medium">{request.requestNo}</TableCell>
                                <TableCell>{request.applicantName}</TableCell>
                                <TableCell>
                                    <div>
                                        <div className="font-medium">{request.lpn}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {request.vehicleType.label}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{request.requestType}</Badge>
                                </TableCell>
                                <TableCell>{getStatusBadge(request.currentStatus)}</TableCell>
                                <TableCell>
                                    {request.assignedOfficer ? (
                                        <div className="flex items-center gap-1 text-sm">
                                            <User className="h-3 w-3" />
                                            {request.assignedOfficer.name}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Unassigned</span>
                                    )}
                                </TableCell>
                                <TableCell>{format(new Date(request.submittedAt), 'MMM dd, yyyy')}</TableCell>
                                <TableCell>
                                    <Link href={`/admin/requests/${request.id}`}>
                                        <Button variant="ghost" size="sm" title="View Details">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
