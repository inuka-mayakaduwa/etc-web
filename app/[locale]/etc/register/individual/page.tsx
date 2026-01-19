import { IndividualRegistrationForm } from '@/components/etc/registration/IndividualRegistrationForm';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic'; // Ensure we fetch fresh data if needed, or stick to static if data rarely changes.

export default async function IndividualRegistrationPage() {
    const vehicleTypes = await prisma.vehicleType.findMany({
        where: { active: true },
        select: { id: true, code: true, label: true },
    });

    const locations = await prisma.installationLocation.findMany({
        where: { active: true },
        select: { id: true, code: true, name: true }, // Map name to label
    });

    const formattedLocations = locations.map(l => ({
        id: l.id,
        code: l.code,
        label: l.name,
    }));

    return (
        <div className="container mx-auto py-12 px-4">
            <IndividualRegistrationForm
                vehicleTypes={vehicleTypes}
                locations={formattedLocations}
            />
        </div>
    );
}
