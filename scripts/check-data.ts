import { prisma } from '@/lib/db';

async function checkAndSeed() {
    // 1. Check Statuses
    let sCount = await prisma.requestStatus.count();
    if (sCount === 0) {
        console.log('Seeding Statuses...');
        await prisma.requestStatus.createMany({
            data: [
                { code: 'SUBMITTED', label: 'Submitted', category: 'OPEN', orderIndex: 0 },
                { code: 'PAYMENT_PENDING', label: 'Payment Pending', category: 'OPEN', orderIndex: 1 },
                { code: 'PAYMENT_REVIEW', label: 'Payment Review', category: 'IN_PROGRESS', orderIndex: 2 },
                { code: 'APPROVED', label: 'Approved', category: 'DONE', orderIndex: 3 },
            ]
        });
        console.log('Statuses seeded.');
    }

    // 2. Check Vehicle Types
    let vCount = await prisma.vehicleType.count();
    if (vCount === 0) {
        console.log('Seeding Vehicle Types...');
        await prisma.vehicleType.createMany({
            data: [
                { code: 'CAR', label: 'Car/Jeep' },
                { code: 'VAN', label: 'Van' },
                { code: 'BUS', label: 'Bus' },
                { code: 'LORRY', label: 'Lorry/Truck' },
            ]
        });
        console.log('Vehicle Types seeded.');
    }

    // 3. Check Locations
    let lCount = await prisma.installationLocation.count();
    if (lCount === 0) {
        console.log('Seeding Locations...');
        await prisma.installationLocation.createMany({
            data: [
                { code: 'KADAWATHA', name: 'Kadawatha Interchange', address: 'Kadawatha' },
                { code: 'KOTTAWA', name: 'Kottawa Interchange', address: 'Kottawa' },
                { code: 'KERAWALAPITIYA', name: 'Kerawalapitiya Interchange', address: 'Kerawalapitiya' },
            ]
        });
        console.log('Locations seeded.');
    }

    console.log('Database Access OK. Data verified.');
}

checkAndSeed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
