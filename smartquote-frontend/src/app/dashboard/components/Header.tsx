// src/app/dashboard/components/Header.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Sun, Moon, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/app/providers';
import { useTranslations } from '@/i18n';
import { useUnreadCount } from '@/hooks/useNotifications';
import { settingsApi } from '@/lib/api';
import { getInitials } from '@/lib/utils';

export default function Header() {
    const { data: session } = useSession();
    const { theme, toggle } = useTheme();
    const { count: unreadCount } = useUnreadCount();
    const commonTr = useTranslations('common');
    const settingsTr = useTranslations('settings');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        settingsApi.getProfile()
            .then(profile => {
                if (!cancelled) setAvatar(profile.avatar || null);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    const displayName = session?.user?.name || settingsTr.profile.userFallback;
    const email = session?.user?.email || '';
    const initials = getInitials(displayName);

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
            {/* Search */}
            <div className={cn('relative transition-all duration-200', searchOpen ? 'flex-1' : 'flex-1 max-w-sm')}>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    placeholder={commonTr.search}
                    onFocus={() => setSearchOpen(true)}
                    onBlur={() => setSearchOpen(false)}
                    className="h-9 w-full rounded-lg border border-border bg-secondary/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
            </div>

            {/* Right controls — ml-auto pushes to right edge regardless of search width */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
                {/* Theme toggle */}
                <button
                    onClick={toggle}
                    aria-label={theme === 'dark' ? commonTr.enableLightMode : commonTr.enableDarkMode}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground"
                >
                    {theme === 'dark'
                        ? <Sun className="h-4 w-4" />
                        : <Moon className="h-4 w-4" />
                    }
                </button>

                {/* Notification bell */}
                <Link
                    href="/dashboard/notifications"
                    className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-foreground"
                    aria-label={commonTr.notifications}
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-primary px-1 text-[9px] font-bold leading-none text-white shadow-glow ring-2 ring-background">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Link>

                {/* Profile chip */}
                <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-2 py-1.5 pr-3 shadow-sm transition hover:bg-secondary"
                >
                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg">
                        {avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-primary text-[11px] font-bold text-white">
                                {initials}
                            </div>
                        )}
                    </div>
                    <div className="hidden text-right leading-tight sm:block">
                        <div className="text-xs font-semibold text-foreground">{displayName}</div>
                        <div className="max-w-[140px] truncate text-[10px] text-muted-foreground">{email}</div>
                    </div>
                </Link>
            </div>
        </header>
    );
}
