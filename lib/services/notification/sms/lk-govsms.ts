import { SmsPayload, SmsProvider } from "../types";

export class GovSmsProvider implements SmsProvider {
    private host: string;
    private sidCode: string;
    private user: string;
    private pass: string;

    constructor() {
        this.host = process.env.SMS_HOST || "";
        this.sidCode = process.env.SMS_SID_CODE || "";
        this.user = process.env.SMS_USER || "";
        this.pass = process.env.SMS_PASS || "";

        if (!this.host) {
            console.warn("GovSmsProvider: SMS_HOST is not defined");
        }
    }

    async sendSms(payload: SmsPayload): Promise<boolean> {
        try {
            if (!this.host) {
                console.error("GovSmsProvider: SMS_HOST not configured");
                return false;
            }

            // Clean number: '077...' -> '9477...'
            let cleanNumber = payload.to.trim();
            if (cleanNumber.startsWith("0")) {
                cleanNumber = "94" + cleanNumber.substring(1);
            }

            const body = {
                data: payload.message,
                phoneNumber: cleanNumber,
                sIDCode: this.sidCode,
                userName: this.user,
                password: this.pass,
            };

            console.log(`GovSMS: Sending to ${cleanNumber}...`);

            const response = await fetch(this.host, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`GovSMS Error: ${response.status} - ${errorText}`);
                return false;
            }

            const data = await response.json();
            console.log("GovSMS Response:", data);

            // Based on user example: { status: true, message: "GovSMS delivery success" }
            if (data.status === true) {
                return true;
            }

            return false;

        } catch (error) {
            console.error("GovSMS Exception:", error);
            return false;
        }
    }
}
