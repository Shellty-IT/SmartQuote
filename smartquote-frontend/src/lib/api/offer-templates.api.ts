// src/lib/api/offer-templates.api.ts

import { api } from './client';
import type {
    OfferTemplate,
    CreateOfferTemplateInput,
    UpdateOfferTemplateInput,
} from '@/types';

export const offerTemplatesApi = {
    list: (params?: Record<string, string | number | undefined>) =>
        api.get<OfferTemplate[]>('/offer-templates', params),

    get: (id: string) =>
        api.get<OfferTemplate>(`/offer-templates/${id}`),

    getCategories: () =>
        api.get<string[]>('/offer-templates/categories'),

    create: (data: CreateOfferTemplateInput) =>
        api.post<OfferTemplate>('/offer-templates', data),

    update: (id: string, data: UpdateOfferTemplateInput) =>
        api.put<OfferTemplate>(`/offer-templates/${id}`, data),

    delete: (id: string) =>
        api.delete<{ message: string }>(`/offer-templates/${id}`),
};