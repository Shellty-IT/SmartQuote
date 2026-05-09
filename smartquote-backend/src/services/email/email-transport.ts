// src/services/email/email-transport.ts
import { Resend } from 'resend';
import { config } from '../../config';
import { createModuleLogger } from '../../lib/logger';
import type { EmailLogStatus } from '../../types';

const logger = createModuleLogger('email-transport');

export interface SmtpConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
}

export interface MailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: Array<{
        filename: string;
        content?: Buffer;
        path?: string;
    }>;
}

export function buildHtmlBody(text: string): string {
    const paragraphs = text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => `<p>${line}</p>`)
        .join('');
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    p { margin: 0 0 10px 0; }
  </style>
</head>
<body>
  ${paragraphs}
</body>
</html>`;
}

export function htmlToPlainText(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
}

export function appendLinksToBody(body: string, linkLines: string[]): string {
    if (linkLines.length === 0) return body;
    return `${body}\n\n${'─'.repeat(40)}\n${linkLines.join('\n')}`;
}

export async function sendEmail(
    mailOptions: MailOptions,
    smtpConfig: SmtpConfig,
): Promise<{ status: EmailLogStatus; errorMessage?: string }> {
    if (!config.resend.apiKey) {
        logger.error('Resend API key not configured');
        return {
            status: 'FAILED',
            errorMessage: 'Resend API key not configured',
        };
    }

    const resend = new Resend(config.resend.apiKey);

    try {
        logger.info(
            {
                to: mailOptions.to,
                subject: mailOptions.subject,
                hasAttachments: !!mailOptions.attachments?.length,
            },
            'Sending email via Resend',
        );

        // Resend w free tier wymaga onboarding@resend.dev jako FROM
        const { data, error } = await resend.emails.send({
            from: config.resend.fromEmail || 'SmartQuote AI <onboarding@resend.dev>',
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.html,
            text: mailOptions.text,
        });

        if (error) {
            logger.error({ error, to: mailOptions.to }, 'Resend send failed');
            return {
                status: 'FAILED',
                errorMessage: error.message,
            };
        }

        logger.info({ data, to: mailOptions.to }, 'Email sent successfully via Resend');
        return { status: 'SENT' };
    } catch (err: unknown) {
        const error = err as Error;
        logger.error({ err, to: mailOptions.to }, 'Resend send exception');
        return {
            status: 'FAILED',
            errorMessage: error.message || 'Unknown error',
        };
    }
}

export async function testConnection(smtpConfig: SmtpConfig): Promise<{ success: boolean; error?: string }> {
    if (!config.resend.apiKey) {
        return { success: false, error: 'Resend API key not configured' };
    }
    return { success: true };
}