// src/components/offers/OfferAIDrawer.tsx
// Sliding panel with AI conversation for filling ProposalBlocks during offer creation.
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles, CheckCircle, Maximize2, Minimize2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui'
import { ai } from '@/lib/api'
import { useAIChat } from '@/contexts/AIChatContext'
import { useLanguage } from '@/i18n'
import { mergeWithDefaults, type ProposalBlocks } from '@/lib/pdf/proposal-blocks'

const MIN_WIDTH = 420
const MAX_WIDTH_RATIO = 0.5 // max 50vw
const DEFAULT_INPUT_HEIGHT = 96
const MAX_INPUT_HEIGHT_RATIO = 0.5 // textarea grows up to ~half the viewport (≈ half the bar)
const LS_WIDTH_KEY = 'sq_ai_drawer_width'

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
    const { language } = useLanguage()
    const [messages, setMessages] = useState<Message[]>(() => [buildInitialMessage(false)])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [generatedBlocks, setGeneratedBlocks] = useState<Record<string, unknown> | null>(null)
    const [drawerWidth, setDrawerWidth] = useState<number>(() => {
        if (typeof window === 'undefined') return MIN_WIDTH
        const saved = parseInt(localStorage.getItem(LS_WIDTH_KEY) ?? '', 10)
        // Clamp against the current viewport's MAX as well — a width saved on a wide
        // monitor would make the drawer overflow a narrower screen.
        const maxWidth = Math.floor(window.innerWidth * MAX_WIDTH_RATIO)
        if (!isNaN(saved) && saved >= MIN_WIDTH && saved <= maxWidth) return saved
        return MIN_WIDTH
    })
    const [inputHeight, setInputHeight] = useState<number>(DEFAULT_INPUT_HEIGHT)
    const drawerWidthRef = useRef(drawerWidth)
    const inputHeightRef = useRef(inputHeight)
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

    // Drag-to-resize the drawer width (handle on the left edge). Grows leftward → wider.
    const handleWidthDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        const startX = e.clientX
        const startWidth = drawerWidthRef.current
        const maxWidth = Math.floor(window.innerWidth * MAX_WIDTH_RATIO)
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'col-resize'

        const onMove = (ev: MouseEvent) => {
            const next = Math.min(maxWidth, Math.max(MIN_WIDTH, startWidth + (startX - ev.clientX)))
            drawerWidthRef.current = next
            setDrawerWidth(next)
        }
        const onUp = () => {
            localStorage.setItem(LS_WIDTH_KEY, String(drawerWidthRef.current))
            document.body.style.userSelect = ''
            document.body.style.cursor = ''
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
    }, [])

    // Drag-to-resize the message textarea (handle on the top edge). Grows upward.
    // Supports both mouse (desktop) and touch (mobile) so the handle works on all devices.
    const handleHeightDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        const startY = 'touches' in e ? e.touches[0].clientY : e.clientY
        const startHeight = inputHeightRef.current
        const maxHeight = Math.floor(window.innerHeight * MAX_INPUT_HEIGHT_RATIO)
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'row-resize'

        const getClientY = (ev: MouseEvent | TouchEvent) =>
            'touches' in ev ? (ev as TouchEvent).touches[0].clientY : (ev as MouseEvent).clientY

        const onMove = (ev: MouseEvent | TouchEvent) => {
            const next = Math.min(maxHeight, Math.max(DEFAULT_INPUT_HEIGHT, startHeight + (startY - getClientY(ev))))
            inputHeightRef.current = next
            setInputHeight(next)
        }
        const onUp = () => {
            document.body.style.userSelect = ''
            document.body.style.cursor = ''
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
            window.removeEventListener('touchmove', onMove)
            window.removeEventListener('touchend', onUp)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        window.addEventListener('touchmove', onMove, { passive: false })
        window.addEventListener('touchend', onUp)
    }, [])

    // Quick toggle: snap textarea between default and ~half-bar height.
    const toggleInputHeight = useCallback(() => {
        const maxHeight = Math.floor(window.innerHeight * MAX_INPUT_HEIGHT_RATIO)
        const next = inputHeightRef.current > DEFAULT_INPUT_HEIGHT + 20 ? DEFAULT_INPUT_HEIGHT : maxHeight
        inputHeightRef.current = next
        setInputHeight(next)
    }, [])

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
                    language,
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
        // Backend already ran diffMergeBlocks against currentBlocks — blocks are safe to apply directly.
        const blocks = mergeWithDefaults(generatedBlocks as Partial<ProposalBlocks>, clientName)
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
                        className="fixed right-0 top-0 z-40 flex h-full flex-col bg-card border-l border-border shadow-2xl w-full"
                        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 768 ? drawerWidth : undefined }}
                    >
                        {/* Drag-to-resize handle — left edge, desktop only. Wide hit area for easy grab. */}
                        <div
                            onMouseDown={handleWidthDragStart}
                            className="group absolute left-0 top-0 z-50 hidden h-full w-3 -translate-x-1/2 cursor-col-resize items-center justify-center md:flex"
                            title="Przeciągnij, aby zmienić szerokość panelu"
                        >
                            <span className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-border transition-colors group-hover:bg-primary" />
                            <span className="relative flex h-12 w-5 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors group-hover:border-primary/60">
                                <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                            </span>
                        </div>
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
                                {/* Drag handle on the top edge — resize the textarea upward */}
                                <div
                                    onMouseDown={handleHeightDragStart}
                                    onTouchStart={handleHeightDragStart}
                                    className="group mx-auto mb-1 flex h-3 w-full cursor-row-resize items-center justify-center"
                                    title="Przeciągnij w górę, aby powiększyć pole"
                                >
                                    <span className="h-1 w-10 rounded-full bg-border transition-colors group-hover:bg-primary" />
                                </div>
                                <div className="relative flex items-end gap-2">
                                    {/* Quick expand/collapse toggle — top-right of the textarea */}
                                    <button
                                        type="button"
                                        onClick={toggleInputHeight}
                                        className="absolute z-10 rounded p-1 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                                        style={{ right: '3.25rem', top: '0.375rem' }}
                                        title={inputHeight > DEFAULT_INPUT_HEIGHT + 20 ? 'Zwiń pole tekstowe' : 'Powiększ pole tekstowe'}
                                    >
                                        {inputHeight > DEFAULT_INPUT_HEIGHT + 20
                                            ? <Minimize2 className="h-3.5 w-3.5" />
                                            : <Maximize2 className="h-3.5 w-3.5" />
                                        }
                                    </button>
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Napisz wiadomość… (Enter = wyślij)"
                                        disabled={isLoading}
                                        className="flex-1 resize-none rounded-xl border border-border bg-secondary/40 px-3 py-2.5 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                                        style={{ height: inputHeight }}
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
                                    Shift+Enter = nowa linia · przeciągnij górną krawędź, aby powiększyć
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
