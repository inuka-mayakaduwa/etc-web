import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { PaymentStatus } from '@prisma/client';

const declareSchema = z.object({
    reference: z.string().min(1, 'Reference is required'),
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ requestNo: string; attemptNo: string }> }
) {
    try {
        const { requestNo, attemptNo } = await params;
        const body = await req.json();

        const result = declareSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: 'Validation Error', details: result.error.format() },
                { status: 400 }
            );
        }
        const { reference } = result.data;
        const attemptNoInt = parseInt(attemptNo, 10);

        const request = await prisma.eTCRegistrationRequest.findUnique({
            where: { requestNo },
        });

        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        const attempt = await prisma.requestPaymentAttempt.findUnique({
            where: {
                requestId_attemptNo: {
                    requestId: request.id,
                    attemptNo: attemptNoInt
                }
            }
        });

        if (!attempt) {
            return NextResponse.json({ error: 'Payment attempt not found' }, { status: 404 });
        }

        // Ensure it's the active attempt?
        // User flow implies declaring the active one.
        // If user paid an old one, does it become active? 
        // For simplicity, we just allow declaring on the specific attempt. 
        // And if it's successful declare, we might want to ensure it IS active or make it active?
        // Let's stick to simple flow: just update it.

        // Look up 'PAYMENT_REVIEW' status for the request
        const reviewStatus = await prisma.requestStatus.findUnique({
            where: { code: 'PAYMENT_REVIEW' }
        });

        if (!reviewStatus) {
            return NextResponse.json({ error: 'Configuration Error: PAYMENT_REVIEW status missing' }, { status: 500 });
        }

        await prisma.$transaction(async (tx) => {
            // Update attempt
            await tx.requestPaymentAttempt.update({
                where: { id: attempt.id },
                data: {
                    reference,
                    status: PaymentStatus.PENDING_REVIEW, // or PAYMENT_REVIEW (enum mismatch in spec vs schema?)
                    // Schema has PENDING_REVIEW in PaymentStatus enum?
                    // Let's check schema.
                    // Schema: PaymentStatus { PENDING, PENDING_REVIEW, COMPLETED, ... }
                    // So PENDING_REVIEW is correct.
                    declaredAt: new Date(),
                }
            });

            // Update Request status
            await tx.eTCRegistrationRequest.update({
                where: { id: request.id },
                data: {
                    currentStatusId: reviewStatus.id
                }
            });
        });

        return NextResponse.json({
            status: 'PAYMENT_REVIEW', // User facing string
            message: 'Your payment has been submitted for review.'
        });

    } catch (error: any) {
        console.error('Declare Payment Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
