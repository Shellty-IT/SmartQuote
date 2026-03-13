// src/app/dashboard/components/Header.tsx
'use client';

import { useSession } from 'next-auth/react';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Header() {
    const { data: session } = useSession();

    return (
        <header className="h-16 header-themed border-b flex items-center justify-between px-4 sm:px-8 transition-colors duration-300">
            <div />

            <div className="flex items-center gap-4">
                <NotificationBell />

                <div className="flex items-center gap-3 pl-4 border-l divider-themed">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold shadow-md shadow-cyan-500/20">
                        {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-themed">
                            {session?.user?.name || 'Użytkownik'}
                        </p>
                        <p className="text-xs text-themed-muted">{session?.user?.email}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}