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

    // Exposed as a CSS var (not just the Tailwind class above) so the AI drawer's
    // "open" override in globals.css can add its own width on top of this instead
    // of replacing it — otherwise a right-pinned dock's reserved space collapses
    // the moment the drawer opens, and content renders underneath the dock.
    const dockRightClearancePx = position === 'right' ? (collapsed ? 104 : 292) : 0;

    return (
        <div className="flex min-h-screen w-full bg-background text-foreground">
            <FloatingDock />

            {/* Content area shifts to clear the floating dock on lg. The AI drawer's
                padding-right squeeze (see .sq-ai-drawer-open in globals.css) is scoped
                to <main> only, not this wrapper — Header is sticky and always sits above
                the drawer's top offset (OfferAIDrawer's dockClearance.top), so it never
                needs to make horizontal room for it. Squeezing it too just pushed its
                right-aligned controls (language/theme/bell/profile) left, straight under
                the centered top-pinned dock. */}
            <div
                className={cn('flex min-w-0 flex-1 flex-col transition-all duration-300', dockClearance)}
                style={{ '--sq-dock-right-clearance': `${dockRightClearancePx}px` } as React.CSSProperties}
            >
                <Header onSearchOpen={() => setIsSearchOpen(true)} />
                <main className="sq-dashboard-content relative flex-1 overflow-x-hidden transition-all duration-300">
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
