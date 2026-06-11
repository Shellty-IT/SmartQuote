'use client';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export interface PageContext {
    type: 'dashboard' | 'offer' | 'client' | 'contract' | 'lead' | 'followup' | 'calendar' | 'search' | 'other';
    id?: string;
    title?: string;
    extra?: string;
}

export function usePageContext(): PageContext {
    const pathname = usePathname();

    return useMemo(() => {
        if (!pathname) return { type: 'other' };

        // /dashboard/offers/[id]
        const offerMatch = pathname.match(/\/dashboard\/offers\/([^\/]+)(?:\/|$)/);
        if (offerMatch && offerMatch[1] !== 'new') {
            return { type: 'offer', id: offerMatch[1] };
        }

        // /dashboard/clients/[id]
        const clientMatch = pathname.match(/\/dashboard\/clients\/([^\/]+)(?:\/|$)/);
        if (clientMatch && clientMatch[1] !== 'new') {
            return { type: 'client', id: clientMatch[1] };
        }

        // /dashboard/contracts/[id]
        const contractMatch = pathname.match(/\/dashboard\/contracts\/([^\/]+)(?:\/|$)/);
        if (contractMatch && contractMatch[1] !== 'new') {
            return { type: 'contract', id: contractMatch[1] };
        }

        // /dashboard/leads/[id]
        const leadMatch = pathname.match(/\/dashboard\/leads\/([^\/]+)(?:\/|$)/);
        if (leadMatch && leadMatch[1] !== 'new') {
            return { type: 'lead', id: leadMatch[1] };
        }

        if (pathname.includes('/dashboard/followups')) return { type: 'followup' };
        if (pathname.includes('/dashboard/calendar')) return { type: 'calendar' };
        if (pathname === '/dashboard' || pathname === '/dashboard/') return { type: 'dashboard' };

        return { type: 'other' };
    }, [pathname]);
}
