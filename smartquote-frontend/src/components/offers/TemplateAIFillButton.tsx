'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { OfferAIDrawer } from './OfferAIDrawer'

interface TemplateAIFillButtonProps<TBlocks extends object> {
    blocks: TBlocks
    onBlocksChange: (blocks: TBlocks) => void
    clientName: string
    title: string
    templateType: string
    entityType?: 'offer' | 'contract'
}

export function TemplateAIFillButton<TBlocks extends object>({
    blocks,
    onBlocksChange,
    clientName,
    title,
    templateType,
    entityType = 'offer',
}: TemplateAIFillButtonProps<TBlocks>) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                title="Wypełnij z AI"
                className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
            >
                <Sparkles className="h-3.5 w-3.5" />
                Wypełnij z AI
            </button>
            <OfferAIDrawer
                isOpen={open}
                onClose={() => setOpen(false)}
                clientName={clientName}
                offerTitle={title}
                currentBlocks={blocks as Record<string, unknown>}
                onApply={(updated) => onBlocksChange(updated as TBlocks)}
                templateType={templateType}
                entityType={entityType}
            />
        </>
    )
}
