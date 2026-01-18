import { getRequestDetails } from "../actions"
import { hasPermission } from "@/lib/permissions"
import { auth } from "@/app/auth"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { ArrowLeft, User, MapPin, Calendar, Tag, Clock, FileText, CreditCard, Building, Phone, Mail, History, MessageSquare } from "lucide-react"
import Link from "next/link"
import { RequestActions, ActivityTimeline } from "./components"
import { AdminAppointmentBooking, AdminAppointmentManagement, AppointmentHistory, AdminProvisioningManagement } from "./appointmentComponents"

export default async function RequestDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

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
                    </CardHeader>
                </Card>
            </div>
        )
    }

    const request = await getRequestDetails(id)
    if (!request) {
        notFound()
    }

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/requests">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{request.requestNo}</h1>
                            {getStatusBadge(request.currentStatus)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Submitted {format(new Date(request.submittedAt), 'PPP')} • {request.applicantName}
                        </p>
                    </div>
                </div>
                <RequestActions request={request} />
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Request Type</p>
                                <p className="font-semibold">{request.requestType}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Assigned To</p>
                                <p className="font-semibold">{request.assignedOfficer?.name || 'Unassigned'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                <MapPin className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Location</p>
                                <p className="font-semibold">{request.preferredLocation?.name || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <Tag className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">RFID Status</p>
                                <p className="font-semibold">{request.rfidValue ? 'Assigned' : 'Pending'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">
                        <FileText className="h-4 w-4 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="payments">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Payments ({request.paymentAttempts.length})
                    </TabsTrigger>
                    {request.appointmentAttempts?.length > 0 && (
                        <TabsTrigger value="appointments">
                            <Calendar className="h-4 w-4 mr-2" />
                            Appointments ({request.appointmentAttempts.length})
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="activity">
                        <History className="h-4 w-4 mr-2" />
                        Activity
                    </TabsTrigger>
                    <TabsTrigger value="comments">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Comments ({request.comments?.length || 0})
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Applicant Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Applicant Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                                        <p className="font-medium">{request.applicantName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">NIC/Passport</p>
                                        <p className="font-medium font-mono text-sm">{request.applicantNICOrPassport}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">Mobile</p>
                                            <p className="font-medium">{request.applicantMobile}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">Email</p>
                                            <p className="font-medium">{request.applicantEmail || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                {request.companyName && (
                                    <>
                                        <Separator />
                                        <div className="flex items-center gap-2">
                                            <Building className="h-4 w-4 text-muted-foreground" />
                                            <div className="flex-1">
                                                <p className="text-xs text-muted-foreground">Company</p>
                                                <p className="font-medium">{request.companyName}</p>
                                                {request.brn && (
                                                    <p className="text-xs text-muted-foreground">BRN: {request.brn}</p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Vehicle Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5" />
                                    Vehicle Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">License Plate Number</p>
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border-2 border-border">
                                            <span className="font-bold text-2xl tracking-wider">{request.lpn}</span>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Vehicle Type</p>
                                        <Badge variant="outline" className="font-medium">
                                            {request.vehicleType.label}
                                        </Badge>
                                    </div>

                                    {request.rfidValue && (
                                        <>
                                            <Separator />
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">RFID Tag Value</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="px-3 py-1.5 rounded bg-green-500/10 text-green-700 dark:text-green-400 font-mono text-sm border border-green-500/20">
                                                        {request.rfidValue}
                                                    </code>
                                                    <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                                                        Active
                                                    </Badge>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Appointment Management Sections */}
                    {request.currentStatus.code === 'APPOINTMENT_SCHEDULED' && request.activeAppointmentAttempt && (
                        <AdminAppointmentManagement request={request} />
                    )}

                    {request.currentStatus.code === 'PENDING_PROVISIONING' && (
                        <AdminProvisioningManagement request={request} />
                    )}

                    {request.currentStatus.code === 'AWAITING_APPOINTMENT' && request.preferredLocation && (
                        <AdminAppointmentBooking request={request} />
                    )}
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription>
                                {request.paymentAttempts.length} payment attempt(s) recorded
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {request.paymentAttempts.length === 0 ? (
                                <div className="text-center py-12">
                                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-sm text-muted-foreground">No payment attempts yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {request.paymentAttempts.map((payment: any) => (
                                        <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-semibold">Attempt #{payment.attemptNo}</p>
                                                    <Badge variant="outline">{payment.method.replace('_', ' ')}</Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    {payment.amount && (
                                                        <span className="font-medium">Rs. {payment.amount}</span>
                                                    )}
                                                    <span>{format(new Date(payment.createdAt), 'PPP')}</span>
                                                    {payment.reference && (
                                                        <span className="font-mono text-xs">Ref: {payment.reference}</span>
                                                    )}
                                                </div>
                                                {payment.verifiedBy && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Verified by {payment.verifiedBy.name} on {format(new Date(payment.verifiedAt), 'PPP')}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant={
                                                payment.status === 'COMPLETED' ? 'default' :
                                                    payment.status === 'REJECTED' ? 'destructive' : 'secondary'
                                            }>
                                                {payment.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Appointments Tab */}
                {request.appointmentAttempts?.length > 0 && (
                    <TabsContent value="appointments" className="space-y-4">
                        <AppointmentHistory request={request} />
                    </TabsContent>
                )}

                {/* Activity Tab */}
                <TabsContent value="activity" className="space-y-4">
                    <ActivityTimeline auditLogs={request.auditLogs || []} />
                </TabsContent>

                {/* Comments Tab */}
                <TabsContent value="comments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Comments & Notes</CardTitle>
                            <CardDescription>
                                Internal notes and customer-facing comments
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!request.comments || request.comments.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-sm text-muted-foreground">No comments yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {request.comments.map((comment: any) => (
                                        <div key={comment.id} className="border-l-4 border-primary/20 pl-4 py-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <span className="text-xs font-semibold text-primary">
                                                            {comment.createdBy.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{comment.createdBy.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(new Date(comment.createdAt), 'PPp')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    {comment.visibility === 'INTERNAL_AND_CUSTOMER' ? 'Customer Visible' : 'Internal Only'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm">{comment.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
