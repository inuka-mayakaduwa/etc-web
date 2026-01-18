import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

const paymentAttemptSchema = z.object({
    method: z.nativeEnum(PaymentMethod),
    amount: z.number().positive(),
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ requestNo: string }> }
) {
    try {
        const { requestNo } = await params;
        const body = await req.json();

        const result = paymentAttemptSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: 'Validation Error', details: result.error.format() },
                { status: 400 }
            );
        }
        const { method, amount } = result.data;

        const request = await prisma.eTCRegistrationRequest.findUnique({
            where: { requestNo },
        });

        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        // Determine next attempt number
        const lastAttempt = await prisma.requestPaymentAttempt.findFirst({
            where: { requestId: request.id },
            orderBy: { attemptNo: 'desc' }
        });
        const nextAttemptNo = (lastAttempt?.attemptNo || 0) + 1;

        // Transaction to create attempt and update request
        const newAttempt = await prisma.$transaction(async (tx) => {
            const attempt = await tx.requestPaymentAttempt.create({
                data: {
                    requestId: request.id,
                    attemptNo: nextAttemptNo,
                    method,
                    amount,
                    status: PaymentStatus.PENDING,
                }
            });

            // Update active pointer on request
            await tx.eTCRegistrationRequest.update({
                where: { id: request.id },
                data: { activePaymentAttemptId: attempt.id }
            });

            return attempt;
        });

        return NextResponse.json({
            attemptNo: newAttempt.attemptNo,
            method: newAttempt.method,
            status: newAttempt.status,
            instructions: "Please complete the payment and provide the reference."
        }, { status: 201 });

    } catch (error: any) {
        console.error('Create Payment Attempt Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
