// src/app/dashboard/offers/[id]/components/details/AuditTrailCard.tsx
'use client';

import { formatDateTime, formatCurrency } from '@/lib/utils';
import { truncateHash } from '../../utils';

interface AuditLog {
    clientName: string | null;
    clientEmail: string | null;
    acceptedAt: string;
    selectedVariant: string | null;
    totalGross: number | string;
    currency: string;
    ipAddress: string;
    userAgent: string;
    contentHash: string;
}

interface AuditTrailCardProps {
    auditLog: AuditLog | null;
    requireAuditTrail: boolean;
    onCopyHash: (hash: string) => void;
}

export function AuditTrailCard({ auditLog, requireAuditTrail, onCopyHash }: AuditTrailCardProps) {
    if (auditLog) {
        return (
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        <h2 className="text-base font-semibold text-white">Audit Trail</h2>
                    </div>
                    <p className="text-emerald-100 text-xs mt-1">Formalne potwierdzenie akceptacji</p>
                </div>

                <div className="p-5 card-themed space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-themed">{auditLog.clientName || '—'}</p>
                            <p className="text-xs text-themed-muted truncate">{auditLog.clientEmail || '—'}</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-themed-muted">Data akceptacji</span>
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {formatDateTime(auditLog.acceptedAt)}
              </span>
                        </div>

                        {auditLog.selectedVariant && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-themed-muted">Wybrany wariant</span>
                                <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 font-medium">
                  {auditLog.selectedVariant}
                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <span className="text-xs text-themed-muted">Kwota brutto</span>
                            <span className="text-sm font-bold text-themed">
                {formatCurrency(Number(auditLog.totalGross))} {auditLog.currency}
              </span>
                        </div>

                        <div className="pt-3 border-t divider-themed">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-themed-muted">Adres IP</span>
                                <span className="text-xs font-mono text-themed">{auditLog.ipAddress}</span>
                            </div>
                        </div>

                        <div>
                            <span className="text-xs text-themed-muted">User Agent</span>
                            <p className="text-xs font-mono text-themed-muted mt-1 break-all leading-relaxed section-themed rounded-lg p-2">
                                {auditLog.userAgent}
                            </p>
                        </div>

                        <div className="pt-3 border-t divider-themed">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs text-themed-muted">Content Hash (SHA-256)</span>
                                <button
                                    onClick={() => onCopyHash(auditLog.contentHash)}
                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md hover-themed text-cyan-600 dark:text-cyan-400 transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Kopiuj
                                </button>
                            </div>
                            <div className="font-mono text-xs break-all leading-relaxed p-2.5 rounded-lg bg-slate-900 dark:bg-black/40 text-emerald-400 dark:text-emerald-300 select-all">
                                {truncateHash(auditLog.contentHash, 20)}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t divider-themed">
                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            Akceptacja potwierdzona formalnie — dane zweryfikowane i niemodyfikowalne
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (requireAuditTrail) {
        return (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30">
                    <div className="flex items-center gap-2.5">
                        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        <div>
                            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Audit Trail — oczekiwanie</h3>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                Oferta wymaga formalnego potwierdzenia akceptacji. Dane zostaną zapisane po akceptacji przez klienta.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}