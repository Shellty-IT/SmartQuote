// src/app/dashboard/components/Header.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Sun, Moon, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/app/providers';
import { useTranslations, useLanguage } from '@/i18n';
import { useUnreadCount } from '@/hooks/useNotifications';
import { settingsApi } from '@/lib/api';
import { getInitials } from '@/lib/utils';

interface HeaderProps {
    onSearchOpen?: () => void;
}

export default function Header({ onSearchOpen }: HeaderProps) {
    const { data: session } = useSession();
    const { theme, toggle } = useTheme();
    const { language, setLanguage } = useLanguage();
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
            {/* Search — opens command palette */}
            <button
                onClick={onSearchOpen}
                className={cn(
                    'relative flex flex-1 max-w-sm items-center gap-2 h-9 rounded-lg border border-border bg-secondary/60 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-card',
                    searchOpen && 'flex-1 max-w-full',
                )}
            >
                <Search className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left truncate">{commonTr.search}</span>
                <kbd className="hidden shrink-0 rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] sm:block">
                    Ctrl K
                </kbd>
            </button>

            {/* Right controls — ml-auto pushes to right edge regardless of search width */}
            <div className="ml-auto flex shrink-0 items-center gap-2">
                {/* Language switcher */}
                <div className="flex items-center rounded-lg border border-border bg-card overflow-hidden">
                    <button
                        onClick={() => setLanguage('pl')}
                        aria-label="Polski"
                        className={cn(
                            'h-9 px-2.5 text-xs font-semibold transition-colors',
                            language === 'pl'
                                ? 'bg-gradient-primary text-white'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        PL
                    </button>
                    <button
                        onClick={() => setLanguage('en')}
                        aria-label="English"
                        className={cn(
                            'h-9 px-2.5 text-xs font-semibold transition-colors',
                            language === 'en'
                                ? 'bg-gradient-primary text-white'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        EN
                    </button>
                </div>

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
