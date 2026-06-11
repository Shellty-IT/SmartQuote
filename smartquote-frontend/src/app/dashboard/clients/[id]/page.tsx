// src/app/dashboard/clients/[id]/page.tsx
'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Pencil, Plus, Mail, Phone,
    Globe, Hash, MapPin, ChevronRight, FileText, ScrollText,
} from 'lucide-react';
import { useClient } from '@/hooks/useClients';
import { clientsApi } from '@/lib/api/clients.api';
import { useOffers } from '@/hooks/useOffers';
import { useContracts } from '@/hooks/useContracts';
import { Button, InlineEdit } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatCurrency, getInitials, cn } from '@/lib/utils';
import { useTranslations } from '@/i18n';
import { NotesFeed } from '@/components/notes/NotesFeed';

interface PageProps {
    params: Promise<{ id: string }>;
}

function Field({ icon: Icon, label, children }: {
    icon: React.ElementType;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-border bg-surface-subtle p-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Icon className="h-3 w-3" /> {label}
            </div>
            <div className="text-sm font-semibold">{children}</div>
        </div>
    );
}

export default function ClientDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const t = useTranslations('clientDetail');
    const tForm = useTranslations('clientForm');
    const { client, isLoading, error, refresh } = useClient(id);
    const { offers } = useOffers({ clientId: id, limit: 20 });
    const { contracts } = useContracts({ clientId: id, limit: 20 });

    if (isLoading) return <PageLoader />;

    if (error || !client) {
        return (
            <div className="mx-auto max-w-[1400px] px-4 py-16 text-center sm:px-6">
                <div className="rounded-2xl border border-border bg-card p-12 shadow-card">
                    <p className="mb-4 text-destructive">{error || tForm.notFound}</p>
                    <Button onClick={() => router.push('/dashboard/clients')}>{t.backToList}</Button>
                </div>
            </div>
        );
    }

    // Compute 360° metrics
    const totalGross = offers.reduce((sum, o) => sum + Number(o.totalGross), 0);
    const acceptedOffers = offers.filter(o => o.status === 'ACCEPTED');
    const sentOffers = offers.filter(o => ['SENT', 'VIEWED', 'NEGOTIATION', 'ACCEPTED', 'REJECTED', 'EXPIRED'].includes(o.status));
    const winRate = sentOffers.length > 0 ? Math.round((acceptedOffers.length / sentOffers.length) * 100) : null;
    const lastContact = offers.length > 0
        ? [...offers].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]?.updatedAt
        : null;

    const quickActions = [
        { icon: Plus, label: t.newOffer, fn: () => router.push(`/dashboard/offers/new?clientId=${client.id}`) },
        { icon: ScrollText, label: 'Nowa umowa', fn: () => router.push(`/dashboard/contracts/new?clientId=${client.id}`) },
        client.email ? { icon: Mail, label: t.sendEmail, fn: () => { window.location.href = `mailto:${client.email}`; } } : null,
        client.phone ? { icon: Phone, label: t.call, fn: () => { window.location.href = `tel:${client.phone}`; } } : null,
    ].filter(Boolean) as { icon: React.ElementType; label: string; fn: () => void }[];

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/clients')}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="relative">
                        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-lg font-bold text-white shadow-glow ring-1 ring-white/15">
                            {getInitials(client.name)}
                        </div>
                        <span className={cn(
                            'absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background',
                            client.isActive ? 'bg-status-accepted' : 'bg-muted-foreground',
                        )} />
                    </div>
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{tForm.profileLabel}</div>
                        <h1 className="mt-0.5 text-3xl font-bold tracking-tight">{client.name}</h1>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className={cn(
                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                                client.type === 'COMPANY'
                                    ? 'bg-[color-mix(in_oklab,var(--status-open)_12%,transparent)] text-status-open ring-[color-mix(in_oklab,var(--status-open)_25%,transparent)]'
                                    : 'bg-secondary text-muted-foreground ring-border',
                            )}>
                                {client.type === 'COMPANY' ? tForm.companyType : tForm.personType}
                            </span>
                            <StatusBadge status={client.isActive ? 'ACTIVE' : 'TERMINATED'} />
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold shadow-sm transition hover:bg-secondary"
                    >
                        <Pencil className="h-4 w-4" /> {t.edit}
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/offers/new?clientId=${client.id}`)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 transition hover:brightness-110"
                    >
                        <Plus className="h-4 w-4" /> {t.newOffer}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                {/* Left: contact + address + offers */}
                <div className="space-y-5 xl:col-span-2">
                    {/* Contact */}
                    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <h2 className="mb-4 text-lg font-semibold tracking-tight">{t.contact}</h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field icon={Hash} label={tForm.companyLabel ?? 'Firma'}>
                                <InlineEdit
                                    value={client.company ?? ''}
                                    emptyText="Dodaj nazwę firmy..."
                                    onSave={async (v) => { await clientsApi.update(client.id, { company: v }); await refresh(); }}
                                />
                            </Field>
                            <Field icon={Mail} label={t.email}>
                                <InlineEdit
                                    value={client.email ?? ''}
                                    emptyText="Dodaj email..."
                                    onSave={async (v) => { await clientsApi.update(client.id, { email: v }); await refresh(); }}
                                    displayClassName="text-primary"
                                />
                            </Field>
                            <Field icon={Phone} label={t.phone}>
                                <InlineEdit
                                    value={client.phone ?? ''}
                                    emptyText="Dodaj telefon..."
                                    onSave={async (v) => { await clientsApi.update(client.id, { phone: v }); await refresh(); }}
                                    displayClassName="font-mono"
                                />
                            </Field>
                            <Field icon={Globe} label={t.website}>
                                <InlineEdit
                                    value={client.website ?? ''}
                                    emptyText="Dodaj stronę..."
                                    onSave={async (v) => { await clientsApi.update(client.id, { website: v }); await refresh(); }}
                                    displayClassName="text-primary"
                                />
                            </Field>
                            {client.nip && (
                                <Field icon={Hash} label={t.nip}>
                                    <span className="font-mono">{client.nip}</span>
                                </Field>
                            )}
                            {(client.address || client.city) && (
                                <Field icon={MapPin} label={t.address}>
                                    <span>
                                        {client.address && <>{client.address}<br /></>}
                                        {client.postalCode} {client.city}
                                        {client.country && <>, {client.country}</>}
                                    </span>
                                </Field>
                            )}
                        </div>
                    </section>

                    {/* Notes */}
                    {client.notes && (
                        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                            <h2 className="mb-4 text-lg font-semibold tracking-tight">{t.notes}</h2>
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{client.notes}</p>
                        </section>
                    )}

                    {/* Recent offers */}
                    <section className="rounded-2xl border border-border bg-card shadow-card">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <h2 className="text-lg font-semibold tracking-tight">{t.recentOffers}</h2>
                            <button
                                onClick={() => router.push(`/dashboard/offers?clientId=${client.id}`)}
                                className="text-sm font-semibold text-primary hover:underline"
                            >
                                {t.seeAll}
                            </button>
                        </div>
                        {offers.length === 0 ? (
                            <div className="flex flex-col items-center py-12 text-center">
                                <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
                                <p className="text-sm text-muted-foreground">{t.noOffers}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/60">
                                {offers.map((offer) => (
                                    <button
                                        key={offer.id}
                                        onClick={() => router.push(`/dashboard/offers/${offer.id}`)}
                                        className="group flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-secondary/50"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold leading-tight">{offer.title}</p>
                                            <p className="font-mono text-xs text-muted-foreground">{offer.number}</p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="font-semibold tabular-nums">{formatCurrency(offer.totalGross)}</p>
                                            <StatusBadge status={offer.status} showDot={false} />
                                        </div>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition group-hover:translate-x-0.5" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                    {/* Contracts section */}
                    <section className="rounded-2xl border border-border bg-card shadow-card">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <h2 className="text-lg font-semibold tracking-tight">Umowy</h2>
                            <button
                                onClick={() => router.push(`/dashboard/contracts/new?clientId=${client.id}`)}
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                            >
                                <Plus className="h-3.5 w-3.5" /> Nowa umowa
                            </button>
                        </div>
                        {contracts.length === 0 ? (
                            <div className="flex flex-col items-center py-12 text-center">
                                <ScrollText className="mb-3 h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
                                <p className="text-sm text-muted-foreground">Brak umów dla tego klienta</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/60">
                                {contracts.map((contract) => (
                                    <button
                                        key={contract.id}
                                        onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                                        className="group flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-secondary/50"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold leading-tight">{contract.title}</p>
                                            <p className="font-mono text-xs text-muted-foreground">{contract.number}</p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <StatusBadge status={contract.status} showDot={false} />
                                        </div>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition group-hover:translate-x-0.5" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Notes feed */}
                    <NotesFeed entityId={client.id} entityType="client" />
                </div>

                {/* Right: stats + quick actions */}
                <div className="space-y-5">
                    {/* Stats */}
                    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <h2 className="mb-4 text-lg font-semibold tracking-tight">{t.stats}</h2>
                        <div className="space-y-2">
                            {[
                                { label: 'Łączna wartość', value: `${formatCurrency(totalGross)}` },
                                { label: 'Zaakceptowane oferty', value: `${acceptedOffers.length}${winRate !== null ? ` (${winRate}% win rate)` : ''}` },
                                { label: t.allOffers, value: String(offers.length) },
                                { label: 'Umowy', value: String(contracts.length) },
                                { label: t.createdAt, value: formatDate(client.createdAt) },
                                { label: 'Ostatni kontakt', value: lastContact ? formatDate(lastContact) : '—' },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between rounded-lg bg-surface-subtle px-3 py-2.5">
                                    <span className="text-sm text-muted-foreground">{label}</span>
                                    <span className="text-sm font-semibold">{value}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Quick actions */}
                    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <h2 className="mb-4 text-lg font-semibold tracking-tight">{t.quickActions}</h2>
                        <div className="space-y-2">
                            {quickActions.map(({ icon: Icon, label, fn }) => (
                                <button
                                    key={label}
                                    onClick={fn}
                                    className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface-subtle p-3 text-left transition hover:border-primary/30 hover:bg-secondary"
                                >
                                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card ring-1 ring-border text-primary">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-semibold">{label}</span>
                                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/60 transition group-hover:translate-x-0.5" />
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
