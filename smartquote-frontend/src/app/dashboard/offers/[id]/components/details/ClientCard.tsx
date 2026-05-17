// src/app/dashboard/offers/[id]/components/details/ClientCard.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { getInitials } from '@/lib/utils';

interface ClientCardProps {
    client: {
        id: string;
        name: string;
        email: string;
    };
}

export function ClientCard({ client }: ClientCardProps) {
    const router = useRouter();

    return (
        <Card>
            <h2 className="text-lg font-semibold text-themed mb-4">Klient</h2>
            <div
                className="flex items-center gap-3 p-3 section-themed rounded-xl cursor-pointer hover-themed transition-colors"
                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
            >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-semibold">
                    {getInitials(client.name)}
                </div>
                <div className="flex-1">
                    <p className="font-medium text-themed">{client.name}</p>
                    <p className="text-sm text-themed-muted">{client.email}</p>
                </div>
                <svg className="w-5 h-5 text-themed-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </Card>
    );
}