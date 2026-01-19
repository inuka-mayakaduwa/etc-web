import nodemailer from "nodemailer";
import { EmailPayload, EmailProvider } from "../types";

export class SmtpEmailProvider implements EmailProvider {
    private transporter: nodemailer.Transporter;
    private from: string;

    constructor() {
        const host = process.env.SMTP_HOST;
        const port = parseInt(process.env.SMTP_PORT || "587");
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;

        this.from = process.env.SMTP_FROM || user || "noreply@etc.gov.lk";

        if (!host || !user || !pass) {
            console.warn("SmtpEmailProvider: Missing SMTP configuration");
        }

        this.transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: port === 465, // true for 465, false for other ports
            auth: {
                user: user,
                pass: pass,
            },
        });
    }

    async sendEmail(payload: EmailPayload): Promise<boolean> {
        try {
            if (!this.transporter) {
                console.error("SmtpEmailProvider: Transporter not initialized");
                return false;
            }

            console.log(`SMTP: Sending email to ${payload.to}...`);

            const info = await this.transporter.sendMail({
                from: this.from,
                to: payload.to,
                subject: payload.subject,
                text: payload.text,
                html: payload.html,
            });

            console.log("SMTP Response:", info.messageId);
            return true;
        } catch (error) {
            console.error("SMTP Exception:", error);
            return false;
        }
    }
}
