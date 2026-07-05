// src/components/offers/OfferAIDrawer.tsx
// Sliding panel with AI conversation for filling an offer or contract template.
'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles, CheckCircle, Maximize2, Minimize2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui'
import { ai } from '@/lib/api'
import { useAIChat } from '@/contexts/AIChatContext'
import { useLanguage } from '@/i18n'
import { useDockSettings } from '@/app/providers'

const MIN_WIDTH = 320
const MAX_WIDTH_RATIO = 0.85 // max 85vw
const DEFAULT_INPUT_HEIGHT = 96
const MAX_INPUT_HEIGHT_RATIO = 0.5 // textarea grows up to ~half the viewport (≈ half the bar)
const LS_WIDTH_KEY = 'sq_ai_drawer_width'
const DESKTOP_DRAWER_EDGE_GAP = 8

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
    currentBlocks: Record<string, unknown>
    onApply: (blocks: Record<string, unknown>) => void
    templateType?: string
    entityType?: 'offer' | 'contract'
}

function buildInitialMessage(hasContent: boolean, entityType: 'offer' | 'contract' = 'offer'): Message {
    const documentLabel = entityType === 'contract' ? 'umowy' : 'oferty'
    return {
        id: 'init',
        role: 'assistant',
        content: hasContent
            ? 'Cześć! Widzę że szablon jest już częściowo wypełniony. Mogę go zmodyfikować, poprawić lub rozwinąć wybrane sekcje. Co chciałbyś zmienić lub ulepszyć?'
            : `Cześć! Pomogę Ci wypełnić szablon ${documentLabel}. Zacznijmy od podstaw - opisz krótko projekt lub branżę klienta. Czym się zajmuje firma i czego potrzebuje?`,
    }
}

function hasMeaningfulTemplateContent(blocks: Record<string, unknown>): boolean {
    const seen = new Set<unknown>()
    const walk = (value: unknown): boolean => {
        if (typeof value === 'string') return value.trim().length > 60
        if (Array.isArray(value)) return value.length > 3 || value.some(walk)
        if (!value || typeof value !== 'object') return false
        if (seen.has(value)) return false
        seen.add(value)
        return Object.entries(value as Record<string, unknown>)
            .some(([key, child]) => key !== 'version' && key !== 'sections' && key !== 'page1Sections' && key !== 'page2Sections' && walk(child))
    }
    return walk(blocks)
}

export function OfferAIDrawer({
    isOpen,
    onClose,
    clientName,
    offerTitle,
    currentBlocks,
    onApply,
    templateType = 'proposal',
    entityType = 'offer',
}: OfferAIDrawerProps) {
    const { setHideGlobalFab } = useAIChat()
    const { language } = useLanguage()
    const { position: dockPosition, collapsed: dockCollapsed } = useDockSettings()

    // Two things share screen space with this drawer and must stay visible/usable
    // while it's open:
    // - Header.tsx (search, language, theme, bell, profile) — a `sticky top-0`
    //   bar rendered above every dashboard page, h-16 (64px). It has no idea the
    //   drawer exists, so without this the drawer's top edge sits at y:0 and
    //   covers it outright on every dock position, not just "top".
    // - FloatingDock — only rendered at the lg breakpoint, and only when pinned
    //   to 'top' or 'right' does it occupy the same edge as this drawer.
    // On mobile (<768px) the drawer is an intentional full-screen takeover with
    // its own backdrop, so neither clearance applies there.
    const dockClearance = useMemo(() => {
        const isDesktopDrawer = typeof window !== 'undefined' && window.innerWidth >= 768
        if (!isDesktopDrawer) return { top: 0, bottom: 0, right: 0 }
        const isDesktopDock = typeof window !== 'undefined' && window.innerWidth >= 1024
        const HEADER_HEIGHT = 64
        const dockTopClearance = isDesktopDock && dockPosition === 'top' ? 76 : 0
        const dockBottomClearance = isDesktopDock && dockPosition === 'bottom' ? 76 : 0
        const right = isDesktopDock && dockPosition === 'right' ? (dockCollapsed ? 104 : 292) : 0
        return {
            top: Math.max(HEADER_HEIGHT, dockTopClearance) + DESKTOP_DRAWER_EDGE_GAP,
            bottom: dockBottomClearance + DESKTOP_DRAWER_EDGE_GAP,
            right: right + DESKTOP_DRAWER_EDGE_GAP,
        }
    }, [dockPosition, dockCollapsed])
    const [messages, setMessages] = useState<Message[]>(() => [buildInitialMessage(false, entityType)])
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
    const [isWidthDragging, setIsWidthDragging] = useState(false)
    const drawerWidthRef = useRef(drawerWidth)
    const inputHeightRef = useRef(inputHeight)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (typeof window === 'undefined') return

        const desktop = window.innerWidth >= 768
        document.body.classList.toggle('sq-ai-drawer-open', isOpen && desktop)
        document.body.classList.toggle('sq-ai-drawer-resizing', isOpen && desktop && isWidthDragging)

        if (isOpen && desktop) {
            document.body.style.setProperty('--sq-ai-drawer-width', `${drawerWidth + DESKTOP_DRAWER_EDGE_GAP}px`)
        } else {
            document.body.style.removeProperty('--sq-ai-drawer-width')
        }
    }, [drawerWidth, isOpen, isWidthDragging])

    useEffect(() => {
        if (typeof window === 'undefined') return

        const handleResize = () => {
            const desktop = window.innerWidth >= 768
            document.body.classList.toggle('sq-ai-drawer-open', isOpen && desktop)
            document.body.classList.toggle('sq-ai-drawer-resizing', isOpen && desktop && isWidthDragging)

            if (isOpen && desktop) {
                document.body.style.setProperty('--sq-ai-drawer-width', `${drawerWidthRef.current + DESKTOP_DRAWER_EDGE_GAP}px`)
            } else {
                document.body.style.removeProperty('--sq-ai-drawer-width')
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [isOpen, isWidthDragging])

    useEffect(() => {
        return () => {
            document.body.classList.remove('sq-ai-drawer-open', 'sq-ai-drawer-resizing')
            document.body.style.removeProperty('--sq-ai-drawer-width')
        }
    }, [])

    // Hide global FAB when this drawer is open
    useEffect(() => {
        setHideGlobalFab(isOpen)
        return () => setHideGlobalFab(false)
    }, [isOpen, setHideGlobalFab])

    // Reset conversation when drawer opens fresh
    useEffect(() => {
        if (isOpen) {
            const hasContent = hasMeaningfulTemplateContent(currentBlocks)
            setMessages([buildInitialMessage(hasContent, entityType)])
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
    const handleWidthDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        const maxWidth = Math.floor(window.innerWidth * MAX_WIDTH_RATIO)
        const previousUserSelect = document.body.style.userSelect
        const previousCursor = document.body.style.cursor
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'col-resize'
        setIsWidthDragging(true)

        const getClientX = (ev: MouseEvent | TouchEvent) =>
            'touches' in ev ? (ev as TouchEvent).touches[0]?.clientX : (ev as MouseEvent).clientX

        const resizeFromClientX = (clientX: number) => {
            const next = Math.min(maxWidth, Math.max(MIN_WIDTH, window.innerWidth - DESKTOP_DRAWER_EDGE_GAP - clientX))
            drawerWidthRef.current = next
            setDrawerWidth(next)
        }

        const initialClientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX
        if (typeof initialClientX === 'number') {
            resizeFromClientX(initialClientX)
        }

        const onMove = (ev: MouseEvent | TouchEvent) => {
            ev.preventDefault()
            const clientX = getClientX(ev)
            if (typeof clientX === 'number') {
                resizeFromClientX(clientX)
            }
        }

        const onUp = () => {
            localStorage.setItem(LS_WIDTH_KEY, String(drawerWidthRef.current))
            document.body.style.userSelect = previousUserSelect
            document.body.style.cursor = previousCursor
            setIsWidthDragging(false)
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
            document.removeEventListener('touchmove', onMove)
            document.removeEventListener('touchend', onUp)
        }

        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
        document.addEventListener('touchmove', onMove, { passive: false })
        document.addEventListener('touchend', onUp)
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
                    templateType,
                    entityType,
                    language,
                },
                currentBlocks: currentBlocks as unknown as Record<string, unknown>,
            })

            const hasGeneratedBlocks = !!result.blocks && Object.keys(result.blocks).length > 0
            const assistantMsg: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: hasGeneratedBlocks
                    ? `${result.message}\n\nDane są gotowe. Kliknij „Zastosuj do szablonu”, aby zapisać zmiany.`
                    : result.message,
            }
            setMessages((prev) => [...prev, assistantMsg])

            if (hasGeneratedBlocks && result.isComplete && result.blocks) {
                setGeneratedBlocks(result.blocks)
            } else {
                setGeneratedBlocks(null)
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: 'Błąd komunikacji z AI. Spróbuj ponownie.',
                },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    const handleApply = () => {
        if (!generatedBlocks) return
        // Backend already merged the generated content into the current template.
        onApply(generatedBlocks)
        onClose()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const drawerTitle = entityType === 'contract' ? 'AI - Wypełnij umowę' : 'AI - Wypełnij ofertę'

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
                        className="fixed z-40 flex w-full flex-col overflow-hidden border-l border-border bg-card shadow-elevated md:rounded-3xl md:border"
                        style={{
                            width: typeof window !== 'undefined' && window.innerWidth >= 768 ? drawerWidth : undefined,
                            transition: isWidthDragging ? 'none' : undefined,
                            ...dockClearance,
                        }}
                    >
                        {/* Drag-to-resize handle — left edge, desktop only. Wide hit area for easy grab. */}
                        <div
                            onMouseDown={handleWidthDragStart}
                            onTouchStart={handleWidthDragStart}
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
                                    <p className="text-sm font-semibold text-foreground">{drawerTitle}</p>
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
                                <div className="relative">
                                    {/* Quick expand/collapse toggle — top-right of the textarea */}
                                    <button
                                        type="button"
                                        onClick={toggleInputHeight}
                                        className="absolute z-10 rounded p-1 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                                        style={{ right: '0.5rem', top: '0.375rem' }}
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
                                        className="w-full resize-none rounded-xl border border-border bg-secondary/40 px-3 py-2.5 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                                        style={{ height: inputHeight }}
                                    />
                                </div>
                                <div className="mt-1.5 flex items-center justify-between gap-2">
                                    <p className="text-xs text-muted-foreground truncate">
                                        Shift+Enter = nowa linia · przeciągnij górną krawędź, aby powiększyć
                                    </p>
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
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
