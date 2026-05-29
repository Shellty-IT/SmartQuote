// src/app/dashboard/clients/[id]/page.tsx
'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Pencil, Plus, Mail, Phone,
    Globe, Hash, MapPin, ExternalLink, ChevronRight, FileText,
} from 'lucide-react';
import { useClient } from '@/hooks/useClients';
import { useOffers } from '@/hooks/useOffers';
import { Button } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatCurrency, getInitials, cn } from '@/lib/utils';

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
    const { client, isLoading, error } = useClient(id);
    const { offers } = useOffers({ clientId: id, limit: 5 });

    if (isLoading) return <PageLoader />;

    if (error || !client) {
        return (
            <div className="mx-auto max-w-[1400px] px-4 py-16 text-center sm:px-6">
                <div className="rounded-2xl border border-border bg-card p-12 shadow-card">
                    <p className="mb-4 text-destructive">{error || 'Nie znaleziono klienta'}</p>
                    <Button onClick={() => router.push('/dashboard/clients')}>Wróć do listy</Button>
                </div>
            </div>
        );
    }

    const quickActions = [
        { icon: Plus, label: 'Nowa oferta', fn: () => router.push(`/dashboard/offers/new?clientId=${client.id}`) },
        client.email ? { icon: Mail, label: 'Wyślij e-mail', fn: () => { window.location.href = `mailto:${client.email}`; } } : null,
        client.phone ? { icon: Phone, label: 'Zadzwoń', fn: () => { window.location.href = `tel:${client.phone}`; } } : null,
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
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Profil klienta</div>
                        <h1 className="mt-0.5 text-3xl font-bold tracking-tight">{client.name}</h1>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className={cn(
                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                                client.type === 'COMPANY'
                                    ? 'bg-[color-mix(in_oklab,var(--status-open)_12%,transparent)] text-status-open ring-[color-mix(in_oklab,var(--status-open)_25%,transparent)]'
                                    : 'bg-secondary text-muted-foreground ring-border',
                            )}>
                                {client.type === 'COMPANY' ? 'Firma' : 'Osoba prywatna'}
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
                        <Pencil className="h-4 w-4" /> Edytuj
                    </button>
                    <button
                        onClick={() => router.push(`/dashboard/offers/new?clientId=${client.id}`)}
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 transition hover:brightness-110"
                    >
                        <Plus className="h-4 w-4" /> Nowa oferta
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                {/* Left: contact + address + offers */}
                <div className="space-y-5 xl:col-span-2">
                    {/* Contact */}
                    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <h2 className="mb-4 text-lg font-semibold tracking-tight">Dane kontaktowe</h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {client.email && (
                                <Field icon={Mail} label="Email">
                                    <a className="text-primary hover:underline" href={`mailto:${client.email}`}>{client.email}</a>
                                </Field>
                            )}
                            {client.phone && (
                                <Field icon={Phone} label="Telefon">
                                    <span className="font-mono">{client.phone}</span>
                                </Field>
                            )}
                            {client.website && (
                                <Field icon={Globe} label="Strona WWW">
                                    <a
                                        className="inline-flex items-center gap-1 text-primary hover:underline"
                                        href={client.website}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {client.website} <ExternalLink className="h-3 w-3" />
                                    </a>
                                </Field>
                            )}
                            {client.nip && (
                                <Field icon={Hash} label="NIP">
                                    <span className="font-mono">{client.nip}</span>
                                </Field>
                            )}
                            {(client.address || client.city) && (
                                <Field icon={MapPin} label="Adres">
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
                            <h2 className="mb-4 text-lg font-semibold tracking-tight">Notatki</h2>
                            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{client.notes}</p>
                        </section>
                    )}

                    {/* Recent offers */}
                    <section className="rounded-2xl border border-border bg-card shadow-card">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <h2 className="text-lg font-semibold tracking-tight">Ostatnie oferty</h2>
                            <button
                                onClick={() => router.push(`/dashboard/offers?clientId=${client.id}`)}
                                className="text-sm font-semibold text-primary hover:underline"
                            >
                                Zobacz wszystkie
                            </button>
                        </div>
                        {offers.length === 0 ? (
                            <div className="flex flex-col items-center py-12 text-center">
                                <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
                                <p className="text-sm text-muted-foreground">Brak ofert dla tego klienta</p>
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
                </div>

                {/* Right: stats + quick actions */}
                <div className="space-y-5">
                    {/* Stats */}
                    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <h2 className="mb-4 text-lg font-semibold tracking-tight">Statystyki</h2>
                        <div className="space-y-2">
                            {[
                                { label: 'Wszystkie oferty', value: String(client._count?.offers || 0) },
                                { label: 'Dodano', value: formatDate(client.createdAt) },
                                { label: 'Ostatnia aktualizacja', value: formatDate(client.updatedAt) },
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
                        <h2 className="mb-4 text-lg font-semibold tracking-tight">Szybkie akcje</h2>
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
