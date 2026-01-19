import { CompanyRegistrationForm } from '@/components/etc/registration/CompanyRegistrationForm';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CompanyRegistrationPage() {
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

    return (
        <div className="container mx-auto py-12 px-4">
            <CompanyRegistrationForm
                vehicleTypes={vehicleTypes}
                locations={formattedLocations}
            />
        </div>
    );
}
