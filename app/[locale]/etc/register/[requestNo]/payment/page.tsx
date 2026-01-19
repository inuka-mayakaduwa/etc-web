import { PaymentInterface } from '@/components/etc/payment/PaymentInterface';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function PaymentPage({
    params
}: {
    params: Promise<{ requestNo: string }>
}) {
    const { requestNo } = await params;

    const request = await prisma.eTCRegistrationRequest.findUnique({
        where: { requestNo },
        include: {
            activePaymentAttempt: true,
            vehicleType: true, // for summary
            preferredLocation: true, // for summary
            currentStatus: true,
        }
    });

    if (!request) {
        notFound();
    }

    // Pass data to Client Component for interactivity
    return (
        <div className="container mx-auto max-w-3xl py-12 px-4">
            <PaymentInterface request={request} />
        </div>
    );
}
