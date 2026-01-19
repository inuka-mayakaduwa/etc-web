import { prisma } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { IndividualEditForm } from '@/components/etc/registration/IndividualEditForm';

export const dynamic = 'force-dynamic';

export default async function EditRequestPage({
    params
}: {
    params: Promise<{ requestNo: string }>
}) {
    const { requestNo } = await params;

    const request = await prisma.eTCRegistrationRequest.findUnique({
        where: { requestNo },
        include: {
            currentStatus: true,
            vehicleType: true,
            preferredLocation: true,
        }
    });

    if (!request) notFound();

    // Check status
    if (request.currentStatus.code !== 'PENDING_INFORMATION_EDIT') {
        // If not editable, redirect back to tracking
        redirect(`/etc/track/${requestNo}`);
    }

    // Fetch options
    const vehicleTypes = await prisma.vehicleType.findMany({
        where: { active: true },
        select: { id: true, code: true, label: true },
    });

    const locations = await prisma.installationLocation.findMany({
        where: { active: true },
        select: { id: true, code: true, name: true },
    });

    const formattedLocations = locations.map(l => ({
        id: l.id,
        code: l.code,
        label: l.name,
    }));

    // Prepare initial values
    const initialValues = {
        applicantName: request.applicantName,
        applicantNICOrPassport: request.applicantNICOrPassport,
        applicantMobile: request.applicantMobile,
        applicantEmail: request.applicantEmail,
        lpn: request.lpn,
        vehicleTypeCode: request.vehicleType.code, // Code is needed for select
        preferredLocationCode: request.preferredLocation?.code,
        notifySMS: request.notifySMS,
        notifyEmail: request.notifyEmail,
    };

    // Note: Currently supporting Individual form edits only.
    // If requestType is COMPANY, we might need a CompanyEditForm.
    // Assuming Individual for this step as per plan.

    return (
        <div className="container mx-auto py-12 px-4">
            <IndividualEditForm
                requestId={request.id}
                requestNo={request.requestNo}
                initialValues={initialValues}
                vehicleTypes={vehicleTypes}
                locations={formattedLocations}
            />
        </div>
    );
}
