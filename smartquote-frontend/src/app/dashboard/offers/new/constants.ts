// src/app/dashboard/offers/new/constants.ts

export type Step = 'client' | 'details' | 'items' | 'template' | 'summary';

/** Full list including the optional template step */
export const ALL_STEP_IDS: Step[] = ['client', 'details', 'items', 'template', 'summary'];

/** Default list without the template step (classic offers) */
export const STEP_IDS: Step[] = ['client', 'details', 'items', 'summary'];

/** Build step list dynamically based on template type */
export function buildStepIds(templateType: 'classic' | 'proposal'): Step[] {
    return templateType === 'proposal'
        ? ['client', 'details', 'items', 'template', 'summary']
        : ['client', 'details', 'items', 'summary'];
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
