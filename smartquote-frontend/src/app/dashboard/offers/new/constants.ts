// src/app/dashboard/offers/new/constants.ts

export type Step = 'client' | 'type_choice' | 'details' | 'items' | 'template' | 'summary';

/** Default list (classic, new offer) */
export const STEP_IDS: Step[] = ['client', 'type_choice', 'details', 'items', 'summary'];

/**
 * Build step list dynamically.
 * - New offer (isEditMode=false):
 *   classic  → client → type_choice → details → items → summary
 *   proposal → client → type_choice → template → summary
 * - Edit mode (isEditMode=true):
 *   classic  → client → details → items → summary
 *   proposal → client → details → template → summary
 */
export function buildStepIds(
    templateType: 'classic' | 'proposal',
    isEditMode = false,
): Step[] {
    if (isEditMode) {
        return templateType === 'proposal'
            ? ['client', 'details', 'template', 'summary']
            : ['client', 'details', 'items', 'summary'];
    }
    return templateType === 'proposal'
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
