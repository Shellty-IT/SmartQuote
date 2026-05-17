// src/types/email.types.ts

export type EmailLogStatus = 'SENT' | 'FAILED' | 'DRAFT';

export type EmailAttachmentType = 'offer_pdf' | 'contract_pdf' | 'offer_link' | 'contract_link';

export interface EmailAttachment {
    type: EmailAttachmentType;
    resourceId: string;
    name: string;
}

export interface EmailLogClient {
    id: string;
    name: string;
    email: string | null;
}

export interface EmailLogOffer {
    id: string;
    number: string;
    title: string;
}

export interface EmailLogContract {
    id: string;
    number: string;
    title: string;
}

export interface EmailLog {
    id: string;
    userId: string;
    to: string;
    toName: string | null;
    subject: string;
    body: string;
    status: EmailLogStatus;
    errorMessage: string | null;
    attachments: EmailAttachment[];
    clientId: string | null;
    offerId: string | null;
    contractId: string | null;
    templateId: string | null;
    templateName: string | null;
    sentAt: string;
    createdAt: string;
    updatedAt: string;
    client: EmailLogClient | null;
    offer: EmailLogOffer | null;
    contract: EmailLogContract | null;
}

export interface EmailTemplate {
    id: string;
    userId: string;
    name: string;
    subject: string;
    body: string;
    isBuiltIn: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SendEmailInput {
    to: string;
    toName?: string;
    subject: string;
    body: string;
    clientId?: string;
    offerId?: string;
    contractId?: string;
    templateId?: string;
    templateName?: string;
    attachments?: EmailAttachment[];
    saveAsDraft?: boolean;
}

export interface UpdateDraftInput {
    to?: string;
    toName?: string;
    subject?: string;
    body?: string;
    clientId?: string | null;
    offerId?: string | null;
    contractId?: string | null;
    templateId?: string | null;
    templateName?: string | null;
    attachments?: EmailAttachment[];
}

export interface CreateEmailTemplateInput {
    name: string;
    subject: string;
    body: string;
}

export interface UpdateEmailTemplateInput {
    name?: string;
    subject?: string;
    body?: string;
}

export interface SendEmailResult {
    id: string;
    status: EmailLogStatus;
    warning?: string;
}

export interface BuiltInTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    isBuiltIn: true;
}

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
    {
        id: 'builtin_offer',
        name: 'Wysyłka oferty do klienta',
        subject: 'Oferta handlowa — {offerNumber}',
        body: `Dzień dobry {clientName},

w załączeniu przesyłam ofertę handlową przygotowaną specjalnie dla Państwa firmy.

Proszę o zapoznanie się z przedstawioną propozycją. W razie pytań lub chęci omówienia szczegółów jestem do dyspozycji.

Z poważaniem`,
        isBuiltIn: true,
    },
    {
        id: 'builtin_followup',
        name: 'Follow-up po ofercie',
        subject: 'Przypomnienie — oferta handlowa',
        body: `Dzień dobry {clientName},

chciałem przypomnieć o przesłanej ofercie handlowej i zapytać, czy mają Państwo jakiekolwiek pytania lub uwagi.

Jestem do dyspozycji i chętnie omówię szczegóły lub dostosuję ofertę do Państwa potrzeb.

Z poważaniem`,
        isBuiltIn: true,
    },
    {
        id: 'builtin_thankyou',
        name: 'Podziękowanie za współpracę',
        subject: 'Dziękujemy za współpracę',
        body: `Dzień dobry {clientName},

dziękuję za zaufanie i podjęcie współpracy. Będziemy dokładać wszelkich starań, aby spełnić Państwa oczekiwania.

W razie jakichkolwiek pytań lub potrzeb proszę o kontakt.

Z poważaniem`,
        isBuiltIn: true,
    },
    {
        id: 'builtin_contract',
        name: 'Wysyłka umowy do podpisu',
        subject: 'Umowa do podpisu — {contractNumber}',
        body: `Dzień dobry {clientName},

w załączeniu przesyłam umowę do zapoznania się i podpisania. Proszę o jej przejrzenie i złożenie podpisu elektronicznego poprzez link dołączony do wiadomości.

W razie pytań dotyczących treści umowy jestem do dyspozycji.

Z poważaniem`,
        isBuiltIn: true,
    },
];

export interface EmailComposerState {
    to: string;
    toName: string;
    subject: string;
    body: string;
    clientId: string;
    offerId: string;
    contractId: string;
    attachments: EmailAttachment[];
    selectedTemplateId: string;
    isSending: boolean;
    isSavingDraft: boolean;
    errors: Record<string, string>;
}