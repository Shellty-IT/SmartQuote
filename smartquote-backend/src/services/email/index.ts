// smartquote_backend/src/services/email/index.ts
import { EmailSender } from './sender';
import type { SmtpConfig, EmailProviderConfig } from '../../types';

class EmailService {
    private sender = new EmailSender();

    testConnection(config: SmtpConfig) {
        return this.sender.testConnection(config);
    }

    testResendConnection(apiKey: string) {
        return this.sender.testResendConnection(apiKey);
    }

    sendOfferAccepted(to: string, data: any, emailConfig: EmailProviderConfig) {
        return this.sender.sendOfferAccepted(to, data, emailConfig);
    }

    sendOfferRejected(to: string, data: any, emailConfig: EmailProviderConfig) {
        return this.sender.sendOfferRejected(to, data, emailConfig);
    }

    sendNewComment(to: string, data: any, emailConfig: EmailProviderConfig) {
        return this.sender.sendNewComment(to, data, emailConfig);
    }

    sendOfferLink(to: string, data: any, emailConfig: EmailProviderConfig) {
        return this.sender.sendOfferLink(to, data, emailConfig);
    }

    sendAcceptanceConfirmation(to: string, data: any, emailConfig: EmailProviderConfig) {
        return this.sender.sendAcceptanceConfirmation(to, data, emailConfig);
    }

    sendSignatureConfirmation(to: string, data: any, emailConfig: EmailProviderConfig) {
        return this.sender.sendSignatureConfirmation(to, data, emailConfig);
    }

    sendFollowUpReminder(to: string, data: any, emailConfig: EmailProviderConfig) {
        return this.sender.sendFollowUpReminder(to, data, emailConfig);
    }
}

export const emailService = new EmailService();