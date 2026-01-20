import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { EtcRequestType, RequestChannel, InstallationStatus } from '@prisma/client';

// Validation Schemas
const individualSchema = z.object({
    requestType: z.literal('NEW_INDIVIDUAL'),
    channel: z.nativeEnum(RequestChannel).default('WEB'),
    applicantName: z.string().min(1, 'Name is required'),
    applicantNICOrPassport: z.string().min(1, 'NIC/Passport is required'),
    applicantMobile: z.string().min(1, 'Mobile is required'),
    applicantEmail: z.string().email().optional().or(z.literal('')),
    applicantAddress: z.string().min(1, 'Address is required'),
    notifySMS: z.boolean().default(true),
    notifyEmail: z.boolean().default(false),
    lpn: z.string().min(1, 'LPN is required'),
    vehicleTypeCode: z.string().min(1, 'Vehicle Type is required'),
    preferredLocationCode: z.string().min(1, 'Location is required'),
});

const companySchema = z.object({
    requestType: z.literal('NEW_COMPANY'),
    channel: z.nativeEnum(RequestChannel).default('WEB'),
    applicantName: z.string().min(1, 'Representative Name is required'),
    applicantNICOrPassport: z.string().min(1, 'NIC/Passport is required'),
    applicantMobile: z.string().min(1, 'Mobile is required'),
    applicantEmail: z.string().email().optional().or(z.literal('')),
    applicantAddress: z.string().optional(),
    notifySMS: z.boolean().default(true),
    notifyEmail: z.boolean().default(false),
    companyName: z.string().min(1, 'Company Name is required'),
    brn: z.string().min(1, 'BRN is required'),
    companyAddress: z.string().optional(),
    lpn: z.string().min(1, 'LPN is required'),
    vehicleTypeCode: z.string().min(1, 'Vehicle Type is required'),
    preferredLocationCode: z.string().min(1, 'Location is required'),
});

const requestSchema = z.discriminatedUnion('requestType', [
    individualSchema,
    companySchema,
]);

async function generateRequestNo() {
    // rq-AB2AS format
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `RQ-${result}`;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = requestSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Validation Error', details: result.error.format() },
                { status: 400 }
            );
        }

        const data = result.data;

        // 1. Resolve Foreign Keys (VehicleType, InstallationLocation, Status)
        const vehicleType = await prisma.vehicleType.findUnique({
            where: { code: data.vehicleTypeCode },
        });

        if (!vehicleType) {
            return NextResponse.json(
                { error: 'Invalid Vehicle Type Code' },
                { status: 400 }
            );
        }

        const location = await prisma.installationLocation.findUnique({
            where: { code: data.preferredLocationCode },
        });

        if (!location) {
            return NextResponse.json(
                { error: 'Invalid Location Code' },
                { status: 400 }
            );
        }

        // Assume initial status is 'PAYMENT_PENDING' or similar. 
        // If not found, fall back to a default or error.
        let status = await prisma.requestStatus.findUnique({
            where: { code: 'PAYMENT_PENDING' },
        });

        // Fallback if PAYMENT_PENDING doesn't exist (e.g. might be initialized as SUBMITTED)
        if (!status) {
            status = await prisma.requestStatus.findUnique({
                where: { code: 'SUBMITTED' }
            });
        }

        if (!status) {
            return NextResponse.json(
                { error: 'Configuration Error: Initial Status not found' },
                { status: 500 }
            );
        }

        // 2. Generate Request No
        let requestNo = await generateRequestNo();
        // Check uniqueness (simplified loop)
        let exists = await prisma.eTCRegistrationRequest.findUnique({ where: { requestNo } });
        while (exists) {
            requestNo = await generateRequestNo();
            exists = await prisma.eTCRegistrationRequest.findUnique({ where: { requestNo } });
        }

        // 3. Create Request
        const newRequest = await prisma.eTCRegistrationRequest.create({
            data: {
                requestNo,
                requestType: data.requestType === 'NEW_INDIVIDUAL' ? EtcRequestType.NEW_INDIVIDUAL : EtcRequestType.NEW_COMPANY,
                channel: data.channel,
                applicantName: data.applicantName,
                applicantNICOrPassport: data.applicantNICOrPassport,
                applicantMobile: data.applicantMobile,
                applicantEmail: data.applicantEmail || null,
                applicantAddress: data.applicantAddress,
                notifySMS: data.notifySMS,
                notifyEmail: data.notifyEmail,
                lpn: data.lpn,
                vehicleTypeId: vehicleType.id,
                preferredLocationId: location.id,
                currentStatusId: status.id,

                // Company fields
                companyName: data.requestType === 'NEW_COMPANY' ? data.companyName : null,
                brn: data.requestType === 'NEW_COMPANY' ? data.brn : null,
                companyAddress: data.requestType === 'NEW_COMPANY' ? data.companyAddress : null,

                installationStatus: InstallationStatus.PENDING,
            },
        });

        return NextResponse.json({
            requestNo: newRequest.requestNo,
            status: status.code, // Return the actual status code used
        }, { status: 201 });

    } catch (error: any) {
        console.error('Registration Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', message: error.message },
            { status: 500 }
        );
    }
}
