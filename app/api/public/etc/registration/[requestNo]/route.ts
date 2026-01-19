import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ requestNo: string }> }
) {
    try {
        const { requestNo } = await params;

        const request = await prisma.eTCRegistrationRequest.findUnique({
            where: { requestNo },
            include: {
                currentStatus: true,
                activePaymentAttempt: true,
                vehicleType: true,
                preferredLocation: true,
            },
        });

        if (!request) {
            return NextResponse.json(
                { error: 'Request not found' },
                { status: 404 }
            );
        }

        // Determine basic next action derived from state
        let nextAction = 'WAITING';
        const status = request.currentStatus.code;
        const payment = request.activePaymentAttempt;

        if (status === 'PAYMENT_PENDING') {
            nextAction = 'PAYMENT_REQUIRED';
        } else if (status === 'PAYMENT_REVIEW') {
            nextAction = 'WAITING_FOR_REVIEW';
        }

        return NextResponse.json({
            requestNo: request.requestNo,
            currentStatus: request.currentStatus.code,
            currentStatusLabel: request.currentStatus.label,

            applicantName: request.applicantName,
            lpn: request.lpn,
            vehicleType: request.vehicleType.code, // or label
            preferredLocation: request.preferredLocation?.code,

            activePaymentAttempt: payment ? {
                attemptNo: payment.attemptNo,
                method: payment.method,
                status: payment.status,
                reference: payment.reference,
                amount: payment.amount, // Decimal to string handling might be needed if strictly JSON
            } : null,

            nextAction,

            // Include minimal payment history if needed, but spec only asked for active
        });

    } catch (error: any) {
        console.error('Fetch Request Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
