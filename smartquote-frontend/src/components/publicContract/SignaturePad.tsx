// src/components/publicContract/SignaturePad.tsx
'use client';

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface SignaturePadRef {
    clear: () => void;
    isEmpty: () => boolean;
    toDataURL: () => string;
}

interface SignaturePadProps {
    penColor?: string;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
    ({ penColor = '#1e293b' }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const isDrawingRef = useRef(false);
        const hasContentRef = useRef(false);

        const getCtx = useCallback((): CanvasRenderingContext2D | null => {
            const canvas = canvasRef.current;
            if (!canvas) return null;
            return canvas.getContext('2d');
        }, []);

        const getCoords = useCallback((e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
            const canvas = canvasRef.current;
            if (!canvas) return null;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            if ('touches' in e) {
                const touch = e.touches[0];
                if (!touch) return null;
                return {
                    x: (touch.clientX - rect.left) * scaleX,
                    y: (touch.clientY - rect.top) * scaleY,
                };
            }
            return {
                x: ((e as MouseEvent).clientX - rect.left) * scaleX,
                y: ((e as MouseEvent).clientY - rect.top) * scaleY,
            };
        }, []);

        const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            const coords = getCoords(e);
            if (!coords) return;
            const ctx = getCtx();
            if (!ctx) return;

            isDrawingRef.current = true;
            ctx.beginPath();
            ctx.moveTo(coords.x, coords.y);
        }, [getCoords, getCtx]);

        const draw = useCallback((e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            if (!isDrawingRef.current) return;
            const coords = getCoords(e);
            if (!coords) return;
            const ctx = getCtx();
            if (!ctx) return;

            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
            hasContentRef.current = true;
        }, [getCoords, getCtx]);

        const stopDrawing = useCallback(() => {
            isDrawingRef.current = false;
        }, []);

        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = penColor;
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const handleMouseDown = (e: MouseEvent) => startDrawing(e);
            const handleMouseMove = (e: MouseEvent) => draw(e);
            const handleMouseUp = () => stopDrawing();
            const handleTouchStart = (e: TouchEvent) => startDrawing(e);
            const handleTouchMove = (e: TouchEvent) => draw(e);
            const handleTouchEnd = () => stopDrawing();

            canvas.addEventListener('mousedown', handleMouseDown);
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('mouseup', handleMouseUp);
            canvas.addEventListener('mouseleave', handleMouseUp);
            canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
            canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
            canvas.addEventListener('touchend', handleTouchEnd);

            return () => {
                canvas.removeEventListener('mousedown', handleMouseDown);
                canvas.removeEventListener('mousemove', handleMouseMove);
                canvas.removeEventListener('mouseup', handleMouseUp);
                canvas.removeEventListener('mouseleave', handleMouseUp);
                canvas.removeEventListener('touchstart', handleTouchStart);
                canvas.removeEventListener('touchmove', handleTouchMove);
                canvas.removeEventListener('touchend', handleTouchEnd);
            };
        }, [penColor, startDrawing, draw, stopDrawing]);

        useImperativeHandle(ref, () => ({
            clear: () => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = penColor;
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                hasContentRef.current = false;
            },
            isEmpty: () => !hasContentRef.current,
            toDataURL: () => {
                const canvas = canvasRef.current;
                if (!canvas) return '';
                return canvas.toDataURL('image/png');
            },
        }));

        return (
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    aria-label="Pole podpisu elektronicznego"
                    style={{
                        width: '100%',
                        height: 'auto',
                        border: '2px solid #d1d5db',
                        borderRadius: '12px',
                        cursor: 'crosshair',
                        touchAction: 'none',
                        backgroundColor: '#ffffff',
                    }}
                />
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ opacity: hasContentRef.current ? 0 : 0.3 }}
                >
                    <p className="text-slate-400 text-sm select-none">Narysuj podpis tutaj</p>
                </div>
            </div>
        );
    }
);

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;