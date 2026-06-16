'use client'
import { useState, useCallback } from 'react'

export const ZOOM_LEVELS = [0.5, 0.65, 0.8, 1.0, 1.25, 1.5] as const
export type ZoomLevel = (typeof ZOOM_LEVELS)[number]

export const ZOOM_LABELS: Record<number, string> = {
    0.5: '50%', 0.65: '65%', 0.8: '80%', 1.0: '100%', 1.25: '125%', 1.5: '150%',
}

export function useZoom(initial = 0.8) {
    const [zoom, setZoom] = useState(initial)

    const zoomIn = useCallback(() => {
        setZoom(z => {
            const idx = ZOOM_LEVELS.indexOf(z as ZoomLevel)
            return idx < ZOOM_LEVELS.length - 1 ? ZOOM_LEVELS[idx + 1] : z
        })
    }, [])

    const zoomOut = useCallback(() => {
        setZoom(z => {
            const idx = ZOOM_LEVELS.indexOf(z as ZoomLevel)
            return idx > 0 ? ZOOM_LEVELS[idx - 1] : z
        })
    }, [])

    return { zoom, zoomIn, zoomOut }
}
