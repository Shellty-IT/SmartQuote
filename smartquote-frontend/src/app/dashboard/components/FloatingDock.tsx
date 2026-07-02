// src/app/dashboard/components/FloatingDock.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    LayoutDashboard,
    FileText,
    FileStack,
    ScrollText,
    Users,
    UserSearch,
    CalendarClock,
    CalendarDays,
    Mail,
    Bell,
    Sparkles,
    Lightbulb,
    Settings,
    LogOut,
    ChevronsLeft,
    GripVertical,
    GripHorizontal,
    Pin,
    PanelTop,
    PanelLeft,
    PanelRight,
    PanelBottom,
    Move,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/i18n';
import { useDockSettings, type DockPosition } from '@/app/providers';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal';
import { useSidebarStats } from '@/hooks/useSidebarStats';
import { useUnreadCount } from '@/hooks/useNotifications';

type NavKey = 'dashboard' | 'offers' | 'offerTemplates' | 'contracts' | 'clients' | 'leads' | 'followups' | 'calendar' | 'correspondence' | 'notifications' | 'aiAssistant' | 'aiInsights';

// Ordering follows the CRM sales funnel: capture (leads) → convert (clients) →
// sell (offers → contracts) → supporting tools → activity/comms → AI.
const NAV_ITEMS: { key: NavKey; href: string; icon: React.ElementType; stat: string | null; badgeTone: 'default' | 'primary' | 'success' | 'info' | 'warning' | 'violet' }[] = [
    { key: 'dashboard',      href: '/dashboard',                 icon: LayoutDashboard, stat: null,        badgeTone: 'default' },
    { key: 'leads',          href: '/dashboard/leads',           icon: UserSearch,      stat: 'leads',     badgeTone: 'warning' },
    { key: 'clients',        href: '/dashboard/clients',         icon: Users,           stat: 'clients',   badgeTone: 'info'    },
    { key: 'offers',         href: '/dashboard/offers',          icon: FileText,        stat: 'offers',    badgeTone: 'primary' },
    { key: 'contracts',      href: '/dashboard/contracts',       icon: ScrollText,      stat: 'contracts', badgeTone: 'success' },
    { key: 'offerTemplates', href: '/dashboard/offer-templates', icon: FileStack,       stat: null,        badgeTone: 'default' },
    { key: 'followups',      href: '/dashboard/followups',       icon: CalendarClock,   stat: 'followups', badgeTone: 'warning' },
    { key: 'calendar',       href: '/dashboard/calendar',        icon: CalendarDays,    stat: null,        badgeTone: 'default' },
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

const BADGE_DOT_TONE: Record<string, string> = {
    primary: 'bg-primary',
    success: 'bg-[var(--status-accepted)]',
    info:    'bg-[var(--status-open)]',
    warning: 'bg-[oklch(0.65_0.18_60)]',
    violet:  'bg-[oklch(0.6_0.18_300)]',
    default: 'bg-muted-foreground',
};

const DOCK_EXPANDED_W = 260;
const DOCK_COLLAPSED_W = 72;
const EDGE = 16;
const SNAP = 72;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

interface DragState {
    x: number;
    y: number;
    pointerX: number;
    pointerY: number;
}

export default function FloatingDock() {
    const pathname = usePathname();
    const { position, setPosition, collapsed, setCollapsed, floatCoords, setFloatCoords } = useDockSettings();
    const { stats, loading } = useSidebarStats();
    const { count: unreadNotifications } = useUnreadCount();
    const tr = useTranslations('sidebar');
    const commonTr = useTranslations('common');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [privacyOpen, setPrivacyOpen] = useState(false);
    const prevPathname = useRef(pathname);

    const panelRef = useRef<HTMLDivElement>(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const dragRef = useRef<DragState | null>(null);
    const activePointerId = useRef<number | null>(null);
    const rafId = useRef<number | null>(null);
    const [drag, setDrag] = useState<DragState | null>(null);
    const isDragging = drag !== null;

    const cancelScheduledDrag = useCallback(() => {
        if (rafId.current !== null) {
            cancelAnimationFrame(rafId.current);
            rafId.current = null;
        }
    }, []);

    useEffect(() => () => {
        cancelScheduledDrag();
    }, [cancelScheduledDrag]);

    const panelWidth = collapsed ? DOCK_COLLAPSED_W : DOCK_EXPANDED_W;

    // Only the floating (unpinned) position needs the panel clamped inside the viewport on resize.
    useEffect(() => {
        if (position !== 'floating') return;

        const clampToViewport = () => {
            const height = panelRef.current?.getBoundingClientRect().height ?? 560;
            const x = clamp(floatCoords.x, EDGE, window.innerWidth - panelWidth - EDGE);
            const y = clamp(floatCoords.y, EDGE, window.innerHeight - Math.min(height, window.innerHeight - EDGE * 2) - EDGE);
            if (x !== floatCoords.x || y !== floatCoords.y) {
                setFloatCoords({ x, y });
            }
        };

        clampToViewport();
        window.addEventListener('resize', clampToViewport);
        return () => window.removeEventListener('resize', clampToViewport);
    }, [position, floatCoords, panelWidth, setFloatCoords]);

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

    function getBadge(stat: string | null, notif: number): number | 'loading' | null {
        if (stat === 'notif') return notif > 0 ? notif : null;
        if (!stat) return null;
        if (loading[stat as keyof typeof loading]) return 'loading';
        const v = stats[stat as keyof typeof stats];
        return typeof v === 'number' && v > 0 ? v : null;
    }

    function isActive(href: string): boolean {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname === href || pathname.startsWith(href + '/');
    }

    const updateDragPosition = useCallback((clientX: number, clientY: number) => {
        const nextDrag = {
            x: clientX - dragOffset.current.x,
            y: clientY - dragOffset.current.y,
            pointerX: clientX,
            pointerY: clientY,
        };
        dragRef.current = nextDrag;
        cancelScheduledDrag();
        rafId.current = requestAnimationFrame(() => {
            rafId.current = null;
            if (activePointerId.current === null) return;
            setDrag(nextDrag);
        });
    }, [cancelScheduledDrag]);

    const cancelDrag = useCallback(() => {
        activePointerId.current = null;
        dragRef.current = null;
        cancelScheduledDrag();
        setDrag(null);
    }, [cancelScheduledDrag]);

    const finishDrag = useCallback((clientX: number, clientY: number) => {
        const currentDrag = dragRef.current;
        if (!currentDrag) return;

        activePointerId.current = null;
        cancelScheduledDrag();

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        if (clientY <= SNAP) {
            setPosition('top');
        } else if (clientX <= SNAP) {
            setPosition('left');
        } else if (vw - clientX <= SNAP) {
            setPosition('right');
        } else if (vh - clientY <= SNAP) {
            setPosition('bottom');
        } else {
            const height = panelRef.current?.getBoundingClientRect().height ?? 560;
            setFloatCoords({
                x: clamp(currentDrag.x, EDGE, vw - panelWidth - EDGE),
                y: clamp(currentDrag.y, EDGE, vh - Math.min(height, vh - EDGE * 2) - EDGE),
            });
            setPosition('floating');
        }

        dragRef.current = null;
        setDrag(null);
    }, [cancelScheduledDrag, panelWidth, setFloatCoords, setPosition]);

    useEffect(() => {
        if (!isDragging) return;

        const handlePointerMove = (event: PointerEvent) => {
            if (event.pointerId !== activePointerId.current) return;
            event.preventDefault();
            updateDragPosition(event.clientX, event.clientY);
        };

        const handlePointerUp = (event: PointerEvent) => {
            if (event.pointerId !== activePointerId.current) return;
            event.preventDefault();
            finishDrag(event.clientX, event.clientY);
        };

        const handlePointerCancel = (event: PointerEvent) => {
            if (event.pointerId !== activePointerId.current) return;
            cancelDrag();
        };

        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
        window.addEventListener('pointermove', handlePointerMove, { passive: false });
        window.addEventListener('pointerup', handlePointerUp, { passive: false });
        window.addEventListener('pointercancel', handlePointerCancel);

        return () => {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerCancel);
        };
    }, [cancelDrag, finishDrag, isDragging, updateDragPosition]);

    // Manual pointer-capture drag: the handle captures the pointer so move/up keep
    // firing on it even once the cursor leaves the dock — no gesture library needed.
    function startDrag(e: React.PointerEvent) {
        if (e.button !== 0) return;
        e.preventDefault();
        const rect = panelRef.current?.getBoundingClientRect();
        dragOffset.current = rect
            ? { x: clamp(e.clientX - rect.left, 12, panelWidth - 48), y: clamp(e.clientY - rect.top, 8, 48) }
            : { x: 24, y: 24 };
        activePointerId.current = e.pointerId;
        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
        }
        const nextDrag = {
            x: e.clientX - dragOffset.current.x,
            y: e.clientY - dragOffset.current.y,
            pointerX: e.clientX,
            pointerY: e.clientY,
        };
        dragRef.current = nextDrag;
        setDrag(nextDrag);
    }

    const nearTop = isDragging && drag.pointerY <= SNAP;
    const nearLeft = isDragging && !nearTop && drag.pointerX <= SNAP;
    const nearRight = isDragging && !nearTop && !nearLeft && window.innerWidth - drag.pointerX <= SNAP;
    const nearBottom = isDragging && !nearTop && !nearLeft && !nearRight && window.innerHeight - drag.pointerY <= SNAP;

    const isHorizontalMode = position === 'top' || position === 'bottom';
    const showHorizontal = isHorizontalMode && !isDragging;
    const tooltipSide = showHorizontal ? (position === 'top' ? 'bottom' : 'top') : position === 'right' ? 'left' : 'right';

    const DOCK_POSITION_OPTIONS: { value: DockPosition; label: string; icon: React.ElementType }[] = [
        { value: 'top',      label: commonTr.dockPinTop,      icon: PanelTop },
        { value: 'left',     label: commonTr.dockPinLeft,     icon: PanelLeft },
        { value: 'right',    label: commonTr.dockPinRight,    icon: PanelRight },
        { value: 'bottom',   label: commonTr.dockPinBottom,   icon: PanelBottom },
        { value: 'floating', label: commonTr.dockPinFloating, icon: Move },
    ];

    function pinMenu(side: 'top' | 'right' | 'bottom' | 'left') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        aria-label={commonTr.dockPositionMenu}
                        title={commonTr.dockPositionMenu}
                        className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg text-muted-foreground/70 transition hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    >
                        <Pin className="h-3.5 w-3.5" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side={side} align="end" className="w-56">
                    <DropdownMenuLabel>{commonTr.dockPositionLabel}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {DOCK_POSITION_OPTIONS.map((option) => (
                        <DropdownMenuItem
                            key={option.value}
                            onClick={() => setPosition(option.value)}
                            className={cn('gap-2', position === option.value && 'text-primary')}
                        >
                            <option.icon className="h-4 w-4" />
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    const gripHandle = (
        <button
            type="button"
            aria-label={commonTr.dockDragHandle}
            title={commonTr.dockDragHandle}
            onPointerDown={startDrag}
            onPointerCancel={cancelDrag}
            className={cn(
                'flex shrink-0 touch-none select-none items-center justify-center rounded-lg text-muted-foreground/60 transition hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                showHorizontal ? 'h-9 w-7' : 'h-7 w-5',
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
        >
            {showHorizontal ? <GripHorizontal className="h-4 w-4" /> : <GripVertical className="h-4 w-4" />}
        </button>
    );

    const verticalContent = (
        <div className="flex h-full flex-col">
            {/* Brand */}
            <div className={cn(
                'flex items-center gap-1.5 border-b border-sidebar-border px-3 pb-3.5 pt-3',
                collapsed && 'flex-col gap-2'
            )}>
                {gripHandle}
                <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl">
                        <Image src="/logo.svg" alt="SmartQuote" width={36} height={36} className="h-full w-full object-contain" />
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
                </Link>

                {!collapsed && (
                    <div className="ml-auto flex items-center gap-0.5">
                        {pinMenu('right')}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => setCollapsed(true)}
                                    aria-label={commonTr.collapsePanel}
                                    className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                                >
                                    <ChevronsLeft className="h-3.5 w-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side={tooltipSide}>{commonTr.collapsePanel}</TooltipContent>
                        </Tooltip>
                    </div>
                )}
            </div>

            {collapsed && (
                <div className="flex items-center justify-center gap-1 border-b border-sidebar-border py-2">
                    {pinMenu('right')}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => setCollapsed(false)}
                                aria-label={commonTr.collapsePanel}
                                className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                            >
                                <ChevronsLeft className="h-3.5 w-3.5 rotate-180" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side={tooltipSide}>{commonTr.collapsePanel}</TooltipContent>
                    </Tooltip>
                </div>
            )}

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
                    const linkContent = (
                        <Link
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
                                            badge === 'loading' ? 'animate-pulse' : '',
                                            active ? 'bg-gradient-primary text-white' : BADGE_TONE[item.badgeTone],
                                        )}>
                                            {badge === 'loading' ? '...' : badge > 9999 ? '9999+' : badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </Link>
                    );

                    return collapsed ? (
                        <Tooltip key={item.href}>
                            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                            <TooltipContent side={tooltipSide}>{tr.nav[item.key]}</TooltipContent>
                        </Tooltip>
                    ) : (
                        <div key={item.href}>{linkContent}</div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-sidebar-border/70 p-3 space-y-0.5">
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

                {!collapsed && (
                    <div className="mt-2 border-t border-sidebar-border/40 px-3 pt-2 space-y-0.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground/50">© 2026 SmartQuote — by</span>
                            <a
                                href="https://shellty-it.github.io"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors underline-offset-2 hover:underline"
                            >
                                Shellty
                            </a>
                        </div>
                        <button
                            onClick={() => setPrivacyOpen(true)}
                            className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors underline-offset-2 hover:underline"
                        >
                            {commonTr.privacyPolicy}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    // Icon-only horizontal row, macOS-dock style — used when pinned to the top or bottom edge.
    const horizontalContent = (
        <div className="flex items-center gap-1 px-2 py-2">
            {gripHandle}
            <div className="mx-1 h-8 w-px shrink-0 bg-sidebar-border/70" />
            {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                const badge = getBadge(item.stat, unreadNotifications);
                const Icon = item.icon;
                return (
                    <div key={item.href} className="group relative shrink-0">
                        <Link
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                'grid h-11 w-11 place-items-center rounded-xl transition-all',
                                active
                                    ? 'bg-card text-foreground shadow-card ring-1 ring-border'
                                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                            )}
                        >
                            <Icon
                                className={cn('h-[18px] w-[18px]', active ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground')}
                                strokeWidth={2}
                            />
                            {badge !== null && (
                                <span className={cn(
                                    'absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-sidebar',
                                    badge === 'loading' ? 'animate-pulse' : '',
                                    BADGE_DOT_TONE[item.badgeTone],
                                )} />
                            )}
                        </Link>
                        <span className={cn(
                            'pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-card ring-1 ring-border transition-opacity group-hover:opacity-100',
                            position === 'top' ? 'top-full mt-2' : 'bottom-full mb-2'
                        )}>
                            {tr.nav[item.key]}
                        </span>
                    </div>
                );
            })}
            <div className="mx-1 h-8 w-px shrink-0 bg-sidebar-border/70" />
            <div className="group relative shrink-0">
                <Link
                    href="/dashboard/settings"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                        'grid h-11 w-11 place-items-center rounded-xl transition-all',
                        isActive('/dashboard/settings')
                            ? 'bg-card text-foreground shadow-card ring-1 ring-border'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                    )}
                >
                    <Settings className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={2} />
                </Link>
                <span className={cn(
                    'pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-card ring-1 ring-border transition-opacity group-hover:opacity-100',
                    position === 'top' ? 'top-full mt-2' : 'bottom-full mb-2'
                )}>
                    {commonTr.settings}
                </span>
            </div>
            <div className="group relative shrink-0">
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="grid h-11 w-11 place-items-center rounded-xl text-sidebar-foreground/80 transition-all hover:bg-destructive/10 hover:text-destructive"
                >
                    <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
                </button>
                <span className={cn(
                    'pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-card ring-1 ring-border transition-opacity group-hover:opacity-100',
                    position === 'top' ? 'top-full mt-2' : 'bottom-full mb-2'
                )}>
                    {commonTr.logout}
                </span>
            </div>
            {pinMenu(position === 'top' ? 'bottom' : 'top')}
        </div>
    );

    const outerStyle = isDragging
        ? { left: drag.x, top: drag.y }
        : position === 'floating'
            ? { left: floatCoords.x, top: floatCoords.y }
            : undefined;

    return (
        <TooltipProvider delayDuration={300}>
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

            {/* Snap-zone overlays — shown only while dragging the desktop dock */}
            {isDragging && (
                <>
                    <div className={cn(
                        'pointer-events-none fixed left-1/2 top-0.0 z-30 hidden h-16 w-[min(48rem,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl border-2 border-dashed transition-colors lg:block',
                        nearTop ? 'border-primary/60 bg-primary/10' : 'border-sidebar-border/60 bg-sidebar/40'
                    )} />
                    <div className={cn(
                        'pointer-events-none fixed inset-y-24 left-3 z-30 hidden w-16 rounded-3xl border-2 border-dashed transition-colors lg:block',
                        nearLeft ? 'border-primary/60 bg-primary/10' : 'border-sidebar-border/60 bg-sidebar/40'
                    )} />
                    <div className={cn(
                        'pointer-events-none fixed inset-y-24 right-3 z-30 hidden w-16 rounded-3xl border-2 border-dashed transition-colors lg:block',
                        nearRight ? 'border-primary/60 bg-primary/10' : 'border-sidebar-border/60 bg-sidebar/40'
                    )} />
                    <div className={cn(
                        'pointer-events-none fixed inset-x-24 bottom-3 z-30 hidden h-16 rounded-3xl border-2 border-dashed transition-colors lg:block',
                        nearBottom ? 'border-primary/60 bg-primary/10' : 'border-sidebar-border/60 bg-sidebar/40'
                    )} />
                </>
            )}

            {/* Desktop floating dock */}
            <div
                style={outerStyle}
                className={cn(
                    'fixed z-40 hidden lg:block',
                    !isDragging && 'transition-all duration-300 ease-out',
                    isDragging && 'opacity-95',
                    showHorizontal
                        ? position === 'top'
                            ? 'inset-x-0 top-0.0 mx-auto w-fit max-w-[calc(100vw-2rem)] xl:max-w-[calc(100vw-48rem)]'
                            : 'inset-x-0 bottom-0.0 mx-auto w-fit max-w-[calc(100vw-2rem)]'
                        : position === 'left' && !isDragging
                            ? 'left-4 top-4 bottom-4'
                            : position === 'right' && !isDragging
                                ? 'right-4 top-4 bottom-4'
                                : 'h-[min(640px,calc(100vh-2rem))]',
                    !showHorizontal && (collapsed ? 'w-[72px]' : 'w-[260px]')
                )}
            >
                <div
                    ref={panelRef}
                    className={cn(
                        'h-full overflow-hidden rounded-3xl border border-sidebar-border/70 bg-gradient-sidebar shadow-glow',
                        isDragging && 'shadow-[0_0_0_1px_var(--primary)]',
                        showHorizontal ? 'flex max-w-full items-center overflow-x-auto' : 'flex flex-col'
                    )}
                >
                    {showHorizontal ? horizontalContent : verticalContent}
                </div>
            </div>

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
                        {verticalContent}
                    </aside>
                </>
            )}

            <PrivacyPolicyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
        </TooltipProvider>
    );
}
