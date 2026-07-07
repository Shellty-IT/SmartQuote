// src/components/ai/GlobalAIChat.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ai } from '@/lib/api';
import { notesApi } from '@/lib/api/notes.api';
import { offersApi } from '@/lib/api/offers.api';
import { contractsApi } from '@/lib/api/contracts.api';
import { leadsApi } from '@/lib/api/leads.api';
import { followUpsApi } from '@/lib/api/follow-ups.api';
import { contractKeys, followUpKeys, leadKeys, offerKeys } from '@/lib/queryKeys';
import { useToast } from '@/contexts/ToastContext';
import { useAIChat } from '@/contexts/AIChatContext';
import { usePageContext } from '@/hooks/usePageContext';
import type { PageContext } from '@/hooks/usePageContext';
import { useChatMessages } from './hooks/useChatMessages';
import { useChatScroll } from './hooks/useChatScroll';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import type { AIAction } from '@/types/ai';

function getQuickSuggestions(pageContext: PageContext): string[] {
    switch (pageContext.type) {
        case 'offer':
            return ['Jak zwiększyć szanse na akceptację tej oferty?', 'Sprawdź ceny pozycji w tej ofercie', 'Zasugeruj follow-up dla tej oferty'];
        case 'client':
            return ['Podsumuj historię tego klienta', 'Zasugeruj następny krok', 'Jakie oferty warto wysłać temu klientowi?'];
        case 'lead':
            return ['Jak przekształcić ten lead w klienta?', 'Zasugeruj wiadomość do tego leada', 'Dodaj notatkę o tym leadzie'];
        case 'dashboard':
            return ['Co wymaga mojej uwagi dzisiaj?', 'Pokaż zaległe zadania', 'Jakie mam możliwości sprzedażowe?'];
        default:
            return ['Pomóż mi stworzyć ofertę', 'Pokaż zaległe follow-upy', 'Jakie mam aktywne oferty?'];
    }
}

function getContextBadgeLabel(pageContext: PageContext): string | null {
    switch (pageContext.type) {
        case 'offer': return 'Oferta';
        case 'client': return 'Klient';
        case 'lead': return 'Lead';
        case 'contract': return 'Umowa';
        case 'dashboard': return 'Dashboard';
        default: return null;
    }
}

export function GlobalAIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const { data: session } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();
    const toast = useToast();
    const { hideGlobalFab } = useAIChat();
    const pageContext = usePageContext();
    const { messages, addMessage, clearMessages } = useChatMessages();
    const { messagesEndRef } = useChatScroll(messages, isOpen, isMinimized);

    const quickSuggestions = getQuickSuggestions(pageContext);
    const contextBadge = getContextBadgeLabel(pageContext);

    // Handle suggestion chip click: send the message immediately
    const handleSuggestionClick = useCallback((suggestion: string) => {
        setInput(suggestion);
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content: input.trim(),
            timestamp: new Date(),
        };

        addMessage(userMessage);
        const messageToSend = input.trim();
        setInput('');
        setIsLoading(true);

        try {
            const history = messages.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const response = await ai.chat(messageToSend, history, pageContext);

            const assistantMessage = {
                id: crypto.randomUUID(),
                role: 'assistant' as const,
                content: response.message || 'No response received',
                timestamp: new Date(),
                actions: response.actions,
            };

            addMessage(assistantMessage);

            if (!isOpen || isMinimized) {
                setUnreadCount((prev) => prev + 1);
            }
        } catch (error) {
            const errorMessage = {
                id: crypto.randomUUID(),
                role: 'assistant' as const,
                content:
                    error instanceof Error
                        ? error.message
                        : 'Sorry, an error occurred. Please try again later.',
                timestamp: new Date(),
            };
            addMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleOpen = useCallback(() => {
        setIsOpen((prev) => {
            if (!prev) {
                setIsMinimized(false);
                setUnreadCount(0);
            }
            return !prev;
        });
    }, []);

    const executeAction = useCallback(async (action: AIAction) => {
        switch (action.type) {
            case 'navigate':
                if (action.payload?.path) {
                    router.push(action.payload.path as string);
                    toggleOpen();
                }
                break;

            case 'create_note': {
                const p = action.payload as { content?: string; entityType?: string; entityId?: string };
                if (!p.content || !p.entityType || !p.entityId) break;
                try {
                    await notesApi.create({
                        content: p.content,
                        [`${p.entityType}Id`]: p.entityId,
                    } as Parameters<typeof notesApi.create>[0]);
                    addMessage({ id: crypto.randomUUID(), role: 'assistant', content: '✅ Notatka zapisana.', timestamp: new Date() });
                } catch {
                    toast.error('Nie udało się zapisać notatki.');
                }
                break;
            }

            case 'update_status': {
                const p = action.payload as { entityType?: string; entityId?: string; status?: string };
                if (!p.entityId || !p.status) break;
                try {
                    if (p.entityType === 'contract') {
                        await contractsApi.updateStatus(p.entityId, p.status);
                        queryClient.invalidateQueries({ queryKey: contractKeys.detail(p.entityId) });
                        queryClient.invalidateQueries({ queryKey: contractKeys.all });
                        queryClient.invalidateQueries({ queryKey: contractKeys.stats });
                    } else {
                        await offersApi.update(p.entityId, { status: p.status as import('@/types').OfferStatus });
                        queryClient.invalidateQueries({ queryKey: offerKeys.detail(p.entityId) });
                        queryClient.invalidateQueries({ queryKey: offerKeys.all });
                        queryClient.invalidateQueries({ queryKey: offerKeys.stats });
                    }
                    addMessage({ id: crypto.randomUUID(), role: 'assistant', content: `✅ Status zmieniony na: ${p.status}.`, timestamp: new Date() });
                } catch {
                    toast.error('Nie udało się zmienić statusu.');
                }
                break;
            }

            case 'create_lead': {
                const p = action.payload as { name?: string; email?: string; company?: string; source?: string };
                if (!p.name) {
                    router.push('/dashboard/leads/new');
                    toggleOpen();
                    break;
                }
                try {
                    const lead = await leadsApi.create({
                        name: p.name,
                        email: p.email ?? '',
                        company: p.company ?? '',
                        phone: '',
                        source: p.source ?? 'AI',
                        notes: '',
                    });
                    queryClient.invalidateQueries({ queryKey: leadKeys.all });
                    queryClient.invalidateQueries({ queryKey: leadKeys.stats });
                    addMessage({ id: crypto.randomUUID(), role: 'assistant', content: `✅ Lead "${p.name}" zapisany.`, timestamp: new Date() });
                    if (lead.data?.id) {
                        router.push(`/dashboard/leads/${lead.data.id}`);
                    }
                    toggleOpen();
                } catch {
                    toast.error('Nie udało się zapisać leada.');
                }
                break;
            }

            case 'create_followup': {
                const p = action.payload as { clientId?: string; title?: string; type?: string };
                if (!p.title) {
                    router.push('/dashboard/followups');
                    toggleOpen();
                    break;
                }
                try {
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + 1);
                    dueDate.setHours(10, 0, 0, 0);
                    await followUpsApi.create({
                        title: p.title,
                        type: (p.type as 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'REMINDER' | 'OTHER') ?? 'TASK',
                        priority: 'MEDIUM',
                        dueDate: dueDate.toISOString(),
                        clientId: p.clientId,
                    });
                    queryClient.invalidateQueries({ queryKey: followUpKeys.all });
                    queryClient.invalidateQueries({ queryKey: followUpKeys.stats });
                    addMessage({ id: crypto.randomUUID(), role: 'assistant', content: `✅ Follow-up "${p.title}" zaplanowany na jutro o 10:00.`, timestamp: new Date() });
                } catch {
                    toast.error('Nie udało się zapisać follow-up.');
                }
                break;
            }

            case 'create_offer': {
                const p = action.payload as { clientId?: string; title?: string };
                const params = new URLSearchParams();
                if (p.clientId) params.set('clientId', p.clientId);
                if (p.title) params.set('title', p.title);
                const qs = params.toString();
                router.push(`/dashboard/offers/new${qs ? `?${qs}` : ''}`);
                toggleOpen();
                break;
            }

            case 'send_email': {
                const p = action.payload as { clientId?: string; offerId?: string };
                const params = new URLSearchParams();
                if (p.clientId) params.set('clientId', p.clientId);
                if (p.offerId) params.set('offerId', p.offerId);
                const qs = params.toString();
                router.push(`/dashboard/emails/new${qs ? `?${qs}` : ''}`);
                toggleOpen();
                break;
            }

            default:
                break;
        }
    }, [router, queryClient, toast, addMessage, toggleOpen]);

    const handleClearHistory = async () => {
        try {
            await ai.clearHistory();
        } catch {
        }
        clearMessages();
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
        if (isMinimized) {
            setUnreadCount(0);
        }
    };

    if (!session || hideGlobalFab) {
        return null;
    }

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={toggleOpen}
                        aria-label="Otworz asystenta AI"
                        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-full shadow-glow ring-1 ring-white/15 hover:brightness-110 transition-shadow"
                    >
                        <svg className="w-6 h-6 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                        </svg>

                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-status-rejected text-white text-xs font-bold rounded-full z-20"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.span>
                        )}

                        <span
                            className="absolute inset-0 rounded-full bg-primary animate-ping opacity-25 pointer-events-none"
                            aria-hidden="true"
                        />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            height: isMinimized ? 'auto' : '500px',
                        }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-card border-border border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        <ChatHeader
                            isLoading={isLoading}
                            isMinimized={isMinimized}
                            onToggleMinimize={toggleMinimize}
                            onClearHistory={handleClearHistory}
                            onClose={toggleOpen}
                        />

                        <AnimatePresence>
                            {!isMinimized && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="flex-1 overflow-hidden flex flex-col"
                                >
                                    {contextBadge && (
                                        <div className="px-4 pt-2">
                                            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                Kontekst: {contextBadge}
                                            </span>
                                        </div>
                                    )}

                                    <ChatMessages
                                        messages={messages}
                                        isLoading={isLoading}
                                        messagesEndRef={messagesEndRef}
                                        onSuggestionClick={handleSuggestionClick}
                                        onAction={executeAction}
                                        quickSuggestions={quickSuggestions}
                                    />

                                    <ChatInput
                                        value={input}
                                        onChange={setInput}
                                        onSend={handleSend}
                                        isLoading={isLoading}
                                        isVisible={!isMinimized}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
