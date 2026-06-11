'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Mail,
    Phone,
    Building2,
    Tag,
    FileText,
    UserCheck,
    XCircle,
    ChevronRight,
    Check,
    Loader2,
} from 'lucide-react';
import { useLead } from '@/hooks/useLeads';
import { leadsApi } from '@/lib/api/leads.api';
import { Button } from '@/components/ui';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { formatDate, cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { useTranslations } from '@/i18n';
import type { LeadStatus } from '@/types/lead.types';
import { NotesFeed } from '@/components/notes/NotesFeed';
import { InlineEdit } from '@/components/ui';

interface PageProps {
    params: Promise<{ id: string }>;
}

const STATUS_COLORS: Record<LeadStatus, string> = {
    NEW:       'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/20',
    CONTACTED: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/20',
    CONVERTED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
    LOST:      'bg-slate-500/15 text-slate-500 dark:text-slate-400 ring-slate-500/20',
};

const QUICK_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'LOST'];

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

export default function LeadDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const toast = useToast();
    const tr = useTranslations('leads');
    const commonTr = useTranslations('common');

    const { lead, isLoading, error, refresh } = useLead(id);
    const [isConverting, setIsConverting] = useState(false);
    const [isMarkingLost, setIsMarkingLost] = useState(false);
    const [isChangingStatus, setIsChangingStatus] = useState<LeadStatus | null>(null);

    if (isLoading) return <PageLoader />;

    if (error || !lead) {
        return (
            <div className="mx-auto max-w-[1400px] px-4 py-16 text-center sm:px-6">
                <div className="rounded-2xl border border-border bg-card p-12 shadow-card">
                    <p className="mb-4 text-destructive">{error || 'Lead nie znaleziony'}</p>
                    <Button onClick={() => router.push('/dashboard/leads')}>{tr.backToList}</Button>
                </div>
            </div>
        );
    }

    const handleConvert = async () => {
        setIsConverting(true);
        try {
            const res = await leadsApi.convert(id);
            toast.success(tr.convertSuccess);
            if (res.data?.clientId) {
                router.push(`/dashboard/clients/${res.data.clientId}`);
            } else {
                await refresh();
            }
        } catch {
            toast.error(commonTr.errorTitle, tr.convertError);
        } finally {
            setIsConverting(false);
        }
    };

    const handleMarkLost = async () => {
        setIsMarkingLost(true);
        try {
            await leadsApi.update(id, { status: 'LOST' });
            await refresh();
            toast.success(tr.markLostSuccess);
        } catch {
            toast.error(commonTr.errorTitle, tr.markLostError);
        } finally {
            setIsMarkingLost(false);
        }
    };

    const handleQuickStatus = async (status: LeadStatus) => {
        if (lead.status === status) return;
        setIsChangingStatus(status);
        try {
            await leadsApi.update(id, { status });
            await refresh();
        } catch {
            toast.error(commonTr.errorTitle, tr.markLostError);
        } finally {
            setIsChangingStatus(null);
        }
    };

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard/leads')}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Lead</div>
                        <h1 className="mt-0.5 text-3xl font-bold tracking-tight">{lead.name}</h1>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className={cn(
                                'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                                STATUS_COLORS[lead.status],
                            )}>
                                {tr.status[lead.status]}
                            </span>
                            {lead.company && (
                                <span className="text-sm text-muted-foreground">{lead.company}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick status pills */}
                <div className="flex flex-wrap items-center gap-2">
                    {QUICK_STATUSES.map((s) => (
                        <button
                            key={s}
                            onClick={() => handleQuickStatus(s)}
                            disabled={lead.status === s || isChangingStatus !== null}
                            className={cn(
                                'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition',
                                lead.status === s
                                    ? 'border-primary/50 bg-primary/10 text-primary'
                                    : 'border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-50',
                            )}
                        >
                            {isChangingStatus === s ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : lead.status === s ? (
                                <Check className="h-3 w-3" />
                            ) : null}
                            {tr.status[s]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                {/* Left */}
                <div className="space-y-5 xl:col-span-2">
                    {/* Contact info */}
                    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <h2 className="mb-4 text-lg font-semibold tracking-tight">Dane kontaktowe</h2>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {lead.email && (
                                <Field icon={Mail} label={tr.email}>
                                    <a className="text-primary hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a>
                                </Field>
                            )}
                            {lead.phone && (
                                <Field icon={Phone} label={tr.phone}>
                                    <span className="font-mono">{lead.phone}</span>
                                </Field>
                            )}
                            <Field icon={Building2} label={tr.company}>
                                <InlineEdit
                                    value={lead.company ?? ''}
                                    emptyText="Dodaj firmę..."
                                    onSave={async (v) => { await leadsApi.update(id, { company: v }); await refresh(); }}
                                />
                            </Field>
                            {lead.source && (
                                <Field icon={Tag} label={tr.source}>
                                    {lead.source}
                                </Field>
                            )}
                        </div>
                    </section>

                    {/* Notes */}
                    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <h2 className="mb-4 text-lg font-semibold tracking-tight">{tr.notes}</h2>
                        <InlineEdit
                            value={lead.notes ?? ''}
                            multiline
                            emptyText="Kliknij, aby dodać notatki..."
                            onSave={async (v) => { await leadsApi.update(id, { notes: v }); await refresh(); }}
                            displayClassName="whitespace-pre-wrap text-sm text-muted-foreground"
                        />
                    </section>

                    {/* Linked client if converted */}
                    {lead.status === 'CONVERTED' && lead.client && (
                        <section className="rounded-2xl border border-border bg-card shadow-card">
                            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                                <h2 className="text-lg font-semibold tracking-tight">{tr.linkedClient}</h2>
                            </div>
                            <button
                                onClick={() => router.push(`/dashboard/clients/${lead.client!.id}`)}
                                className="group flex w-full items-center gap-4 px-6 py-4 text-left transition hover:bg-secondary/50"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold">{lead.client.name}</p>
                                    {lead.client.email && <p className="text-xs text-muted-foreground">{lead.client.email}</p>}
                                </div>
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition group-hover:translate-x-0.5" />
                            </button>
                        </section>
                    )}
                </div>

                {/* Right: stats + actions */}
                <div className="space-y-5">
                    {/* Stats */}
                    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <h2 className="mb-4 text-lg font-semibold tracking-tight">Informacje</h2>
                        <div className="space-y-2">
                            {[
                                { label: 'Status', value: tr.status[lead.status] },
                                { label: tr.createdAt, value: formatDate(lead.createdAt) },
                                { label: 'Zaktualizowano', value: formatDate(lead.updatedAt) },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between rounded-lg bg-surface-subtle px-3 py-2.5">
                                    <span className="text-sm text-muted-foreground">{label}</span>
                                    <span className="text-sm font-semibold">{value}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Actions */}
                    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
                        <h2 className="mb-4 text-lg font-semibold tracking-tight">Akcje</h2>
                        <div className="space-y-2">
                            {/* Convert to client */}
                            {lead.status !== 'CONVERTED' && (
                                <button
                                    onClick={handleConvert}
                                    disabled={isConverting}
                                    className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface-subtle p-3 text-left transition hover:border-emerald-500/30 hover:bg-emerald-500/5 disabled:opacity-50"
                                >
                                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card ring-1 ring-border text-emerald-600">
                                        {isConverting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                                    </div>
                                    <span className="text-sm font-semibold">{tr.convertBtn}</span>
                                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/60 transition group-hover:translate-x-0.5" />
                                </button>
                            )}

                            {/* Create offer */}
                            <button
                                onClick={() => {
                                    const url = lead.status === 'CONVERTED' && lead.clientId
                                        ? `/dashboard/offers/new?clientId=${lead.clientId}`
                                        : `/dashboard/offers/new`;
                                    router.push(url);
                                }}
                                className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface-subtle p-3 text-left transition hover:border-primary/30 hover:bg-secondary"
                            >
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card ring-1 ring-border text-primary">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-semibold">{tr.createOffer}</span>
                                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/60 transition group-hover:translate-x-0.5" />
                            </button>

                            {/* Mark as lost */}
                            {lead.status !== 'LOST' && lead.status !== 'CONVERTED' && (
                                <button
                                    onClick={handleMarkLost}
                                    disabled={isMarkingLost}
                                    className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface-subtle p-3 text-left transition hover:border-destructive/30 hover:bg-destructive/5 disabled:opacity-50"
                                >
                                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card ring-1 ring-border text-destructive">
                                        {isMarkingLost ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                    </div>
                                    <span className="text-sm font-semibold">{tr.markLost}</span>
                                </button>
                            )}

                            {/* View client */}
                            {lead.status === 'CONVERTED' && lead.clientId && (
                                <button
                                    onClick={() => router.push(`/dashboard/clients/${lead.clientId}`)}
                                    className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface-subtle p-3 text-left transition hover:border-primary/30 hover:bg-secondary"
                                >
                                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card ring-1 ring-border text-primary">
                                        <UserCheck className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-semibold">{tr.viewClient}</span>
                                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/60 transition group-hover:translate-x-0.5" />
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Notes feed */}
            <NotesFeed entityId={lead.id} entityType="lead" />
        </div>
    );
}
