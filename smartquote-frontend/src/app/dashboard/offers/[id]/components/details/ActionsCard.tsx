// src/app/dashboard/offers/[id]/components/details/ActionsCard.tsx
'use client';

import { Card, Button } from '@/components/ui';

interface ActionsCardProps {
    isInteractive: boolean;
    isDownloadingPDF: boolean;
    onDownloadPDF: () => void;
    onPublishClick: () => void;
    onDeleteClick: () => void;
}

export function ActionsCard({
                                isInteractive,
                                isDownloadingPDF,
                                onDownloadPDF,
                                onPublishClick,
                                onDeleteClick,
                            }: ActionsCardProps) {
    return (
        <Card>
            <h2 className="text-lg font-semibold text-themed mb-4">Akcje</h2>
            <div className="space-y-2">
                <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={onDownloadPDF}
                    disabled={isDownloadingPDF}
                >
                    {isDownloadingPDF ? (
                        <>
                            <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Generowanie PDF...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zm-3 9h2v5H9v-3H7v-2h3v-2H7v-2h5v4zm4 0h3v2h-3v1h3v2h-3v1h3v2h-5v-8h5v-2h-3v2z" />
                            </svg>
                            Pobierz PDF
                        </>
                    )}
                </Button>
                <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={onPublishClick}
                >
                    <svg className="w-5 h-5 mr-2 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {isInteractive ? 'Zarządzaj linkiem' : 'Publikuj interaktywny link'}
                </Button>
                <div className="pt-2 border-t divider-themed">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-500/10"
                        onClick={onDeleteClick}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Usuń ofertę
                    </Button>
                </div>
            </div>
        </Card>
    );
}