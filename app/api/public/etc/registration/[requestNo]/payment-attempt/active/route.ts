
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PaymentStatus } from '@prisma/client';

export async function DELETE(
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
            return NextResponse.json({ message: 'No active payment attempt to cancel' }, { status: 200 });
        }

        const activeAttempt = request.activePaymentAttempt;

        // If explicitly cancelling, we might want to ensure it's in a cancellable state (e.g. PENDING)
        // If it's already COMPLETED or APPROVED, we shouldn't cancel it easily.
        if (activeAttempt?.status !== PaymentStatus.PENDING) {
            return NextResponse.json({ error: 'Cannot cancel payment attempt that is not PENDING' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            // Update attempt status
            await tx.requestPaymentAttempt.update({
                where: { id: request.activePaymentAttemptId! },
                data: {
                    status: PaymentStatus.CANCELLED
                }
            });

            // Clear active pointer on request
            await tx.eTCRegistrationRequest.update({
                where: { id: request.id },
                data: { activePaymentAttemptId: null }
            });
        });

        return NextResponse.json({ message: 'Payment attempt cancelled' });

    } catch (error: any) {
        console.error('Cancel Payment Attempt Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
