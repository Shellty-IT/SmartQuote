// src/hooks/useResizablePanel.ts
// Drag-to-resize panel hook shared by document editors.
import {
    useState,
    useRef,
    useCallback,
    useEffect,
    type CSSProperties,
    type MouseEvent as ReactMouseEvent,
} from 'react'

const MIN_WIDTH = 320
const MAX_WIDTH_RATIO = 0.55
const DEFAULT_WIDTH = 380

const DEFAULT_PREVIEW_RATIO = 0.55
const MIN_PREVIEW_WIDTH = 320
const MIN_EDITOR_WIDTH = 280
const HANDLE_WIDTH = 8

type PreviewRatioOptions = {
    mode: 'preview-ratio'
    defaultPreviewRatio?: number
    minPreviewWidth?: number
    minEditorWidth?: number
    handleWidth?: number
}

type PanelWidthOptions = {
    mode?: 'panel-width'
    defaultWidth?: number
}

type ResizablePanelOptions = PreviewRatioOptions | PanelWidthOptions

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function isPreviewRatioOptions(options: number | ResizablePanelOptions): options is PreviewRatioOptions {
    return typeof options === 'object' && options.mode === 'preview-ratio'
}

export function useResizablePanel(storageKey: string, options: number | ResizablePanelOptions = DEFAULT_WIDTH) {
    const previewMode = isPreviewRatioOptions(options)
    const defaultWidth = typeof options === 'number'
        ? options
        : previewMode ? DEFAULT_WIDTH : options.defaultWidth ?? DEFAULT_WIDTH
    const defaultPreviewRatio = previewMode ? options.defaultPreviewRatio ?? DEFAULT_PREVIEW_RATIO : DEFAULT_PREVIEW_RATIO
    const minPreviewWidth = previewMode ? options.minPreviewWidth ?? MIN_PREVIEW_WIDTH : MIN_PREVIEW_WIDTH
    const minEditorWidth = previewMode ? options.minEditorWidth ?? MIN_EDITOR_WIDTH : MIN_EDITOR_WIDTH
    const handleWidth = previewMode ? options.handleWidth ?? HANDLE_WIDTH : HANDLE_WIDTH

    const containerRef = useRef<HTMLDivElement | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    const [panelWidth, setPanelWidth] = useState<number>(() => {
        if (typeof window === 'undefined') return defaultWidth
        try {
            const saved = localStorage.getItem(storageKey)
            if (saved) return Math.max(MIN_WIDTH, Math.min(window.innerWidth * MAX_WIDTH_RATIO, parseInt(saved, 10)))
        } catch { /* ignore */ }
        return defaultWidth
    })

    const [previewRatio, setPreviewRatio] = useState<number>(() => {
        if (typeof window === 'undefined') return defaultPreviewRatio
        try {
            const saved = localStorage.getItem(storageKey)
            if (saved) {
                const parsed = parseFloat(saved)
                if (Number.isFinite(parsed) && parsed > 0 && parsed < 1) return parsed
            }
        } catch { /* ignore */ }
        return defaultPreviewRatio
    })

    const widthRef = useRef(panelWidth)
    const ratioRef = useRef(previewRatio)

    useEffect(() => { widthRef.current = panelWidth }, [panelWidth])
    useEffect(() => { ratioRef.current = previewRatio }, [previewRatio])

    const clampPreviewRatio = useCallback(
        (ratio: number, containerWidth: number) => {
            const availableWidth = Math.max(1, containerWidth - handleWidth)
            const minRatio = minPreviewWidth / availableWidth
            const maxRatio = (availableWidth - minEditorWidth) / availableWidth

            if (minRatio > maxRatio) return clamp(ratio, 0, 1)
            return clamp(ratio, minRatio, maxRatio)
        },
        [handleWidth, minEditorWidth, minPreviewWidth],
    )

    useEffect(() => {
        if (!previewMode || typeof window === 'undefined') return

        const handleResize = () => {
            const containerWidth = containerRef.current?.getBoundingClientRect().width
            if (!containerWidth) return

            setPreviewRatio(current => {
                const next = clampPreviewRatio(current, containerWidth)
                ratioRef.current = next
                return next
            })
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [clampPreviewRatio, previewMode])

    const onResizeMouseDown = useCallback(
        (e: ReactMouseEvent) => {
            e.preventDefault()

            if (previewMode) {
                const container = containerRef.current
                if (!container) return

                setIsDragging(true)

                const updateRatio = (clientX: number) => {
                    const rect = container.getBoundingClientRect()
                    const availableWidth = Math.max(1, rect.width - handleWidth)
                    const previewWidth = clientX - rect.left
                    const nextRatio = clampPreviewRatio(previewWidth / availableWidth, rect.width)

                    setPreviewRatio(nextRatio)
                    ratioRef.current = nextRatio
                }

                const onMouseMove = (ev: MouseEvent) => updateRatio(ev.clientX)

                const onMouseUp = () => {
                    setIsDragging(false)
                    try { localStorage.setItem(storageKey, String(ratioRef.current)) } catch { /* quota */ }
                    document.removeEventListener('mousemove', onMouseMove)
                    document.removeEventListener('mouseup', onMouseUp)
                }

                document.addEventListener('mousemove', onMouseMove)
                document.addEventListener('mouseup', onMouseUp)
                return
            }

            const startX = e.clientX
            const startWidth = widthRef.current

            const onMouseMove = (ev: MouseEvent) => {
                const delta = startX - ev.clientX
                const maxW = window.innerWidth * MAX_WIDTH_RATIO
                const newW = Math.min(maxW, Math.max(MIN_WIDTH, startWidth + delta))
                setPanelWidth(newW)
                widthRef.current = newW
            }

            const onMouseUp = () => {
                try { localStorage.setItem(storageKey, String(widthRef.current)) } catch { /* quota */ }
                document.removeEventListener('mousemove', onMouseMove)
                document.removeEventListener('mouseup', onMouseUp)
            }

            document.addEventListener('mousemove', onMouseMove)
            document.addEventListener('mouseup', onMouseUp)
        },
        [clampPreviewRatio, handleWidth, previewMode, storageKey],
    )

    const previewPanelStyle: CSSProperties = {
        flex: `0 0 calc(${previewRatio * 100}% - ${handleWidth * previewRatio}px)`,
        minWidth: minPreviewWidth,
        transition: isDragging ? 'none' : undefined,
    }

    const editorPanelStyle: CSSProperties = {
        flex: '1 1 0',
        minWidth: minEditorWidth,
        transition: isDragging ? 'none' : undefined,
    }

    const handleStyle: CSSProperties = {
        flex: `0 0 ${handleWidth}px`,
        transition: isDragging ? 'none' : undefined,
    }

    return {
        panelWidth,
        previewRatio,
        containerRef,
        previewPanelStyle,
        editorPanelStyle,
        handleStyle,
        isDragging,
        onResizeMouseDown,
    }
}
