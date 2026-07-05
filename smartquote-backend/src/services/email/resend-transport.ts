// src/services/email/resend-transport.ts
import { Resend } from 'resend';
import { createModuleLogger } from '../../lib/logger';
import type { MailOptions } from './email-transport';
import type { EmailLogStatus, ResendConfig } from '../../types';

const logger = createModuleLogger('resend-transport');

const CONNECTION_TIMEOUT_MS = 10000;

async function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), CONNECTION_TIMEOUT_MS)),
    ]);
}

export async function sendViaResend(
    mailOptions: MailOptions,
    resendConfig: ResendConfig,
): Promise<{ status: EmailLogStatus; errorMessage?: string }> {
    const resend = new Resend(resendConfig.apiKey);

    try {
        const { error } = await withTimeout(
            resend.emails.send({
                from: resendConfig.from,
                replyTo: resendConfig.replyTo,
                to: mailOptions.to,
                subject: mailOptions.subject,
                html: mailOptions.html,
                text: mailOptions.text,
                attachments: mailOptions.attachments?.map((att) => ({
                    filename: att.filename,
                    content: att.content,
                    contentType: att.contentType,
                })),
            }),
            'Przekroczono czas połączenia z Resend (10s)',
        );

        if (error) {
            logger.error({ error, to: mailOptions.to }, 'Resend send exception');
            return { status: 'FAILED', errorMessage: error.message };
        }

        logger.info({ to: mailOptions.to }, 'Email sent successfully via Resend');
        return { status: 'SENT' };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Nieznany błąd Resend';
        logger.error({ err, to: mailOptions.to }, 'Resend send exception');
        return { status: 'FAILED', errorMessage: message };
    }
}

export async function testResendApiKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
    const resend = new Resend(apiKey);

    try {
        const { error } = await withTimeout(
            resend.domains.list(),
            'Przekroczono czas połączenia z Resend (10s)',
        );

        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Nieznany błąd połączenia z Resend';
        return { success: false, error: message };
    }
}
