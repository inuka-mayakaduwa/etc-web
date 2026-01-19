import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import path from "path";
import readline from "readline";
import { DEFINED_PERMISSIONS } from "../lib/permission-definitions";

// Load .env safely
dotenv.config({
    path: path.resolve(process.cwd(), ".env"),
});

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Check your .env file.");
}

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
    log: ["error", "warn"],
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function ask(query: string): Promise<string> {
    return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
    console.log("🌱 Start seeding...");

    // 1) Request Statuses
    console.log("1️⃣  Seeding Statuses...");
    const statuses = [
        // OPEN
        { code: "SUBMITTED", label: "Submitted", category: "OPEN", orderIndex: 1 },
        { code: "PAYMENT_PENDING", label: "Payment Pending", category: "OPEN", orderIndex: 2 },
        { code: "PAYMENT_REVIEW", label: "Payment Review", category: "OPEN", orderIndex: 3 },

        // IN_PROGRESS
        { code: "PENDING_INFORMATION_REVIEW", label: "Pending Information Review", category: "IN_PROGRESS", orderIndex: 10 },
        { code: "PENDING_INFORMATION_EDIT", label: "More Information Requested", category: "IN_PROGRESS", orderIndex: 11 },
        { code: "PENDING_TAG_CREATION", label: "Pending Tag Creation", category: "IN_PROGRESS", orderIndex: 12 },
        { code: "AWAITING_APPOINTMENT", label: "Awaiting Appointment", category: "IN_PROGRESS", orderIndex: 13 },
        { code: "APPOINTMENT_SCHEDULED", label: "Appointment Scheduled", category: "IN_PROGRESS", orderIndex: 14 },
        { code: "PENDING_PROVISIONING", label: "Pending Provisioning", category: "IN_PROGRESS", orderIndex: 15 },

        // DONE / FAILED
        { code: "COMPLETED", label: "Completed", category: "DONE", orderIndex: 90, isTerminal: true },
        { code: "REJECTED", label: "Rejected", category: "FAILED", orderIndex: 91, isTerminal: true },
        { code: "CANCELED", label: "Canceled", category: "FAILED", orderIndex: 92, isTerminal: true },
        { code: "PENDING_REFUND", label: "Pending Refund", category: "FAILED", orderIndex: 93 }, // Not terminal yet, needs refund action
    ];

    for (const s of statuses) {
        // Find existing by code to update it, or create new
        // Note: We use deleteMany + create or upsert. Upsert requires unique code.
        // If there are space-suffixed versions in DB, this upsert cleanly fixes/creates correct ones 
        // IF the script `fix-status.ts` wasn't run. But we want to be sure.
        // Actually, let's just Upsert.
        await prisma.requestStatus.upsert({
            where: { code: s.code },
            update: {
                label: s.label,
                category: s.category,
                orderIndex: s.orderIndex,
                isTerminal: s.isTerminal || false,
                active: true, // Reactivate if was disabled
            },
            create: s,
        });
    }
    console.log("   ✅ Statuses seeded.");

    // 2) Vehicle Types
    console.log("2️⃣  Seeding Vehicle Types...");
    const vehicleTypes = [
        { code: "CAR", label: "Car" },
        { code: "VAN", label: "Van" },
        { code: "BUS", label: "Bus" },
        { code: "LORRY", label: "Lorry" },
        { code: "THREE_WHEELER", label: "Three Wheeler" },
        { code: "BIKE", label: "Motor Bike" },
    ];

    for (const v of vehicleTypes) {
        await prisma.vehicleType.upsert({
            where: { code: v.code },
            update: { label: v.label },
            create: v,
        });
    }
    console.log("   ✅ Vehicle Types seeded.");

    // 3) Installation Location
    console.log("3️⃣  Seeding Installation Location...");
    await prisma.installationLocation.upsert({
        where: { code: "MAIN_BRANCH" },
        update: {},
        create: {
            code: "MAIN_BRANCH",
            name: "Main Branch (Colombo)",
            address: "123 Main St, Colombo 03",
            active: true,
        },
    });
    console.log("   ✅ Location seeded.");

    // 4) Roles & Permissions
    console.log("4️⃣  Seeding Roles & Permissions...");

    // Create Roles
    const roleSuperAdmin = await prisma.systemRole.upsert({
        where: { name: "SUPER_ADMIN" },
        update: {},
        create: { name: "SUPER_ADMIN" },
    });
    const roleOfficer = await prisma.systemRole.upsert({
        where: { name: "OFFICER" },
        update: {},
        create: { name: "OFFICER" },
    });
    const roleInstaller = await prisma.systemRole.upsert({
        where: { name: "INSTALLER" },
        update: {},
        create: { name: "INSTALLER" },
    });
    const roleFinance = await prisma.systemRole.upsert({
        where: { name: "FINANCE" },
        update: {},
        create: { name: "FINANCE" },
    });

    // Create a base set of permissions (Just a few important ones for demo)
    for (const p of DEFINED_PERMISSIONS) {
        const perm = await prisma.systemPermission.upsert({
            where: { node: p.node },
            update: { description: p.description },
            create: { node: p.node, description: p.description },
        });

        // Assign all to SUPER_ADMIN
        await prisma.systemRolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: roleSuperAdmin.id,
                    permissionId: perm.id
                }
            },
            update: {},
            create: {
                roleId: roleSuperAdmin.id,
                permissionId: perm.id
            }
        });
    }
    console.log("   ✅ Roles & Permissions seeded.");

    // 5) Super Admin User
    console.log("\n👤 Create Super Admin User");
    console.log("   Leave blank to skip user creation if sticking to existing users.\n");

    const name = await ask("   Enter Name (e.g. Super Admin): ");
    if (name.trim()) {
        const email = await ask("   Enter Email (e.g. admin@etc.gov.lk): ");
        const mobile = await ask("   Enter Mobile (e.g. 94771234567): ");

        if (!email || !mobile) {
            console.log("   ❌ Email and Mobile are required to create a user. Skipping.");
        } else {
            const user = await prisma.systemUser.upsert({
                where: { email },
                update: {
                    name,
                    mobile,
                },
                create: {
                    name,
                    email,
                    mobile,
                    active: true,
                },
            });

            // Assign Super Admin Role
            await prisma.systemUserRole.upsert({
                where: {
                    systemUserId_roleId: {
                        systemUserId: user.id,
                        roleId: roleSuperAdmin.id
                    }
                },
                update: {},
                create: {
                    systemUserId: user.id,
                    roleId: roleSuperAdmin.id
                }
            });

            console.log(`   ✅ User '${user.name}' created/updated and assigned SUPER_ADMIN.`);
        }
    } else {
        console.log("   ⏩ Skipping user creation.");
    }

    console.log("\n🌱 Seeding Complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        rl.close();
    });
