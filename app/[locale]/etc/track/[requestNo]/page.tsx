import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { AppointmentBooking, AppointmentDetails } from './components';

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
            <div className="container mx-auto py-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Request Not Found</h1>
                <p>Could not find a request with number: {requestNo}</p>
                <Link href="/etc/register">
                    <Button className="mt-4">Start New Registration</Button>
                </Link>
            </div>
        );
    }

    const status = request.currentStatus;
    const payment = request.activePaymentAttempt;

    // Find latest instruction comment
    const latestInstruction = request.comments.find(c => c.visibility === 'INTERNAL_AND_CUSTOMER');

    // Status Code Colors
    const getStatusColor = (code: string) => {
        if (code === 'PAYMENT_PENDING') return 'bg-blue-100 text-blue-700';
        if (code === 'PAYMENT_REVIEW') return 'bg-yellow-100 text-yellow-700';
        if (code === 'APPROVED') return 'bg-green-100 text-green-700';
        if (code === 'REJECTED') return 'bg-red-100 text-red-700';
        if (code === 'PENDING_INFORMATION_EDIT') return 'bg-orange-100 text-orange-700';
        return 'bg-gray-100 text-gray-700';
    };

    const isPaymentPending = status.code === 'PAYMENT_PENDING' || (payment && payment.status === 'PENDING');
    const isEditRequested = status.code === 'PENDING_INFORMATION_EDIT';

    // Serialize for client (convert Decimal to string)
    const serializedRequest = {
        ...request,
        activePaymentAttempt: request.activePaymentAttempt ? {
            ...request.activePaymentAttempt,
            amount: request.activePaymentAttempt.amount?.toString()
        } : null
    };

    return (
        <div className="container mx-auto max-w-4xl py-12 px-4">

            <div className="mb-6">
                <Link href="/etc/register" className="text-sm text-muted-foreground hover:text-primary flex items-center">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back to Registration
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Status Column */}
                <div className="md:col-span-2 space-y-6">
                    <Card className={`border-t-4 shadow ${isEditRequested ? 'border-t-orange-500' : 'border-t-blue-600'}`}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl mb-1">{request.requestNo}</CardTitle>
                                    <CardDescription>Registration Request for {request.lpn}</CardDescription>
                                </div>
                                <Badge className={getStatusColor(status.code)} variant="outline">
                                    {status.label || status.code}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className={`flex items-start gap-3 p-4 rounded-lg ${isEditRequested ? 'bg-orange-50' : 'bg-muted'}`}>
                                {status.code === 'PAYMENT_PENDING' ? (
                                    <AlertCircle className="text-blue-500 h-6 w-6 mt-0.5" />
                                ) : status.code === 'PAYMENT_REVIEW' ? (
                                    <Clock className="text-yellow-500 h-6 w-6 mt-0.5" />
                                ) : status.code === 'PENDING_INFORMATION_EDIT' ? (
                                    <RefreshCw className="text-orange-500 h-6 w-6 mt-0.5" />
                                ) : (
                                    <CheckCircle2 className="text-green-500 h-6 w-6 mt-0.5" />
                                )}
                                <div>
                                    <p className="font-medium">Current Status</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {status.code === 'PAYMENT_PENDING'
                                            ? 'We are waiting for your payment to proceed.'
                                            : status.code === 'PAYMENT_REVIEW'
                                                ? 'Your payment is being verified by our team.'
                                                : status.code === 'PENDING_INFORMATION_EDIT'
                                                    ? 'We need some corrections in your application.'
                                                    : 'Request is being reviewed.'}
                                    </p>

                                    {isEditRequested && latestInstruction && (
                                        <div className="mt-3 p-3 bg-white rounded border border-orange-200">
                                            <p className="text-xs font-semibold text-orange-800 uppercase mb-1">Instructions from Officer:</p>
                                            <p className="text-sm text-gray-800">{latestInstruction.comment}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Pending Action */}
                            {isPaymentPending && (
                                <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="text-sm text-blue-800">
                                        Action Required: Please complete the payment.
                                    </div>
                                    <Link href={`/etc/register/${requestNo}/payment`}>
                                        <Button size="sm">Pay Now</Button>
                                    </Link>
                                </div>
                            )}

                            {/* Edit Requested Action */}
                            {isEditRequested && (
                                <div className="border border-orange-200 bg-orange-50 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="text-sm text-orange-800">
                                        Action Required: Please update your application.
                                    </div>
                                    <Link href={`/etc/edit/${requestNo}`}>
                                        <Button size="sm" variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-100">
                                            Edit Application
                                        </Button>
                                    </Link>
                                </div>
                            )}

                        </CardContent>
                    </Card>

                    {/* Timeline / Additional Info Could go here */}
                </div>

                {/* Sidebar Details */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Request Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Applicant</p>
                                <p className="font-medium">{request.applicantName}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Vehicle Type</p>
                                <p className="font-medium">{request.vehicleType.label}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Location</p>
                                <p className="font-medium">{request.preferredLocation?.name}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Submitted At</p>
                                <p className="font-medium">{new Date(request.submittedAt).toLocaleDateString()}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {payment && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Payment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Method</span>
                                    <span className="font-medium">{payment.method}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Amount</span>
                                    <span className="font-medium">LKR {payment.amount?.toString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant="secondary" className="text-xs">{payment.status}</Badge>
                                </div>
                                {payment.reference && (
                                    <div className="pt-2 border-t mt-2">
                                        <p className="text-xs text-muted-foreground mb-1">Reference</p>
                                        <p className="font-mono bg-muted p-1 rounded text-center">{payment.reference}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Appointment Section - Scheduled */}
                    {status.code === 'APPOINTMENT_SCHEDULED' && request.activeAppointmentAttempt && (
                        <AppointmentDetails request={serializedRequest} />
                    )}

                    {/* Appointment Booking Section - Awaiting */}
                    {status.code === 'AWAITING_APPOINTMENT' && request.preferredLocation && (
                        <AppointmentBooking request={serializedRequest} />
                    )}
                </div>
            </div>
        </div>
    );
}
