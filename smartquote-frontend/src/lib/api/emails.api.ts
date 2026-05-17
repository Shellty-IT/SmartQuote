// src/lib/api/emails.api.ts

import { api } from './client';
import type {
    EmailLog,
    EmailTemplate,
    SendEmailInput,
    UpdateDraftInput,
    CreateEmailTemplateInput,
    UpdateEmailTemplateInput,
    SendEmailResult,
} from '@/types/email.types';

export const emailsApi = {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
        api.get<EmailLog[]>('/emails', params),

    get: (id: string) =>
        api.get<EmailLog>(`/emails/${id}`),

    send: (data: SendEmailInput) =>
        api.post<SendEmailResult>('/emails', data),

    sendDraft: (id: string) =>
        api.post<SendEmailResult>(`/emails/${id}/send`),

    updateDraft: (id: string, data: UpdateDraftInput) =>
        api.put<{ id: string }>(`/emails/${id}/draft`, data),

    delete: (id: string) =>
        api.delete<{ deleted: boolean }>(`/emails/${id}`),

    getTemplates: () =>
        api.get<EmailTemplate[]>('/emails/templates/list'),

    getTemplate: (id: string) =>
        api.get<EmailTemplate>(`/emails/templates/${id}`),

    createTemplate: (data: CreateEmailTemplateInput) =>
        api.post<EmailTemplate>('/emails/templates', data),

    updateTemplate: (id: string, data: UpdateEmailTemplateInput) =>
        api.put<EmailTemplate>(`/emails/templates/${id}`, data),

    deleteTemplate: (id: string) =>
        api.delete<{ deleted: boolean }>(`/emails/templates/${id}`),
};