import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle, RefreshCw, FileText, MapPin, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { AppointmentBooking, AppointmentDetails, CollapsibleSection } from './components';

export const dynamic = 'force-dynamic';

export default async function TrackingPage({
    params
}: {
    params: Promise<{ requestNo: string }>
}) {
    const { requestNo } = await params;

    const request = await prisma.eTCRegistrationRequest.findUnique({
        where: { requestNo },
        include: {
            currentStatus: true,
            activePaymentAttempt: true,
            activeAppointmentAttempt: {
                include: {
                    location: true
                }
            },
            vehicleType: true,
            preferredLocation: true,
            comments: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!request) {
        return (
            <main className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="text-center space-y-6">
                    <h1 className="text-3xl font-bold">Request Not Found</h1>
                    <p className="text-muted-foreground">Could not find a request with number: {requestNo}</p>
                    <Link href="/etc/register">
                        <Button size="lg">Start New Registration</Button>
                    </Link>
                </div>
            </main>
        );
    }

    const status = request.currentStatus;
    const payment = request.activePaymentAttempt;
    const latestInstruction = request.comments.find(c => c.visibility === 'INTERNAL_AND_CUSTOMER');
    const isPaymentPending = status.code === 'PAYMENT_PENDING' || (payment && payment.status === 'PENDING');
    const isPaymentCompleted = payment && payment.status === 'COMPLETED';
    const isEditRequested = status.code === 'PENDING_INFORMATION_EDIT';
    const hasActions = isPaymentPending || isEditRequested;

    const getStatusColor = (code: string) => {
        switch (code) {
            case 'SUBMITTED':
                return 'bg-slate-50 text-slate-900 border-slate-200';
            case 'PAYMENT_PENDING':
                return 'bg-blue-50 text-blue-900 border-blue-200';
            case 'PAYMENT_REVIEW':
            case 'PENDING_INFORMATION_REVIEW':
                return 'bg-amber-50 text-amber-900 border-amber-200';
            case 'PENDING_INFORMATION_EDIT':
                return 'bg-orange-50 text-orange-900 border-orange-200';
            case 'PENDING_TAG_CREATION':
                return 'bg-purple-50 text-purple-900 border-purple-200';
            case 'AWAITING_APPOINTMENT':
            case 'APPOINTMENT_SCHEDULED':
                return 'bg-indigo-50 text-indigo-900 border-indigo-200';
            case 'COMPLETED':
            case 'APPROVED': // Handle legacy/alternate code if needed
                return 'bg-green-50 text-green-900 border-green-200';
            case 'REJECTED':
            case 'CANCELED':
            case 'PENDING_REFUND':
                return 'bg-red-50 text-red-900 border-red-200';
            default:
                return 'bg-slate-50 text-slate-900 border-slate-200';
        }
    };

    const getStatusIcon = (code: string) => {
        switch (code) {
            case 'SUBMITTED':
                return <FileText className="h-5 w-5 text-slate-600" aria-hidden="true" />;
            case 'PAYMENT_PENDING':
                return <AlertCircle className="h-5 w-5 text-blue-600" aria-hidden="true" />;
            case 'PAYMENT_REVIEW':
            case 'PENDING_INFORMATION_REVIEW':
                return <Clock className="h-5 w-5 text-amber-600" aria-hidden="true" />;
            case 'PENDING_INFORMATION_EDIT':
                return <RefreshCw className="h-5 w-5 text-orange-600" aria-hidden="true" />;
            case 'PENDING_TAG_CREATION':
                return <RefreshCw className="h-5 w-5 text-purple-600" aria-hidden="true" />;
            case 'AWAITING_APPOINTMENT':
            case 'APPOINTMENT_SCHEDULED':
                return <CalendarIcon className="h-5 w-5 text-indigo-600" aria-hidden="true" />;
            case 'COMPLETED':
            case 'APPROVED':
                return <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />;
            case 'REJECTED':
            case 'CANCELED':
            case 'PENDING_REFUND':
                return <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />;
            default:
                return <Clock className="h-5 w-5 text-slate-600" aria-hidden="true" />;
        }
    };

    const getStatusMessage = (code: string) => {
        switch (code) {
            case 'SUBMITTED':
                return 'Application submitted. We are processing your request.';
            case 'PAYMENT_PENDING':
                return 'Payment is awaiting. Please complete payment to proceed.';
            case 'PAYMENT_REVIEW':
                return 'Your payment is being verified by our team.';
            case 'PENDING_INFORMATION_REVIEW':
                return 'We have received your details and are reviewing them.';
            case 'PENDING_INFORMATION_EDIT':
                return 'Updates needed. Please review and edit your application details.';
            case 'PENDING_TAG_CREATION':
                return 'Your vehicle tag is being prepared.';
            case 'AWAITING_APPOINTMENT':
                return 'Application approved. Please schedule an installation appointment.';
            case 'APPOINTMENT_SCHEDULED':
                return 'Appointment confirmed. Please arrive at the center on time.';
            case 'COMPLETED':
            case 'APPROVED':
                return 'Your registration has been approved and completed!';
            case 'REJECTED':
                return 'Your application was not approved. Please contact support for details.';
            case 'CANCELED':
                return 'This application has been canceled.';
            case 'PENDING_REFUND':
                return 'Refund processing in progress.';
            default:
                return 'Status information currently unavailable.';
        }
    };

    const serializedRequest = {
        ...request,
        activePaymentAttempt: request.activePaymentAttempt ? {
            ...request.activePaymentAttempt,
            amount: request.activePaymentAttempt.amount?.toString()
        } : null
    };

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto max-w-3xl px-4 py-4 md:py-8">

                {/* Header Section - Compact */}
                <header className="mb-6">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">{request.requestNo}</h1>
                            <p className="text-muted-foreground text-sm">Vehicle: <span className="font-medium text-foreground">{request.lpn}</span></p>
                        </div>
                        <Badge variant="outline" className={`px-3 py-1.5 text-xs md:text-sm font-semibold border ${getStatusColor(status.code)}`}>
                            {status.label || status.code}
                        </Badge>
                    </div>
                </header>

                {/* Status Context - Always Prominent */}
                <section className="mb-6" aria-label="Status information">
                    <div className={`rounded-lg border-2 p-4 ${getStatusColor(status.code)}`}>
                        <div className="flex gap-3 items-start">
                            {getStatusIcon(status.code)}
                            <div className="flex-1">
                                <h2 className="font-semibold text-sm md:text-base">
                                    {status.label || status.code}
                                </h2>
                                <p className="text-xs md:text-sm mt-2">
                                    {getStatusMessage(status.code)}
                                </p>
                                {isEditRequested && latestInstruction && (
                                    <div className="mt-3 p-2 bg-white/50 rounded text-xs">
                                        <p className="font-semibold mb-1">Officer Notes:</p>
                                        <p>{latestInstruction.comment}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Highlighted CTA Section - Only if action needed */}
                {hasActions && (
                    <section className="mb-6" aria-label="Required actions">
                        <div className="space-y-3">
                            {isPaymentPending && (
                                <Link href={`/etc/register/${requestNo}/payment`}>
                                    <Button size="lg" className="w-full text-base font-semibold py-6">
                                        Complete Payment Now
                                    </Button>
                                </Link>
                            )}
                            {isEditRequested && (
                                <Link href={`/etc/edit/${requestNo}`}>
                                    <Button size="lg" variant="outline" className="w-full text-base font-semibold py-6 bg-transparent">
                                        Update Application
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </section>
                )}

                {/* Main Content Sections - Collapsible */}
                <div className="space-y-4">

                    {/* Quick Details - Always Visible */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Request Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Applicant</p>
                                    <p className="font-medium mt-1">{request.applicantName}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Vehicle</p>
                                    <p className="font-medium mt-1">{request.vehicleType.label}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Location</p>
                                    <p className="font-medium mt-1">{request.preferredLocation?.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Submitted</p>
                                    <p className="text-xs font-medium mt-1">{new Date(request.submittedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appointment Priority Sections */}
                    {status.code === 'APPOINTMENT_SCHEDULED' && request.activeAppointmentAttempt && (
                        <AppointmentDetails request={serializedRequest} />
                    )}

                    {status.code === 'AWAITING_APPOINTMENT' && request.preferredLocation && (
                        <AppointmentBooking request={serializedRequest} />
                    )}

                    {/* Payment Details - Collapsible if Completed */}
                    {payment && isPaymentCompleted && (
                        <CollapsibleSection title="Payment Details" defaultOpen={false}>
                            <div className="space-y-3 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Method</p>
                                        <p className="font-medium mt-1">{payment.method}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Amount</p>
                                        <p className="font-medium mt-1">LKR {payment.amount?.toString()}</p>
                                    </div>
                                </div>
                                <div className="pt-3 border-t">
                                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Status</p>
                                    <Badge variant="secondary" className="text-xs">Completed</Badge>
                                </div>
                                {payment.reference && (
                                    <div className="pt-3 border-t">
                                        <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Reference</p>
                                        <code className="block bg-muted p-2 rounded text-center text-xs font-mono break-all">{payment.reference}</code>
                                    </div>
                                )}
                            </div>
                        </CollapsibleSection>
                    )}

                    {/* Payment Details - Always Visible if Pending */}
                    {payment && isPaymentPending && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-4 w-4" aria-hidden="true" />
                                    Payment Due
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Amount</p>
                                        <p className="font-semibold mt-1 text-base">LKR {payment.amount?.toString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase">Method</p>
                                        <p className="font-medium mt-1">{payment.method}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                </div>

            </div>
        </main>
    );
}
