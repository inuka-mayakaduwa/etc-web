"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { Eye, User, Calendar, Download } from "lucide-react"
import Link from "next/link"
import { DataTableToolbar } from "@/components/admin/data-table-toolbar"
import { FilterPopover } from "@/components/admin/filter-popover"
import { EmptyState } from "@/components/admin/empty-state"

interface RequestListTableEnhancedProps {
  requests: any[]
  statuses?: any[]
  officers?: any[]
  locations?: any[]
}

export function RequestListTableEnhanced({ 
  requests, 
  statuses = [],
  officers = [],
  locations = []
}: RequestListTableEnhancedProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [officerFilter, setOfficerFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      // Search filter
      const matchesSearch = 
        request.requestNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.lpn.toLowerCase().includes(searchQuery.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === "all" || request.currentStatus.category === statusFilter

      // Officer filter
      const matchesOfficer = 
        officerFilter === "all" || 
        (officerFilter === "unassigned" && !request.assignedOfficer) ||
        request.assignedOfficerId === officerFilter

      // Type filter
      const matchesType = typeFilter === "all" || request.requestType === typeFilter

      return matchesSearch && matchesStatus && matchesOfficer && matchesType
    })
  }, [requests, searchQuery, statusFilter, officerFilter, typeFilter])

  const activeFilterCount = 
    (statusFilter !== "all" ? 1 : 0) +
    (officerFilter !== "all" ? 1 : 0) +
    (typeFilter !== "all" ? 1 : 0)

  const getStatusBadge = (status: any) => {
    const categoryColors: Record<string, string> = {
      'OPEN': 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
      'IN_PROGRESS': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
      'DONE': 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
      'FAILED': 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
    }
    return (
      <Badge variant="outline" className={categoryColors[status.category] || 'bg-gray-100 text-gray-700'}>
        {status.label}
      </Badge>
    )
  }

  const requestTypes = useMemo(() => {
    const types = new Set(requests.map(r => r.requestType))
    return Array.from(types)
  }, [requests])

  return (
    <div className="space-y-4">
      <DataTableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by request no, applicant, or LPN..."
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
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Assigned Officer</Label>
              <Select value={officerFilter} onValueChange={setOfficerFilter}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Officers</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {officers.map((officer) => (
                    <SelectItem key={officer.id} value={officer.id}>
                      {officer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Request Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {requestTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FilterPopover>

        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DataTableToolbar>

      <div className="rounded-md border">
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64">
                  <EmptyState
                    icon={Eye}
                    title="No requests found"
                    description={
                      searchQuery || activeFilterCount > 0
                        ? "Try adjusting your search or filters to find what you're looking for."
                        : "There are no ETC registration requests yet."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id} className="group">
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
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <span>{request.assignedOfficer.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(request.submittedAt), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/requests/${request.id}`}>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {filteredRequests.length} of {requests.length} requests
        </div>
      </div>
    </div>
  )
}
