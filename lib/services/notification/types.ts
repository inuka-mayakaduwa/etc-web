export interface NotificationRecipient {
    email?: string | null;
    mobile?: string | null;
    name?: string;
}

export interface EmailPayload {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export interface SmsPayload {
    to: string; // The mobile number
    message: string;
}

export interface EmailProvider {
    sendEmail(payload: EmailPayload): Promise<boolean>;
}

export interface SmsProvider {
    sendSms(payload: SmsPayload): Promise<boolean>;
}

export type TemplateType = 'OTP' | 'REQUEST_STATUS_CHANGE' | 'APPOINTMENT_CREATED';

export interface NotificationContext {
    [key: string]: string | number | undefined;
}
