// src/app/dashboard/offers/new/constants.ts

export type Step = 'client' | 'type_choice' | 'details' | 'items' | 'template' | 'summary';

export type TemplateType = 'classic' | 'proposal' | 'shop' | 'website_v2' | 'website_v3' | 'support' | 'mobile_app' | 'mobile_simple' | 'universal';

/** Default list (classic, new offer) */
export const STEP_IDS: Step[] = ['client', 'type_choice', 'details', 'items', 'summary'];

/**
 * Build step list dynamically.
 * - classic  → client → (type_choice) → details → items → summary
 * - proposal → client → (type_choice) → template → summary
 * - shop     → client → (type_choice) → template → summary
 */
export function buildStepIds(
    templateType: TemplateType,
    isEditMode = false,
): Step[] {
    const isDocTemplate = templateType === 'proposal' || templateType === 'shop' || templateType === 'website_v2' || templateType === 'website_v3' || templateType === 'support' || templateType === 'mobile_app' || templateType === 'mobile_simple' || templateType === 'universal'
    if (isEditMode) {
        return isDocTemplate
            ? ['client', 'details', 'template', 'summary']
            : ['client', 'details', 'items', 'summary'];
    }
    return isDocTemplate
        ? ['client', 'type_choice', 'template', 'summary']
        : ['client', 'type_choice', 'details', 'items', 'summary'];
}

export const VAT_RATES = [
    { value: '23', label: '23%' },
    { value: '8', label: '8%' },
    { value: '5', label: '5%' },
    { value: '0', label: '0%' },
];

export const UNITS = [
    { value: 'szt.', label: 'szt.' },
    { value: 'godz.', label: 'godz.' },
    { value: 'dni', label: 'dni' },
    { value: 'kg', label: 'kg' },
    { value: 'm', label: 'm' },
    { value: 'm²', label: 'm²' },
    { value: 'kpl.', label: 'kpl.' },
    { value: 'usł.', label: 'usł.' },
];
