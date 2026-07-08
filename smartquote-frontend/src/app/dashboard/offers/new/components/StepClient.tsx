// src/app/dashboard/offers/new/components/StepClient.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button } from '@/components/ui';
import { getInitials } from '@/lib/utils';
import { useTranslations } from '@/i18n';
import type { Client } from '@/types';
import type { Lead } from '@/types/lead.types';

interface StepClientProps {
    clients: Client[];
    leads?: Lead[];
    selectedClient: Client | null;
    selectedLead?: Lead | null;
    onSelectClient: (client: Client) => void;
    onSelectLead?: (lead: Lead) => void;
}

export default function StepClient({
    clients,
    leads = [],
    selectedClient,
    selectedLead = null,
    onSelectClient,
    onSelectLead,
}: StepClientProps) {
    const router = useRouter();
    const tr = useTranslations('offerNew');
    const c = tr.client;
    const [clientSearch, setClientSearch] = useState('');

    const filteredClients = clients.filter(
        (client) =>
            client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
            client.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
            client.company?.toLowerCase().includes(clientSearch.toLowerCase())
    );

    const filteredLeads = leads.filter(
        (lead) =>
            lead.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
            lead.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
            lead.company?.toLowerCase().includes(clientSearch.toLowerCase())
    );

    const hasNoResults = filteredClients.length === 0 && filteredLeads.length === 0;

    return (
        <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">{c.title}</h2>
            <Input
                placeholder={c.search}
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="mb-4"
                icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                }
            />

            {filteredClients.length > 0 && (
                <div className="mb-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Klienci</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                        {filteredClients.map((client) => (
                            <button
                                key={client.id}
                                data-testid="offer-client-card"
                                onClick={() => onSelectClient(client)}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                                    selectedClient?.id === client.id
                                        ? 'border-primary bg-primary/10'
                                        : 'bg-card border-border border hover:bg-secondary/60'
                                }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                    {getInitials(client.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">{client.name}</p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {client.email || client.phone || c.noContact}
                                    </p>
                                </div>
                                {selectedClient?.id === client.id && (
                                    <svg className="w-5 h-5 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {filteredLeads.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Leady
                        <span className="ml-2 text-[10px] normal-case font-normal text-muted-foreground/70">bez automatycznej konwersji na klienta</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                        {filteredLeads.map((lead) => (
                            <button
                                key={lead.id}
                                onClick={() => onSelectLead && onSelectLead(lead)}
                                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                                    selectedLead?.id === lead.id
                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'
                                        : 'bg-card border-border border hover:bg-secondary/60'
                                }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                    {getInitials(lead.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-foreground truncate">{lead.name}</p>
                                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-medium flex-shrink-0">Lead</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {lead.email || lead.phone || lead.company || c.noContact}
                                    </p>
                                </div>
                                {selectedLead?.id === lead.id && (
                                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {hasNoResults && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">{c.noResults}</p>
                    <Button variant="outline" onClick={() => router.push('/dashboard/clients/new')}>
                        {c.addNew}
                    </Button>
                </div>
            )}
        </div>
    );
}
