// src/services/email/email-transport.ts
import nodemailer from 'nodemailer';
import { createModuleLogger } from '../../lib/logger';
import { sendViaResend } from './resend-transport';
import type { EmailLogStatus, EmailProviderConfig } from '../../types';

const logger = createModuleLogger('email-transport');

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

export async function sendEmail(
    mailOptions: MailOptions,
    emailConfig: EmailProviderConfig,
): Promise<{ status: EmailLogStatus; errorMessage?: string }> {
    if (emailConfig.provider === 'resend') {
        return sendViaResend(mailOptions, emailConfig.config);
    }

    const smtpConfig = emailConfig.config;
    const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.port === 465,
        auth: { user: smtpConfig.user, pass: smtpConfig.pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
    });

    try {
        await transporter.sendMail({
            from: smtpConfig.from,
            replyTo: smtpConfig.replyTo,
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.html,
            text: mailOptions.text,
            attachments: mailOptions.attachments,
        });
        logger.info({ to: mailOptions.to, host: smtpConfig.host }, 'Email sent successfully via user SMTP');
        return { status: 'SENT' };
    } catch (err: any) {
        logger.error({ err, to: mailOptions.to, host: smtpConfig.host }, 'User SMTP send exception');
        return { status: 'FAILED', errorMessage: err.message || 'Unknown error' };
    } finally {
        transporter.close();
    }
}