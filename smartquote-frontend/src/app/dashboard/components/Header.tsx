// src/app/dashboard/components/Header.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import NotificationBell from '@/components/notifications/NotificationBell';
import { settingsApi } from '@/lib/api';

export default function Header() {
    const { data: session } = useSession();
    const [avatar, setAvatar] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        settingsApi.getProfile()
            .then(profile => {
                if (!cancelled) setAvatar(profile.avatar || null);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    const displayName = session?.user?.name || 'Użytkownik';
    const initials = displayName
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');

    return (
        <header className="h-16 header-themed border-b flex items-center justify-between px-4 sm:px-8 transition-colors duration-300">
            <div />

            <div className="flex items-center gap-4">
                <NotificationBell />

                <div className="flex items-center gap-3 pl-4 border-l divider-themed">
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 shadow-md shadow-cyan-500/20">
                        {avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={avatar}
                                alt={displayName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                                {initials}
                            </div>
                        )}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-themed">
                            {displayName}
                        </p>
                        <p className="text-xs text-themed-muted">{session?.user?.email}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}