// src/hooks/useResizablePanel.ts
// Drag-to-resize panel hook — shared by all document editors.
import { useState, useRef, useCallback, useEffect } from 'react'

const MIN_WIDTH = 320
const MAX_WIDTH_RATIO = 0.55

export function useResizablePanel(storageKey: string, defaultWidth = 380) {
    const [panelWidth, setPanelWidth] = useState<number>(() => {
        if (typeof window === 'undefined') return defaultWidth
        try {
            const saved = localStorage.getItem(storageKey)
            if (saved) return Math.max(MIN_WIDTH, Math.min(window.innerWidth * MAX_WIDTH_RATIO, parseInt(saved)))
        } catch { /* ignore */ }
        return defaultWidth
    })

    const widthRef = useRef(panelWidth)
    useEffect(() => { widthRef.current = panelWidth }, [panelWidth])

    const onResizeMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault()
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
        [storageKey],
    )

    return { panelWidth, onResizeMouseDown }
}
