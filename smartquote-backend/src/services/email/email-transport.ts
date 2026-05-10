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

function buildMailerSendAttachments(
    attachments: any[] | undefined,
): Array<{ content: string; filename: string; type?: string; disposition: string }> {
    if (!attachments || attachments.length === 0) return [];

    const result: Array<{ content: string; filename: string; type?: string; disposition: string }> = [];

    for (const att of attachments) {
        if (att.content && Buffer.isBuffer(att.content)) {
            const filename = typeof att.filename === 'string' ? att.filename : 'attachment';
            result.push({
                content: att.content.toString('base64'),
                filename,
                type: att.contentType || 'application/octet-stream',
                disposition: 'attachment',
            });
        }
    }

    return result;
}

export async function sendEmail(
    mailOptions: MailOptions,
    smtpConfig: SmtpConfig,
): Promise<{ status: EmailLogStatus; errorMessage?: string }> {
    if (!config.mailersend.apiKey) {
        logger.error('MailerSend API key not configured');
        return {
            status: 'FAILED',
            errorMessage: 'MailerSend API key not configured',
        };
    }

    try {
        const recipient = parseEmailAddress(mailOptions.to);
        const mailerSendAttachments = buildMailerSendAttachments(mailOptions.attachments);

        const payload: Record<string, unknown> = {
            from: {
                email: config.mailersend.fromEmail,
                name: config.mailersend.fromName,
            },
            to: [
                {
                    email: recipient.email,
                    name: recipient.name || recipient.email,
                },
            ],
            subject: mailOptions.subject,
            html: mailOptions.html,
            text: mailOptions.text,
        };

        if (mailerSendAttachments.length > 0) {
            payload.attachments = mailerSendAttachments;
        }

        logger.info(
            {
                to: recipient.email,
                subject: mailOptions.subject,
                attachmentsCount: mailerSendAttachments.length,
            },
            'Sending email via MailerSend',
        );

        const response = await fetch('https://api.mailersend.com/v1/email', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.mailersend.apiKey}`,
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText })) as { message?: string; errors?: Record<string, string[]> };
            const errorMessage = errorData.message || JSON.stringify(errorData.errors) || `HTTP ${response.status}`;
            logger.error({ status: response.status, errorData, to: recipient.email }, 'MailerSend send failed');
            return {
                status: 'FAILED',
                errorMessage,
            };
        }

        const messageId = response.headers.get('x-message-id') || 'unknown';
        logger.info({ messageId, to: recipient.email, attachmentsCount: mailerSendAttachments.length }, 'Email sent successfully via MailerSend');
        return { status: 'SENT' };
    } catch (err: any) {
        logger.error({ err, to: mailOptions.to }, 'MailerSend send exception');
        return {
            status: 'FAILED',
            errorMessage: err.message || 'Unknown error',
        };
    }
}

export async function testConnection(smtpConfig: SmtpConfig): Promise<{ success: boolean; error?: string }> {
    if (!config.mailersend.apiKey) {
        return { success: false, error: 'MailerSend API key not configured' };
    }

    try {
        const response = await fetch('https://api.mailersend.com/v1/domains', {
            headers: {
                'Authorization': `Bearer ${config.mailersend.apiKey}`,
                'X-Requested-With': 'XMLHttpRequest',
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