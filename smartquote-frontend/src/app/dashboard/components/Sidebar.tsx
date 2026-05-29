// src/app/dashboard/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import {
    LayoutDashboard,
    FileText,
    FileStack,
    ScrollText,
    Users,
    CalendarClock,
    Mail,
    Bell,
    Sparkles,
    Lightbulb,
    Settings,
    LogOut,
    ChevronsLeft,
    Sun,
    Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/app/providers';
import { useTranslations } from '@/i18n';
import { useSidebarStats } from '@/hooks/useSidebarStats';
import { useUnreadCount } from '@/hooks/useNotifications';

type NavKey = 'dashboard' | 'offers' | 'offerTemplates' | 'contracts' | 'clients' | 'followups' | 'correspondence' | 'notifications' | 'aiAssistant' | 'aiInsights';

const NAV_ITEMS: { key: NavKey; href: string; icon: React.ElementType; stat: string | null; badgeTone: 'default' | 'primary' | 'success' | 'info' | 'warning' | 'violet' }[] = [
    { key: 'dashboard',      href: '/dashboard',                 icon: LayoutDashboard, stat: null,        badgeTone: 'default' },
    { key: 'offers',         href: '/dashboard/offers',          icon: FileText,        stat: 'offers',    badgeTone: 'primary' },
    { key: 'offerTemplates', href: '/dashboard/offer-templates', icon: FileStack,       stat: null,        badgeTone: 'default' },
    { key: 'contracts',      href: '/dashboard/contracts',       icon: ScrollText,      stat: 'contracts', badgeTone: 'success' },
    { key: 'clients',        href: '/dashboard/clients',         icon: Users,           stat: 'clients',   badgeTone: 'info'    },
    { key: 'followups',      href: '/dashboard/followups',       icon: CalendarClock,   stat: 'followups', badgeTone: 'warning' },
    { key: 'correspondence', href: '/dashboard/emails',          icon: Mail,            stat: null,        badgeTone: 'default' },
    { key: 'notifications',  href: '/dashboard/notifications',   icon: Bell,            stat: 'notif',     badgeTone: 'violet'  },
    { key: 'aiAssistant',    href: '/dashboard/ai',              icon: Sparkles,        stat: null,        badgeTone: 'default' },
    { key: 'aiInsights',     href: '/dashboard/ai-insights',     icon: Lightbulb,       stat: null,        badgeTone: 'default' },
];

const BADGE_TONE: Record<string, string> = {
    primary: 'bg-gradient-primary text-white',
    success: 'bg-[color-mix(in_oklab,var(--status-accepted)_18%,transparent)] text-[var(--status-accepted)]',
    info:    'bg-[color-mix(in_oklab,var(--status-open)_18%,transparent)] text-[var(--status-open)]',
    warning: 'bg-[oklch(0.65_0.18_60)/18%] text-[oklch(0.55_0.14_60)] dark:text-[oklch(0.78_0.14_60)]',
    violet:  'bg-[oklch(0.93_0.07_300)] text-[oklch(0.4_0.18_300)] dark:bg-[oklch(0.3_0.08_300)] dark:text-[oklch(0.85_0.1_300)]',
    default: 'bg-secondary text-secondary-foreground',
};

export default function Sidebar() {
    const pathname = usePathname();
    const { theme, toggle } = useTheme();
    const { stats, isLoading } = useSidebarStats();
    const { count: unreadNotifications } = useUnreadCount();
    const tr = useTranslations('sidebar');
    const commonTr = useTranslations('common');
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const prevPathname = useRef(pathname);

    useEffect(() => {
        if (prevPathname.current !== pathname) {
            prevPathname.current = pathname;
            setMobileOpen(false);
        }
    }, [pathname]);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    function getBadge(stat: string | null, notif: number): number | null {
        if (stat === 'notif') return notif > 0 ? notif : null;
        if (!stat) return null;
        const v = stats[stat as keyof typeof stats];
        return typeof v === 'number' && v > 0 ? v : null;
    }

    function isActive(href: string): boolean {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname === href || pathname.startsWith(href + '/');
    }

    const sidebarContent = (
        <div className="sticky top-0 flex h-full flex-col">
            {/* Brand */}
            <div className={cn(
                'flex items-center gap-3 border-b border-sidebar-border px-5 pb-5 pt-6',
                collapsed && 'justify-center px-3'
            )}>
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-primary shadow-glow ring-1 ring-white/20">
                    <Image src="/logo.svg" alt="SmartQuote" width={28} height={28} className="object-contain" />
                </div>
                {!collapsed && (
                    <div className="flex min-w-0 flex-col leading-tight">
                        <span className="truncate text-[15px] font-semibold tracking-tight text-sidebar-foreground">
                            SmartQuote
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-primary">
                            AI Suite
                        </span>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
                {!collapsed && (
                    <div className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                        {tr.workspace}
                    </div>
                )}
                {NAV_ITEMS.map((item) => {
                    const active = isActive(item.href);
                    const badge = getBadge(item.stat, unreadNotifications);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                                active
                                    ? 'bg-card text-foreground shadow-card ring-1 ring-border'
                                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                                collapsed && 'justify-center px-2'
                            )}
                        >
                            {active && (
                                <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-gradient-primary" />
                            )}
                            <Icon
                                className={cn(
                                    'h-[18px] w-[18px] shrink-0 transition-colors',
                                    active ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground'
                                )}
                                strokeWidth={2}
                            />
                            {!collapsed && (
                                <>
                                    <span className="flex-1 truncate">{tr.nav[item.key]}</span>
                                    {badge !== null && (
                                        <span className={cn(
                                            'rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums',
                                            isLoading ? 'animate-pulse' : '',
                                            active ? 'bg-gradient-primary text-white' : BADGE_TONE[item.badgeTone],
                                        )}>
                                            {isLoading ? '·' : badge > 9999 ? '9999+' : badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-sidebar-border/70 p-3 space-y-0.5">
                {/* Theme toggle */}
                <button
                    onClick={toggle}
                    aria-label={theme === 'dark' ? commonTr.enableLightMode : commonTr.enableDarkMode}
                    className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                        collapsed && 'justify-center px-2'
                    )}
                >
                    {theme === 'dark'
                        ? <Sun className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                        : <Moon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                    }
                    {!collapsed && (
                        <span>{theme === 'dark' ? commonTr.lightMode : commonTr.darkMode}</span>
                    )}
                </button>

                <Link
                    href="/dashboard/settings"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                        isActive('/dashboard/settings') && 'bg-card text-foreground shadow-card ring-1 ring-border',
                        collapsed && 'justify-center px-2'
                    )}
                >
                    <Settings className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                    {!collapsed && <span>{commonTr.settings}</span>}
                </Link>

                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-all hover:bg-destructive/10 hover:text-destructive',
                        collapsed && 'justify-center px-2'
                    )}
                >
                    <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                    {!collapsed && <span>{commonTr.logout}</span>}
                </button>
            </div>

            {/* Collapse toggle — desktop only */}
            <button
                onClick={() => setCollapsed((c) => !c)}
                className="absolute -right-3 top-20 hidden lg:grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-card transition hover:text-primary"
                aria-label={commonTr.collapsePanel}
            >
                <ChevronsLeft
                    className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')}
                />
            </button>
        </div>
    );

    return (
        <>
            {/* Mobile burger */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed left-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-xl border border-border bg-card shadow-card lg:hidden"
                aria-label={commonTr.openMenu}
            >
                <svg className="h-5 w-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Desktop sidebar */}
            <aside
                className={cn(
                    'hidden lg:flex fixed left-0 top-0 z-40 h-screen flex-col border-r border-sidebar-border bg-gradient-sidebar transition-all duration-300',
                    collapsed ? 'w-[72px]' : 'w-[260px]'
                )}
            >
                {sidebarContent}
            </aside>

            {/* Mobile overlay + drawer */}
            {mobileOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                        onClick={() => setMobileOpen(false)}
                        aria-hidden="true"
                    />
                    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-sidebar-border bg-gradient-sidebar lg:hidden">
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
                            aria-label={commonTr.closeMenu}
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        {sidebarContent}
                    </aside>
                </>
            )}
        </>
    );
}
