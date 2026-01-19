import { GovSmsProvider } from "./sms/lk-govsms";
import { SmtpEmailProvider } from "./email/smtp";
import { EmailProvider, NotificationContext, NotificationRecipient, SmsProvider, TemplateType } from "./types";

// Simple template store for now - can be moved to files later
const EMAIL_TEMPLATES: Record<TemplateType, (ctx: NotificationContext) => { subject: string, html: string }> = {
    OTP: (ctx) => ({
        subject: "Your OTP Code - ETC System",
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>ETC Admin Access</h2>
                <p>Your OTP code is: <strong style="font-size: 24px;">${ctx.otp}</strong></p>
                <p>This code will expire in 5 minutes.</p>
                <p>If you did not request this code, please ignore this email.</p>
            </div>
        `
    }),
    REQUEST_STATUS_CHANGE: (ctx) => ({
        subject: `Request Update: ${ctx.requestNo}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Request Status Update</h2>
                <p>Your request (<strong>${ctx.requestNo}</strong>) status has changed to: <strong>${ctx.status}</strong></p>
                <p>Message: ${ctx.message}</p>
            </div>
        `
    }),
    APPOINTMENT_CREATED: (ctx) => ({
        subject: `Appointment Confirmed: ${ctx.requestNo}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Appointment Confirmed</h2>
                <p>Your appointment for request <strong>${ctx.requestNo}</strong> is scheduled for:</p>
                <p><strong>${ctx.date}</strong> at <strong>${ctx.time}</strong></p>
                <p>Location: ${ctx.location}</p>
            </div>
        `
    })
};

const SMS_TEMPLATES: Record<TemplateType, (ctx: NotificationContext) => string> = {
    OTP: (ctx) => `ETC Code: ${ctx.otp}. Verify your login immediately.`,
    REQUEST_STATUS_CHANGE: (ctx) => `ETC Request ${ctx.requestNo} status updated to: ${ctx.status}. ${ctx.message}`,
    APPOINTMENT_CREATED: (ctx) => `ETC Appointment Confirmed. Ref: ${ctx.requestNo}. Date: ${ctx.date} Time: ${ctx.time} @ ${ctx.location}`
};

export class NotificationProcessor {
    private smsProvider: SmsProvider;
    private emailProvider: EmailProvider;

    constructor() {
        this.smsProvider = new GovSmsProvider();
        this.emailProvider = new SmtpEmailProvider();
    }

    async sendNotification(
        recipient: NotificationRecipient,
        type: TemplateType,
        context: NotificationContext
    ) {
        const results = { sms: false, email: false };

        // Send SMS if mobile exists
        if (recipient.mobile) {
            const message = SMS_TEMPLATES[type](context);
            results.sms = await this.smsProvider.sendSms({
                to: recipient.mobile,
                message: message
            });
        }

        // Send Email if email exists
        if (recipient.email) {
            const template = EMAIL_TEMPLATES[type](context);
            results.email = await this.emailProvider.sendEmail({
                to: recipient.email,
                subject: template.subject,
                html: template.html,
                text: template.html.replace(/<[^>]*>/g, '') // Simple strip tags for text version
            });
        }

        return results;
    }
}

// Singleton instance
export const notificationProcessor = new NotificationProcessor();
