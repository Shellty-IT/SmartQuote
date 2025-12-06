// src/app/dashboard/components/Header.tsx

'use client';

import { useSession } from 'next-auth/react';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Header() {
    const { data: session } = useSession();

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
            {/* Left side - można dodać breadcrumbs lub tytuł strony */}
            <div></div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Notification Bell */}
                <NotificationBell />

                {/* User info */}
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                        {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-slate-900">
                            {session?.user?.name || 'Użytkownik'}
                        </p>
                        <p className="text-xs text-slate-500">{session?.user?.email}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}