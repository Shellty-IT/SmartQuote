// SmartQuote-AI/src/types/index.ts

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface User {
    id: string;
    email: string;
    name: string | null;
    company?: string | null;
    phone?: string | null;
    role: 'USER' | 'ADMIN';
    createdAt: string;
}

export type ClientType = 'PERSON' | 'COMPANY';

export interface Client {
    id: string;
    type: ClientType;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    nip: string | null;
    regon: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
    website: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        offers: number;
        followUps?: number;
    };
}

export interface CreateClientInput {
    type?: ClientType;
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    nip?: string | null;
    regon?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string;
    website?: string | null;
    notes?: string | null;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
    isActive?: boolean;
}

export interface ClientsStats {
    total: number;
    active: number;
    inactive: number;
    withOffers: number;
}

export type OfferStatus =
    | 'DRAFT'
    | 'SENT'
    | 'VIEWED'
    | 'NEGOTIATION'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'EXPIRED';

export interface OfferItem {
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
    discount: number;
    totalNet: number;
    totalVat: number;
    totalGross: number;
    position: number;
    isOptional: boolean;
    isSelected: boolean;
    minQuantity: number;
    maxQuantity: number;
}

export interface Offer {
    id: string;
    number: string;
    title: string;
    description: string | null;
    status: OfferStatus;
    totalNet: number;
    totalVat: number;
    totalGross: number;
    currency: string;
    validUntil: string | null;
    sentAt: string | null;
    viewedAt: string | null;
    acceptedAt: string | null;
    rejectedAt: string | null;
    notes: string | null;
    terms: string | null;
    paymentDays: number;
    publicToken: string | null;
    isInteractive: boolean;
    viewCount: number;
    lastViewedAt: string | null;
    clientSelectedData: any | null;
    createdAt: string;
    updatedAt: string;
    client: Client;
    items: OfferItem[];
    _count?: {
        items: number;
        followUps?: number;
        comments?: number;
        views?: number;
    };
}

export interface CreateOfferItemInput {
    name: string;
    description?: string | null;
    quantity: number;
    unit?: string;
    unitPrice: number;
    vatRate?: number;
    discount?: number;
    isOptional?: boolean;
    minQuantity?: number;
    maxQuantity?: number;
}

export interface CreateOfferInput {
    clientId: string;
    title: string;
    description?: string | null;
    validUntil?: string | null;
    notes?: string | null;
    terms?: string | null;
    paymentDays?: number;
    items: CreateOfferItemInput[];
}

export interface UpdateOfferInput extends Partial<Omit<CreateOfferInput, 'items'>> {
    status?: OfferStatus;
    items?: CreateOfferItemInput[];
}

export interface OffersStats {
    total: number;
    byStatus: Record<OfferStatus, { count: number; value: number }>;
    totalValue: number;
    acceptedValue: number;
}

export interface PublishOfferResult {
    publicToken: string;
    publicUrl: string;
    alreadyPublished: boolean;
}

export interface SendToClientResult {
    sent: boolean;
    email: string;
}

export interface OfferView {
    id: string;
    offerId: string;
    viewedAt: string;
    ipAddress: string | null;
    userAgent: string | null;
    duration: number | null;
}

export type InteractionType =
    | 'VIEW'
    | 'ITEM_SELECT'
    | 'ITEM_DESELECT'
    | 'QUANTITY_CHANGE'
    | 'ACCEPT'
    | 'REJECT'
    | 'COMMENT'
    | 'PDF_DOWNLOAD';

export interface OfferInteraction {
    id: string;
    offerId: string;
    type: InteractionType;
    details: any;
    createdAt: string;
}

export type CommentAuthor = 'CLIENT' | 'SELLER';

export interface OfferComment {
    id: string;
    offerId: string;
    author: CommentAuthor;
    content: string;
    createdAt: string;
}

export interface OfferAnalytics {
    id: string;
    number: string;
    title: string;
    status: OfferStatus;
    publicToken: string | null;
    isInteractive: boolean;
    viewCount: number;
    lastViewedAt: string | null;
    acceptedAt: string | null;
    rejectedAt: string | null;
    clientSelectedData: any | null;
    validUntil: string | null;
    totalNet: number;
    totalGross: number;
    views: OfferView[];
    interactions: OfferInteraction[];
    comments: OfferComment[];
    uniqueVisitors: number;
    publicUrl: string | null;
}

export interface PublicOfferData {
    expired: boolean;
    decided: boolean;
    offer: {
        id: string;
        number: string;
        title: string;
        description: string | null;
        status: OfferStatus;
        validUntil: string | null;
        totalNet: number;
        totalVat: number;
        totalGross: number;
        currency: string;
        acceptedAt: string | null;
        rejectedAt: string | null;
        clientSelectedData: any | null;
        terms: string | null;
        paymentDays: number;
        createdAt: string;
        items: PublicOfferItem[];
        client: {
            name: string;
            company: string | null;
        };
        seller: {
            name: string | null;
            email: string;
            phone: string | null;
            company: string | null;
            nip: string | null;
            address: string | null;
            city: string | null;
            postalCode: string | null;
            website: string | null;
            logo: string | null;
        };
        comments: OfferComment[];
    };
}

export interface PublicOfferItem {
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
    discount: number;
    totalNet: number;
    totalVat: number;
    totalGross: number;
    position: number;
    isOptional: boolean;
    isSelected: boolean;
    minQuantity: number;
    maxQuantity: number;
}

export interface PublicOfferAcceptPayload {
    confirmationChecked: true;
    selectedItems: Array<{
        id: string;
        isSelected: boolean;
        quantity: number;
    }>;
}

export interface PublicOfferRejectPayload {
    reason?: string;
}

export type ContractStatus =
    | 'DRAFT'
    | 'PENDING_SIGNATURE'
    | 'ACTIVE'
    | 'COMPLETED'
    | 'TERMINATED'
    | 'EXPIRED';

export interface ContractItem {
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
    discount: number;
    totalNet: number;
    totalVat: number;
    totalGross: number;
    position: number;
}

export interface Contract {
    id: string;
    number: string;
    title: string;
    description: string | null;
    status: ContractStatus;
    totalNet: number;
    totalVat: number;
    totalGross: number;
    currency: string;
    startDate: string | null;
    endDate: string | null;
    signedAt: string | null;
    terms: string | null;
    paymentTerms: string | null;
    paymentDays: number;
    notes: string | null;
    clientId: string;
    client: Client;
    offerId: string | null;
    offer?: Offer;
    items: ContractItem[];
    createdAt: string;
    updatedAt: string;
}

export interface ContractsStats {
    total: number;
    byStatus: Record<ContractStatus, number>;
    totalValue: number;
    activeValue: number;
}

export interface CreateContractInput {
    title: string;
    description?: string;
    clientId: string;
    offerId?: string;
    startDate?: string;
    endDate?: string;
    terms?: string;
    paymentTerms?: string;
    paymentDays?: number;
    notes?: string;
    items: {
        name: string;
        description?: string;
        quantity: number;
        unit?: string;
        unitPrice: number;
        vatRate?: number;
        discount?: number;
        position?: number;
    }[];
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}

export interface ClientFilters extends PaginationParams {
    type?: ClientType;
    isActive?: boolean;
}

export interface OfferFilters extends PaginationParams {
    status?: OfferStatus;
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
}

export type FollowUpType = 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'REMINDER' | 'OTHER';
export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface FollowUp {
    id: string;
    title: string;
    description: string | null;
    type: FollowUpType;
    status: FollowUpStatus;
    priority: Priority;
    dueDate: string;
    completedAt: string | null;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    userId: string;
    clientId: string | null;
    offerId: string | null;
    contractId: string | null;
    client: {
        id: string;
        name: string;
        email: string | null;
        company: string | null;
    } | null;
    offer: {
        id: string;
        number: string;
        title: string;
        status: string;
    } | null;
    contract: {
        id: string;
        number: string;
        title: string;
        status: string;
    } | null;
}

export interface FollowUpStats {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
    todayDue: number;
    thisWeekDue: number;
    completedThisMonth: number;
    completionRate: number;
}

export interface CreateFollowUpData {
    title: string;
    description?: string;
    type: FollowUpType;
    priority?: Priority;
    dueDate: string;
    notes?: string;
    clientId?: string;
    offerId?: string;
    contractId?: string;
}

export interface UpdateFollowUpData {
    title?: string;
    description?: string;
    type?: FollowUpType;
    status?: FollowUpStatus;
    priority?: Priority;
    dueDate?: string;
    notes?: string;
    clientId?: string | null;
    offerId?: string | null;
    contractId?: string | null;
}

export interface UserSettings {
    id: string;
    userId: string;
    theme: 'light' | 'dark' | 'system';
    language: 'pl' | 'en';
    emailNotifications: boolean;
    offerNotifications: boolean;
    followUpReminders: boolean;
    weeklyReport: boolean;
    aiTone: 'professional' | 'friendly' | 'formal';
    aiAutoSuggestions: boolean;
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUser: string | null;
    smtpPass: string | null;
    smtpFrom: string | null;
    smtpConfigured: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SmtpConfigData {
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUser: string | null;
    smtpPass: string | null;
    smtpFrom: string | null;
    smtpConfigured: boolean;
}

export interface UpdateSmtpConfigInput {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass?: string;
    smtpFrom?: string;
}

export interface TestSmtpConnectionInput {
    host: string;
    port: number;
    user: string;
    pass: string;
    from?: string;
}

export interface TestSmtpConnectionResult {
    connected: boolean;
    message: string;
}

export interface CompanyInfo {
    id: string;
    userId: string;
    name: string | null;
    nip: string | null;
    regon: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    bankName: string | null;
    bankAccount: string | null;
    logo: string | null;
    defaultPaymentDays: number;
    defaultTerms: string | null;
    defaultNotes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ApiKey {
    id: string;
    name: string;
    key: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    isActive: boolean;
    permissions: string[];
    createdAt: string;
}

export interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    avatar: string | null;
    role: 'USER' | 'ADMIN';
    createdAt: string;
}

export interface AllSettings {
    profile: UserProfile;
    settings: UserSettings;
    companyInfo: CompanyInfo;
    apiKeys: ApiKey[];
}

export interface UpdateProfileInput {
    name?: string;
    phone?: string | null;
    avatar?: string | null;
}

export interface ChangePasswordInput {
    currentPassword: string;
    newPassword: string;
}

export interface UpdateSettingsInput {
    theme?: 'light' | 'dark' | 'system';
    language?: 'pl' | 'en';
    emailNotifications?: boolean;
    offerNotifications?: boolean;
    followUpReminders?: boolean;
    weeklyReport?: boolean;
    aiTone?: 'professional' | 'friendly' | 'formal';
    aiAutoSuggestions?: boolean;
}

export interface UpdateCompanyInfoInput {
    name?: string | null;
    nip?: string | null;
    regon?: string | null;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    bankName?: string | null;
    bankAccount?: string | null;
    logo?: string | null;
    defaultPaymentDays?: number;
    defaultTerms?: string | null;
    defaultNotes?: string | null;
}

export interface CreateApiKeyInput {
    name: string;
    permissions?: string[];
    expiresAt?: string | null;
}

export type NotificationType =
    | 'OFFER_VIEWED'
    | 'OFFER_ACCEPTED'
    | 'OFFER_REJECTED'
    | 'OFFER_COMMENT'
    | 'AI_INSIGHT'
    | 'FOLLOW_UP_REMINDER'
    | 'SYSTEM';

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    link: string | null;
    metadata: Record<string, any> | null;
    createdAt: string;
}

export * from './ai';