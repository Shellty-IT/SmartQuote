// src/app/dashboard/offers/[id]/components/details/ClientCard.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { useTranslations } from '@/i18n';

interface ClientCardProps {
    client: { id: string; name: string; email: string };
}

export function ClientCard({ client }: ClientCardProps) {
    const router = useRouter();
    const tr = useTranslations('offerDetail');

    return (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">{tr.clientCard.title}</h2>
            <button
                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface-subtle p-3 text-left transition hover:border-primary/30 hover:bg-secondary"
            >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-primary text-sm font-bold text-white shadow-sm">
                    {getInitials(client.name)}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-semibold">{client.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{client.email}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </button>
        </div>
    );
}
