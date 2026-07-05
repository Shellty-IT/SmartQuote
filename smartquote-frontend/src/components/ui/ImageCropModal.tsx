'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from './Modal';
import Button from './Button';

interface ImageCropModalProps {
    file: File;
    title: string;
    /** Crop frame aspect ratio (width / height). 1 = square. */
    aspect?: number;
    /** Circular crop frame (avatar) vs. rectangular (logo). */
    shape?: 'circle' | 'rect';
    /** Pixel dimensions of the exported image. */
    outputWidth?: number;
    outputHeight?: number;
    quality?: number;
    onCancel: () => void;
    onConfirm: (dataUrl: string) => void;
}

const FRAME_WIDTH = 280;

export default function ImageCropModal({
    file,
    title,
    aspect = 1,
    shape = 'rect',
    outputWidth = 400,
    outputHeight,
    quality = 0.85,
    onCancel,
    onConfirm,
}: ImageCropModalProps) {
    const frameHeight = FRAME_WIDTH / aspect;
    const resolvedOutputHeight = outputHeight ?? Math.round(outputWidth / aspect);

    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [natural, setNatural] = useState({ width: 0, height: 0 });
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null);

    useEffect(() => {
        const reader = new FileReader();
        reader.onload = (e) => setImgSrc(e.target?.result as string);
        reader.readAsDataURL(file);
    }, [file]);

    useEffect(() => {
        if (!imgSrc) return;
        const img = new window.Image();
        img.onload = () => {
            setNatural({ width: img.naturalWidth, height: img.naturalHeight });
            setZoom(1);
            setOffset({ x: 0, y: 0 });
        };
        img.src = imgSrc;
    }, [imgSrc]);

    // Base scale makes the image fully cover the crop frame at zoom = 1.
    const baseScale = natural.width > 0
        ? Math.max(FRAME_WIDTH / natural.width, frameHeight / natural.height)
        : 1;
    const scale = baseScale * zoom;
    const displayWidth = natural.width * scale;
    const displayHeight = natural.height * scale;

    const clampOffset = (x: number, y: number) => {
        const minX = Math.min(0, FRAME_WIDTH - displayWidth);
        const minY = Math.min(0, frameHeight - displayHeight);
        return {
            x: Math.max(minX, Math.min(0, x)),
            y: Math.max(minY, Math.min(0, y)),
        };
    };

    // Re-clamp whenever zoom (or the image) changes the display size.
    useEffect(() => {
        setOffset((prev) => clampOffset(prev.x, prev.y));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zoom, natural.width, natural.height]);

    const handlePointerDown = (e: React.PointerEvent) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        dragRef.current = { startX: e.clientX, startY: e.clientY, startOffsetX: offset.x, startOffsetY: offset.y };
        setIsDragging(true);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setOffset(clampOffset(dragRef.current.startOffsetX + dx, dragRef.current.startOffsetY + dy));
    };

    const handlePointerUp = () => {
        dragRef.current = null;
        setIsDragging(false);
    };

    const previewStyle = useMemo(() => ({
        width: displayWidth,
        height: displayHeight,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
    }), [displayWidth, displayHeight, offset]);

    const handleConfirm = () => {
        if (!imgSrc || natural.width === 0) return;
        const img = new window.Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = outputWidth;
            canvas.height = resolvedOutputHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Map the visible crop frame back into natural image coordinates.
            const cropX = -offset.x / scale;
            const cropY = -offset.y / scale;
            const cropWidth = FRAME_WIDTH / scale;
            const cropHeight = frameHeight / scale;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, outputWidth, resolvedOutputHeight);
            onConfirm(canvas.toDataURL('image/webp', quality));
        };
        img.src = imgSrc;
    };

    return (
        <Modal isOpen onClose={onCancel} title={title} size="sm">
            <div className="flex flex-col items-center gap-4">
                <div
                    className="relative overflow-hidden bg-secondary touch-none select-none"
                    style={{
                        width: FRAME_WIDTH,
                        height: frameHeight,
                        borderRadius: shape === 'circle' ? '9999px' : '12px',
                        cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                >
                    {imgSrc && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={imgSrc}
                            alt=""
                            draggable={false}
                            className="absolute left-0 top-0 max-w-none"
                            style={previewStyle}
                        />
                    )}
                </div>

                <div className="flex w-full max-w-[280px] items-center gap-3">
                    <span className="text-xs text-muted-foreground">Powiększenie</span>
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1"
                    />
                </div>
                <p className="text-xs text-muted-foreground">Przeciągnij zdjęcie, aby ustawić kadr.</p>

                <div className="flex w-full items-center justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={onCancel}>Anuluj</Button>
                    <Button onClick={handleConfirm} disabled={!imgSrc}>Zapisz</Button>
                </div>
            </div>
        </Modal>
    );
}
