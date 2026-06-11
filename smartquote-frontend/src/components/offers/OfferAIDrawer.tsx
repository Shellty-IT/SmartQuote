// src/components/offers/OfferAIDrawer.tsx
// Sliding panel with AI conversation for filling ProposalBlocks during offer creation.
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import { ai } from '@/lib/api'
import { useAIChat } from '@/contexts/AIChatContext'
import { mergeWithDefaults, type ProposalBlocks } from '@/lib/pdf/proposal-blocks'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
}

interface OfferAIDrawerProps {
    isOpen: boolean
    onClose: () => void
    clientName: string
    offerTitle: string
    currentBlocks: ProposalBlocks
    onApply: (blocks: ProposalBlocks) => void
}

function buildInitialMessage(hasContent: boolean): Message {
    return {
        id: 'init',
        role: 'assistant',
        content: hasContent
            ? 'Cześć! Widzę że szablon jest już częściowo wypełniony. Mogę go zmodyfikować, poprawić lub rozwinąć wybrane sekcje. Co chciałbyś zmienić lub ulepszyć?'
            : 'Cześć! Pomogę Ci wypełnić szablon oferty. Zacznijmy od podstaw — opisz krótko projekt lub branżę klienta. Czym się zajmuje firma i czego potrzebuje?',
    }
}

export function OfferAIDrawer({ isOpen, onClose, clientName, offerTitle, currentBlocks, onApply }: OfferAIDrawerProps) {
    const { setHideGlobalFab } = useAIChat()
    const [messages, setMessages] = useState<Message[]>(() => [buildInitialMessage(false)])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [generatedBlocks, setGeneratedBlocks] = useState<Record<string, unknown> | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // Hide global FAB when this drawer is open
    useEffect(() => {
        setHideGlobalFab(isOpen)
        return () => setHideGlobalFab(false)
    }, [isOpen, setHideGlobalFab])

    // Reset conversation when drawer opens fresh
    useEffect(() => {
        if (isOpen) {
            const hasContent = currentBlocks.intro.paragraphs.some((p) => p.length > 60)
                || currentBlocks.scope.items.length > 3
            setMessages([buildInitialMessage(hasContent)])
            setInput('')
            setGeneratedBlocks(null)
            setTimeout(() => inputRef.current?.focus(), 300)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    const getHistory = () =>
        messages
            .filter((m) => m.id !== 'init')
            .map((m) => ({ role: m.role, content: m.content }))

    const handleSend = async () => {
        const text = input.trim()
        if (!text || isLoading) return

        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text }
        setMessages((prev) => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            const result = await ai.offerFill({
                message: text,
                history: getHistory(),
                context: {
                    clientName: clientName || 'Klient',
                    offerTitle: offerTitle || 'Nowa oferta',
                },
                currentBlocks: currentBlocks as unknown as Record<string, unknown>,
            })

            const assistantMsg: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: result.message,
            }
            setMessages((prev) => [...prev, assistantMsg])

            if (result.isComplete && result.blocks) {
                setGeneratedBlocks(result.blocks)
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: '❌ Błąd komunikacji z AI. Spróbuj ponownie.',
                },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    const handleApply = () => {
        if (!generatedBlocks) return
        const generated = generatedBlocks as Partial<ProposalBlocks>
        // Deep-merge: start from currentBlocks so sections AI didn't touch are preserved.
        // Only page1Sections/page2Sections are replaced if AI explicitly returned them.
        const merged: Partial<ProposalBlocks> = {
            ...currentBlocks,
            ...generated,
            page1Sections: generated.page1Sections ?? currentBlocks.page1Sections,
            page2Sections: generated.page2Sections ?? currentBlocks.page2Sections,
        }
        const blocks = mergeWithDefaults(merged, clientName)
        onApply(blocks)
        onClose()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop (mobile only) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-30 bg-black/30 md:hidden"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                        className="fixed right-0 top-0 z-40 flex h-full w-full flex-col bg-card border-l border-border shadow-2xl md:w-[420px]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-white">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">AI — Wypełnij ofertę</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                                        {clientName || 'Klient'} · {offerTitle || 'Nowa oferta'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary/60 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="h-7 w-7 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs shrink-0 mt-0.5">
                                            AI
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                                            msg.role === 'user'
                                                ? 'bg-primary text-white rounded-tr-sm'
                                                : 'bg-secondary/60 text-foreground rounded-tl-sm'
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-2 justify-start">
                                    <div className="h-7 w-7 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs shrink-0 mt-0.5">
                                        AI
                                    </div>
                                    <div className="bg-secondary/60 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                                        <div className="flex gap-1 items-center h-4">
                                            {[0, 1, 2].map((i) => (
                                                <span
                                                    key={i}
                                                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                                                    style={{ animationDelay: `${i * 150}ms` }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Apply button when blocks ready */}
                        {generatedBlocks && (
                            <div className="px-4 py-3 border-t border-border bg-card shrink-0">
                                <button
                                    onClick={handleApply}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-white shadow-glow hover:brightness-110 transition-all"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Zastosuj do szablonu
                                </button>
                                <p className="mt-2 text-center text-xs text-muted-foreground">
                                    Możesz edytować każdą sekcję po zastosowaniu
                                </p>
                            </div>
                        )}

                        {/* Input */}
                        {!generatedBlocks && (
                            <div className="border-t border-border px-3 py-3 shrink-0">
                                <div className="flex gap-2 items-end">
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Napisz wiadomość… (Enter = wyślij)"
                                        rows={4}
                                        disabled={isLoading}
                                        className="flex-1 resize-y min-h-[80px] max-h-[240px] rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleSend}
                                        disabled={!input.trim() || isLoading}
                                        className="shrink-0 h-10 w-10 p-0"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="mt-1.5 text-center text-xs text-muted-foreground">
                                    Shift+Enter = nowa linia
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
