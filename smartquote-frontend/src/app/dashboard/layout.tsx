// src/app/dashboard/layout.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import FloatingDock from './components/FloatingDock';
import Header from './components/Header';
import { GlobalAIChat } from '@/components/ai/GlobalAIChat';
import CommandPalette from '@/components/search/CommandPalette';
import { useTranslations } from '@/i18n';
import { useDockSettings } from '@/app/providers';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const router = useRouter();
    const commonTr = useTranslations('common');
    const { position, collapsed } = useDockSettings();
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            setIsSearchOpen(true);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm font-medium text-muted-foreground">{commonTr.loading}</p>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') return null;

    // Content reserves space on side/bottom edges. The top dock shares the header row.
    const dockClearance = position === 'bottom'
        ? 'lg:pb-24'
        : position === 'right'
            ? (collapsed ? 'lg:pr-[104px]' : 'lg:pr-[292px]')
            : position === 'left'
                ? (collapsed ? 'lg:pl-[104px]' : 'lg:pl-[292px]')
                : '';

    return (
        <div className="flex min-h-screen w-full bg-background text-foreground">
            <FloatingDock />

            {/* Content area shifts to clear the floating dock on lg */}
            <div className={cn(
                'sq-dashboard-content flex min-w-0 flex-1 flex-col transition-all duration-300',
                dockClearance
            )}>
                <Header onSearchOpen={() => setIsSearchOpen(true)} />
                <main className="relative flex-1 overflow-x-hidden">
                    {/* Subtle mesh gradient top overlay */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-gradient-mesh opacity-50" />
                    <div className="relative">{children}</div>
                </main>
            </div>

            <GlobalAIChat />
            <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
}
