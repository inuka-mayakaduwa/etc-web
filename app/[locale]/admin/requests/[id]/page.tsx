import { getRequestDetails } from "../actions"
import { hasPermission } from "@/lib/permissions"
import { auth } from "@/app/auth"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { ArrowLeft, User, MapPin, Calendar, Tag, Clock } from "lucide-react"
import Link from "next/link"
import { RequestActions } from "./components"
// Update import to include AdminProvisioningManagement
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

    // Debug: Log user permissions
    const allPerms = [
        'etc.requests.view',
        'etc.requests.approve_info',
        'etc.requests.review_info',
        'etc.requests.reject',
        'etc.requests.manage_tags',
        'etc.payment.verify'
    ]

    console.log('\n🔍 User Permissions Check for', session.user.email)
    for (const perm of allPerms) {
        const has = await hasPermission(session.user.id, perm)
        console.log(`  ${has ? '✅' : '❌'} ${perm}`)
    }
    console.log('\n')

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
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/requests">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{request.requestNo}</h2>
                        <p className="text-muted-foreground">
                            Request Details
                        </p>
                    </div>
                </div>
                {getStatusBadge(request.currentStatus)}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {/* Main Details */}
                <div className="md:col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Applicant Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Name</p>
                                    <p className="font-medium">{request.applicantName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">NIC/Passport</p>
                                    <p className="font-medium">{request.applicantNICOrPassport}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Mobile</p>
                                    <p className="font-medium">{request.applicantMobile}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium">{request.applicantEmail || 'N/A'}</p>
                                </div>
                            </div>

                            {request.companyName && (
                                <>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Company</p>
                                            <p className="font-medium">{request.companyName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">BRN</p>
                                            <p className="font-medium">{request.brn || 'N/A'}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Vehicle Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">License Plate</p>
                                    <p className="font-medium text-lg">{request.lpn}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Vehicle Type</p>
                                    <p className="font-medium">{request.vehicleType.label}</p>
                                </div>
                            </div>
                            {request.rfidValue && (
                                <div>
                                    <p className="text-sm text-muted-foreground">RFID Value</p>
                                    <p className="font-mono font-medium bg-muted px-2 py-1 rounded inline-block">
                                        {request.rfidValue}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Section */}
                    {request.paymentAttempts.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment History</CardTitle>
                                <CardDescription>
                                    {request.paymentAttempts.length} payment attempt(s)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {request.paymentAttempts.map((payment: any) => (
                                        <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                                            <div>
                                                <p className="font-medium">Attempt #{payment.attemptNo} - {payment.method}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {payment.amount && `Rs. ${payment.amount}`} • {format(new Date(payment.createdAt), 'PPP')}
                                                </p>
                                            </div>
                                            <Badge variant={
                                                payment.status === 'COMPLETED' ? 'default' :
                                                    payment.status === 'REJECTED' ? 'destructive' : 'secondary'
                                            }>
                                                {payment.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Admin Appointment Management - For Scheduled Appointments */}
                    {request.currentStatus.code === 'APPOINTMENT_SCHEDULED' && request.activeAppointmentAttempt && (
                        <AdminAppointmentManagement request={request} />
                    )}

                    {/* Admin Provisioning Management - For Pending Provisioning */}
                    {request.currentStatus.code === 'PENDING_PROVISIONING' && (
                        <AdminProvisioningManagement request={request} />
                    )}

                    {/* Admin Appointment Booking - For Awaiting Appointments */}
                    {request.currentStatus.code === 'AWAITING_APPOINTMENT' && request.preferredLocation && (
                        <AdminAppointmentBooking request={request} />
                    )}

                    {/* Appointment History */}
                    {request.appointmentAttempts && request.appointmentAttempts.length > 0 && (
                        <AppointmentHistory request={request} />
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-muted-foreground">Submitted</p>
                                    <p className="font-medium">{format(new Date(request.submittedAt), 'PPP')}</p>
                                </div>
                            </div>

                            {request.assignedOfficer && (
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-muted-foreground">Assigned To</p>
                                        <p className="font-medium">{request.assignedOfficer.name}</p>
                                    </div>
                                </div>
                            )}

                            {request.preferredLocation && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-muted-foreground">Preferred Location</p>
                                        <p className="font-medium">{request.preferredLocation.name}</p>
                                    </div>
                                </div>
                            )}

                            {request.rfidValue && (
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-muted-foreground">RFID Tag</p>
                                        <p className="font-mono text-xs">{request.rfidValue}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <RequestActions request={request} />
                </div>
            </div>
        </div>
    )
}
