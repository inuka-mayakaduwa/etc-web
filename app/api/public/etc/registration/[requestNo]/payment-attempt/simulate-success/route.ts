
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PaymentStatus } from '@prisma/client';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ requestNo: string }> }
) {
    try {
        const { requestNo } = await params;

        const request = await prisma.eTCRegistrationRequest.findUnique({
            where: { requestNo },
            include: { activePaymentAttempt: true }
        });

        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (!request.activePaymentAttemptId) {
            return NextResponse.json({ error: 'No active payment attempt' }, { status: 400 });
        }

        const validationStatus = await prisma.requestStatus.findUnique({
            where: { code: 'PENDING_INFORMATION_REVIEW' }
        });

        if (!validationStatus) {
            // Fallback to SUBMITTED if VALIDATION_PENDING doesn't exist? 
            // Or error. Better error to alert dev.
            return NextResponse.json({ error: 'Status VALIDATION_PENDING not found' }, { status: 500 });
        }

        await prisma.$transaction(async (tx) => {
            // Complete Attempt
            await tx.requestPaymentAttempt.update({
                where: { id: request.activePaymentAttemptId! },
                data: {
                    status: PaymentStatus.COMPLETED,
                    verifiedAt: new Date(),
                    // Auto-verify for IPG
                }
            });

            // Update Request Status
            await tx.eTCRegistrationRequest.update({
                where: { id: request.id },
                data: {
                    currentStatusId: validationStatus.id
                }
            });
        });

        return NextResponse.json({ message: 'Simulated Success' });

    } catch (error: any) {
        console.error('Simulate Success Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
