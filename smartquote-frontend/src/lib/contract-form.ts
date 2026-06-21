export interface ContractDraftItem {
    name: string
    description: string
    quantity: string | number
    unit: string
    unitPrice: string | number
    vatRate: string | number
    discount: string | number
}

export function prepareContractItems(
    items: ContractDraftItem[],
    templateType: string,
    contractTitle: string,
) {
    return items.map((item, index) => ({
        ...item,
        name: item.name.trim() || (templateType !== 'classic' && index === 0 ? contractTitle.trim() : ''),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        vatRate: Number(item.vatRate),
        discount: Number(item.discount),
        position: index,
    }))
}
