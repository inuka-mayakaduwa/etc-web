import { prisma } from '@/lib/db';

async function verifyApiFlow() {
    const baseUrl = 'http://localhost:3000/api/public/etc/registration';

    // 1. Create Request
    console.log('1. Creating Request...');
    const createRes = await fetch(`${baseUrl}/request`, {
        method: 'POST',
        body: JSON.stringify({
            requestType: 'NEW_INDIVIDUAL',
            channel: 'WEB',
            applicantName: 'Test User',
            applicantNICOrPassport: '123456789V',
            applicantMobile: '0771234567',
            lpn: `TEST-${Math.floor(Math.random() * 10000)}`,
            vehicleTypeCode: 'CAR',
            preferredLocationCode: 'KADAWATHA'
        })
    });

    if (!createRes.ok) {
        const txt = await createRes.text();
        throw new Error(`Create Failed: ${createRes.status} ${txt}`);
    }

    const createData = await createRes.json();
    const requestNo = createData.requestNo;
    console.log(`   Request Created: ${requestNo}, Status: ${createData.status}`);

    if (createData.status !== 'PAYMENT_PENDING' && createData.status !== 'SUBMITTED') {
        console.warn('   Warning: Status unexpected');
    }

    // 2. Create Payment Attempt
    console.log('2. Creating Payment Attempt...');
    const payRes = await fetch(`${baseUrl}/${requestNo}/payment-attempt`, {
        method: 'POST',
        body: JSON.stringify({
            method: 'BANK_TRANSFER',
            amount: 1000
        })
    });

    if (!payRes.ok) {
        throw new Error('Payment Attempt Failed');
    }
    const payData = await payRes.json();
    console.log(`   Attempt Created: #${payData.attemptNo}`);

    // 3. Declare Payment
    console.log('3. Declaring Payment...');
    const declareRes = await fetch(`${baseUrl}/${requestNo}/payment-attempt/${payData.attemptNo}/declare`, {
        method: 'POST',
        body: JSON.stringify({
            reference: 'REF-TEST-123'
        })
    });

    if (!declareRes.ok) {
        throw new Error('Declaration Failed');
    }
    const declareData = await declareRes.json();
    console.log(`   Declared. New Status: ${declareData.status}`);

    // 4. Verify Final State
    console.log('4. Verifying Final State via GET...');
    const getRes = await fetch(`${baseUrl}/${requestNo}`);
    const getData = await getRes.json();

    if (getData.currentStatus === 'PAYMENT_REVIEW' && getData.activePaymentAttempt.reference === 'REF-TEST-123') {
        console.log('✅ Flow Verified Successfully!');
    } else {
        console.error('❌ Verification Failed:', getData);
        process.exit(1);
    }
}

// Check if server is running?
// We can't easily check if localhost:3000 is running from inside here nicely without specific tools.
// But we assume the user has `pnpm dev` running (metadata said so).

verifyApiFlow()
    .catch((e) => {
        console.error('Test Error:', e);
        process.exit(1);
    });
