'use client';
import { useCallback, useRef, useState } from 'react';

export function useAutoSave<T>(
    saveFn: (value: T) => Promise<void>,
    delay = 800,
) {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onChange = useCallback((value: T) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setError(null);
        timerRef.current = setTimeout(async () => {
            setIsSaving(true);
            try {
                await saveFn(value);
                setLastSaved(new Date());
            } catch {
                setError('Błąd zapisu');
            } finally {
                setIsSaving(false);
            }
        }, delay);
    }, [saveFn, delay]);

    return { onChange, isSaving, lastSaved, error };
}
