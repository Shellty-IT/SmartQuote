// src/app/dashboard/offers/new/components/StepClient.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@/components/ui';
import { getInitials } from '@/lib/utils';
import type { Client } from '@/types';

interface StepClientProps {
    clients: Client[];
    selectedClient: Client | null;
    onSelectClient: (client: Client) => void;
}

export default function StepClient({ clients, selectedClient, onSelectClient }: StepClientProps) {
    const router = useRouter();
    const [clientSearch, setClientSearch] = useState('');

    const filteredClients = clients.filter(
        (client) =>
            client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
            client.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
            client.company?.toLowerCase().includes(clientSearch.toLowerCase())
    );

    return (
        <div>
            <h2 className="text-lg font-semibold text-themed mb-4">Wybierz klienta</h2>
            <Input
                placeholder="Szukaj klienta..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="mb-4"
                icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                }
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {filteredClients.map((client) => (
                    <button
                        key={client.id}
                        onClick={() => onSelectClient(client)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                            selectedClient?.id === client.id
                                ? 'border-cyan-500 bg-cyan-500/10'
                                : 'card-themed border hover-themed'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {getInitials(client.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-themed truncate">{client.name}</p>
                            <p className="text-sm text-themed-muted truncate">
                                {client.email || client.phone || 'Brak kontaktu'}
                            </p>
                        </div>
                        {selectedClient?.id === client.id && (
                            <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                ))}
            </div>
            {filteredClients.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-themed-muted mb-4">Nie znaleziono klientów</p>
                    <Button variant="outline" onClick={() => router.push('/dashboard/clients/new')}>
                        Dodaj nowego klienta
                    </Button>
                </div>
            )}
        </div>
    );
}