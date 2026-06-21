import { describe, expect, it } from 'vitest'
import { prepareContractItems } from '@/lib/contract-form'

const emptyItem = {
    name: '', description: '', quantity: 1, unit: 'szt.', unitPrice: 0, vatRate: 23, discount: 0,
}

describe('contract creation payload', () => {
    it('uses the contract title for the hidden item of an HTML template', () => {
        const [item] = prepareContractItems([emptyItem], 'short', 'Umowa - Klub sportowy')
        expect(item.name).toBe('Umowa - Klub sportowy')
    })

    it('does not hide a missing item name in the classic form', () => {
        const [item] = prepareContractItems([emptyItem], 'classic', 'Umowa klasyczna')
        expect(item.name).toBe('')
    })

    it('preserves a name explicitly provided by the user or AI', () => {
        const [item] = prepareContractItems([{ ...emptyItem, name: 'Wykonanie strony WWW' }], 'short', 'Umowa')
        expect(item.name).toBe('Wykonanie strony WWW')
    })
})
