'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { AIChatProvider } from '@/contexts/AIChatContext';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <AIChatProvider>
                {children}
            </AIChatProvider>
        </SessionProvider>
    );
}