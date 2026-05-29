// src/app/dashboard/layout.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { GlobalAIChat } from '@/components/ai/GlobalAIChat';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const router = useRouter();

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
                    <p className="text-sm font-medium text-muted-foreground">Ładowanie...</p>
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') return null;

    return (
        <div className="flex min-h-screen w-full bg-background text-foreground">
            <Sidebar />

            {/* Content area shifts right by sidebar width on lg */}
            <div className="flex min-w-0 flex-1 flex-col lg:pl-[260px]">
                <Header />
                <main className="relative flex-1 overflow-x-hidden">
                    {/* Subtle mesh gradient top overlay */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-gradient-mesh opacity-50" />
                    <div className="relative">{children}</div>
                </main>
            </div>

            <GlobalAIChat />
        </div>
    );
}
