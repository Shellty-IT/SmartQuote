// src/components/pdf/PdfPreviewModal.tsx
'use client';

import { ExternalLink, FileWarning } from 'lucide-react';
import { Modal, Button } from '@/components/ui';

interface PdfPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string | null;
    error: string | null;
    title: string;
    frameTitle: string;
    openInNewTabLabel: string;
    loadingLabel: string;
}

export function PdfPreviewModal({
    isOpen,
    onClose,
    pdfUrl,
    error,
    title,
    frameTitle,
    openInNewTabLabel,
    loadingLabel,
}: PdfPreviewModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="full">
            <div className="space-y-4">
                {error ? (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-border bg-surface-subtle p-6 text-center">
                        <FileWarning className="mb-3 h-10 w-10 text-destructive" />
                        <p className="max-w-md text-sm text-muted-foreground">{error}</p>
                    </div>
                ) : pdfUrl ? (
                    <>
                        <div className="h-[70vh] min-h-[420px] overflow-hidden rounded-xl border border-border bg-surface-subtle">
                            <iframe
                                src={`${pdfUrl}#toolbar=1&navpanes=0`}
                                title={frameTitle}
                                className="h-full w-full"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
                            >
                                <ExternalLink className="h-4 w-4" />
                                {openInNewTabLabel}
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-border bg-surface-subtle text-sm text-muted-foreground">
                        {loadingLabel}
                    </div>
                )}
            </div>
        </Modal>
    );
}
