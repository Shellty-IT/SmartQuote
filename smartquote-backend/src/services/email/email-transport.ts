// src/services/email/email-transport.ts
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
    attachments?: any[];
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

function parseEmailAddress(emailString: string): { name?: string; email: string } {
    const match = emailString.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
    const name = match?.[1]?.trim();
    const email = match?.[2]?.trim() || emailString.trim();
    return name ? { name, email } : { email };
}

export async function sendEmail(
    mailOptions: MailOptions,
    smtpConfig: SmtpConfig,
): Promise<{ status: EmailLogStatus; errorMessage?: string }> {
    if (!config.brevo.apiKey) {
        logger.error('Brevo API key not configured');
        return {
            status: 'FAILED',
            errorMessage: 'Brevo API key not configured',
        };
    }

    try {
        logger.info(
            {
                to: mailOptions.to,
                subject: mailOptions.subject,
                hasAttachments: !!mailOptions.attachments?.length,
            },
            'Sending email via Brevo',
        );

        const sender = parseEmailAddress(config.brevo.fromEmail);
        const recipient = parseEmailAddress(mailOptions.to);

        const payload = {
            sender,
            to: [recipient],
            subject: mailOptions.subject,
            htmlContent: mailOptions.html,
            textContent: mailOptions.text,
        };

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-key': config.brevo.apiKey,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText })) as { message?: string };
            logger.error({ status: response.status, errorData, to: mailOptions.to }, 'Brevo send failed');
            return {
                status: 'FAILED',
                errorMessage: errorData.message || `HTTP ${response.status}`,
            };
        }

        const result = await response.json() as { messageId?: string };
        logger.info({ messageId: result.messageId, to: recipient.email }, 'Email sent successfully via Brevo');
        return { status: 'SENT' };
    } catch (err: any) {
        logger.error({ err, to: mailOptions.to }, 'Brevo send exception');
        return {
            status: 'FAILED',
            errorMessage: err.message || 'Unknown error',
        };
    }
}

export async function testConnection(smtpConfig: SmtpConfig): Promise<{ success: boolean; error?: string }> {
    if (!config.brevo.apiKey) {
        return { success: false, error: 'Brevo API key not configured' };
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/account', {
            headers: {
                'Accept': 'application/json',
                'api-key': config.brevo.apiKey,
            },
        });

        if (!response.ok) {
            return { success: false, error: `Invalid API key (HTTP ${response.status})` };
        }

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}