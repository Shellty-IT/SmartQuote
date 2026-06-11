'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Search,
    Users,
    FileText,
    ScrollText,
    UserSearch,
    Plus,
    Loader2,
} from 'lucide-react';
import { searchApi } from '@/lib/api/search.api';
import type { SearchResults } from '@/types/search.types';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const router = useRouter();
    const tr = useTranslations('search');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults(null);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults(null);
            return;
        }
        let cancelled = false;
        setIsLoading(true);
        searchApi.search(debouncedQuery).then((res) => {
            if (!cancelled) {
                setResults(res.data ?? null);
                setIsLoading(false);
            }
        }).catch(() => {
            if (!cancelled) setIsLoading(false);
        });
        return () => { cancelled = true; };
    }, [debouncedQuery]);

    const navigate = useCallback((href: string) => {
        router.push(href);
        onClose();
    }, [router, onClose]);

    const hasResults = results && (
        results.clients.length > 0 ||
        results.offers.length > 0 ||
        results.contracts.length > 0 ||
        results.leads.length > 0
    );

    const quickActions = [
        { label: tr.newLead, icon: UserSearch, href: '/dashboard/leads/new' },
        { label: tr.newOffer, icon: FileText, href: '/dashboard/offers/new' },
        { label: tr.newClient, icon: Users, href: '/dashboard/clients/new' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="fixed inset-x-4 top-[10vh] z-50 mx-auto max-w-2xl"
                        initial={{ opacity: 0, scale: 0.96, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -8 }}
                        transition={{ duration: 0.15 }}
                    >
                        <Command
                            className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
                            shouldFilter={false}
                        >
                            {/* Input */}
                            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                                {isLoading
                                    ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
                                    : <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                                }
                                <Command.Input
                                    ref={inputRef}
                                    value={query}
                                    onValueChange={setQuery}
                                    placeholder={tr.placeholder}
                                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                                />
                                <kbd className="hidden rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
                                    ESC
                                </kbd>
                            </div>

                            <Command.List className="max-h-[60vh] overflow-y-auto py-2">
                                {/* Loading state */}
                                {isLoading && (
                                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                        {tr.loading}
                                    </div>
                                )}

                                {/* No results */}
                                {!isLoading && debouncedQuery && !hasResults && (
                                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                        {tr.noResults} &ldquo;{debouncedQuery}&rdquo;
                                    </div>
                                )}

                                {/* Clients */}
                                {results && results.clients.length > 0 && (
                                    <Command.Group heading={tr.clients} className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-muted-foreground/70">
                                        {results.clients.map((c) => (
                                            <Command.Item
                                                key={c.id}
                                                onSelect={() => navigate(`/dashboard/clients/${c.id}`)}
                                                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-secondary/60 aria-selected:bg-secondary/60"
                                            >
                                                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--status-open)_12%,transparent)] text-status-open">
                                                    <Users className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium leading-tight">{c.name}</p>
                                                    {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
                                                </div>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}

                                {/* Offers */}
                                {results && results.offers.length > 0 && (
                                    <Command.Group heading={tr.offers} className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-muted-foreground/70">
                                        {results.offers.map((o) => (
                                            <Command.Item
                                                key={o.id}
                                                onSelect={() => navigate(`/dashboard/offers/${o.id}`)}
                                                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-secondary/60 aria-selected:bg-secondary/60"
                                            >
                                                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-primary/15 text-primary">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium leading-tight">{o.title}</p>
                                                    <p className="text-xs text-muted-foreground">{o.number} · {o.clientName}</p>
                                                </div>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}

                                {/* Contracts */}
                                {results && results.contracts.length > 0 && (
                                    <Command.Group heading={tr.contracts} className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-muted-foreground/70">
                                        {results.contracts.map((c) => (
                                            <Command.Item
                                                key={c.id}
                                                onSelect={() => navigate(`/dashboard/contracts/${c.id}`)}
                                                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-secondary/60 aria-selected:bg-secondary/60"
                                            >
                                                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--status-accepted)_12%,transparent)] text-[var(--status-accepted)]">
                                                    <ScrollText className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium leading-tight">{c.title}</p>
                                                    <p className="text-xs text-muted-foreground">{c.number} · {c.clientName}</p>
                                                </div>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}

                                {/* Leads */}
                                {results && results.leads.length > 0 && (
                                    <Command.Group heading={tr.leads} className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-muted-foreground/70">
                                        {results.leads.map((l) => (
                                            <Command.Item
                                                key={l.id}
                                                onSelect={() => navigate(`/dashboard/leads/${l.id}`)}
                                                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-secondary/60 aria-selected:bg-secondary/60"
                                            >
                                                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/12 text-amber-600 dark:text-amber-400">
                                                    <UserSearch className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium leading-tight">{l.name}</p>
                                                    {l.company && <p className="text-xs text-muted-foreground">{l.company}</p>}
                                                </div>
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                )}

                                {/* Quick actions - always shown */}
                                <Command.Group heading={tr.quickActions} className={cn("[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-muted-foreground/70", hasResults && "border-t border-border/50 pt-1 mt-1")}>
                                    {quickActions.map((action) => {
                                        const Icon = action.icon;
                                        return (
                                            <Command.Item
                                                key={action.label}
                                                onSelect={() => navigate(action.href)}
                                                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-secondary/60 aria-selected:bg-secondary/60"
                                            >
                                                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-dashed border-border bg-secondary/50 text-muted-foreground">
                                                    <Plus className="h-4 w-4" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span className="font-medium">{action.label}</span>
                                                </div>
                                            </Command.Item>
                                        );
                                    })}
                                </Command.Group>
                            </Command.List>

                            {/* Footer hint */}
                            <div className="flex items-center justify-between border-t border-border px-4 py-2">
                                <span className="text-[10px] text-muted-foreground/60">{tr.hint}</span>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                                    <span>↑↓ nawigacja</span>
                                    <span>↵ wybierz</span>
                                </div>
                            </div>
                        </Command>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
