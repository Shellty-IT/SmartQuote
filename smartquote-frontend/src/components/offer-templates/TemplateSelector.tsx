// src/components/offer-templates/TemplateSelector.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { offerTemplatesApi } from '@/lib/api';
import type { OfferTemplate } from '@/types';

interface TemplateSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (template: OfferTemplate) => void;
}

export default function TemplateSelector({ isOpen, onClose, onSelect }: TemplateSelectorProps) {
    const [templates, setTemplates] = useState<OfferTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const fetchRef = useRef<(() => void) | null>(null);

    async function fetchTemplates() {
        setSelected(null);
        setSearch('');
        setIsLoading(true);
        try {
            const res = await offerTemplatesApi.list({ limit: 50 });
            setTemplates(res.data ?? []);
        } catch {
            setTemplates([]);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchRef.current = fetchTemplates;
    });

    useEffect(() => {
        if (!isOpen) return;
        const raf = requestAnimationFrame(() => {
            fetchRef.current?.();
        });
        return () => cancelAnimationFrame(raf);
    }, [isOpen]);

    const filtered = templates.filter((t) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            t.name.toLowerCase().includes(q) ||
            (t.category ?? '').toLowerCase().includes(q) ||
            (t.description ?? '').toLowerCase().includes(q)
        );
    });

    const selectedTemplate = templates.find((t) => t.id === selected) ?? null;

    function handleConfirm() {
        if (!selectedTemplate) return;
        onSelect(selectedTemplate);
        onClose();
    }

    function handleBackdrop(e: React.MouseEvent) {
        if (e.target === e.currentTarget) onClose();
    }

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={handleBackdrop}
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-selector-title"
        >
            <div
                ref={dialogRef}
                className="card-themed rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b divider-themed">
                    <h2 id="template-selector-title" className="text-lg font-bold text-themed">
                        Wybierz szablon oferty
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover-themed text-themed-muted"
                        aria-label="Zamknij"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 border-b divider-themed">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Szukaj szablonu..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg input-themed text-sm text-themed"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-20 rounded-xl section-themed animate-pulse" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="w-12 h-12 section-themed rounded-full flex items-center justify-center mb-3">
                                <svg className="w-6 h-6 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                </svg>
                            </div>
                            <p className="text-themed font-medium text-sm">
                                {search ? 'Brak wyników' : 'Brak szablonów'}
                            </p>
                            <p className="text-themed-muted text-xs mt-1">
                                {search
                                    ? 'Spróbuj zmienić wyszukiwanie'
                                    : 'Stwórz pierwszy szablon w sekcji Szablony ofert'}
                            </p>
                        </div>
                    ) : (
                        filtered.map((template) => {
                            const isSelected = selected === template.id;
                            return (
                                <button
                                    key={template.id}
                                    onClick={() => setSelected(template.id)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                                        isSelected
                                            ? 'border-cyan-500 bg-cyan-500/10'
                                            : 'border-transparent section-themed hover:border-cyan-500/40'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-themed text-sm truncate">
                                                    {template.name}
                                                </span>
                                                {template.category && (
                                                    <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 shrink-0">
                                                        {template.category}
                                                    </span>
                                                )}
                                            </div>
                                            {template.description && (
                                                <p className="text-xs text-themed-muted mt-0.5 truncate">
                                                    {template.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-themed-muted mt-1">
                                                {template.items.length}{' '}
                                                {template.items.length === 1
                                                    ? 'pozycja'
                                                    : template.items.length < 5
                                                        ? 'pozycje'
                                                        : 'pozycji'}{' '}
                                                · {template.defaultPaymentDays} dni płatności
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center shrink-0 mt-0.5">
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="p-4 border-t divider-themed flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-themed-muted hover-themed transition-colors"
                    >
                        Anuluj
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selected}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-600 hover:bg-cyan-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Wstaw pozycje
                    </button>
                </div>
            </div>
        </div>
    );
}