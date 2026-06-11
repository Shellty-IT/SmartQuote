'use client';

import { useState, useMemo } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import { createViewMonthGrid, createViewWeek, createViewDay } from '@schedule-x/calendar';
import { createEventModalPlugin } from '@schedule-x/event-modal';
import '@schedule-x/theme-default/dist/index.css';
import { useCalendarEvents } from '@/hooks/useCalendar';
import { calendarApi } from '@/lib/api/calendar.api';
import { useToast } from '@/contexts/ToastContext';
import { formatDate, cn } from '@/lib/utils';
import type { CalendarEvent, CreateCalendarEventInput, CalendarEventColor } from '@/types/calendar.types';

const COLOR_CLASSES: Record<CalendarEventColor, string> = {
    blue:   'bg-blue-500',
    green:  'bg-green-500',
    red:    'bg-red-500',
    amber:  'bg-amber-500',
    purple: 'bg-purple-500',
    pink:   'bg-pink-500',
    teal:   'bg-teal-500',
};

const ALL_COLORS: CalendarEventColor[] = ['blue', 'green', 'red', 'amber', 'purple', 'pink', 'teal'];

interface EventModalState {
    isOpen: boolean;
    editingEvent?: CalendarEvent;
}

const defaultFormState = () => ({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    time: '',
    color: 'blue' as CalendarEventColor,
    description: '',
    clientId: '',
    offerId: '',
    leadId: '',
});

export default function CalendarPage() {
    const { events, isLoading, refresh } = useCalendarEvents();
    const toast = useToast();

    const [modal, setModal] = useState<EventModalState>({ isOpen: false });
    const [form, setForm] = useState(defaultFormState());
    const [isSaving, setIsSaving] = useState(false);

    const scheduleXEvents = useMemo(() => events.map(e => ({
        id: e.id,
        title: e.title,
        start: e.startAt.slice(0, 16),
        end: (e.endAt || e.startAt).slice(0, 16),
        description: e.description || '',
        calendarId: e.color || 'blue',
    })), [events]);

    const calendar = useCalendarApp({
        views: [createViewMonthGrid(), createViewWeek(), createViewDay()],
        events: scheduleXEvents,
        plugins: [createEventModalPlugin()],
        calendars: {
            blue:   { colorName: 'blue',   lightColors: { main: '#3b82f6', container: '#eff6ff', onContainer: '#1d4ed8' } },
            green:  { colorName: 'green',  lightColors: { main: '#22c55e', container: '#f0fdf4', onContainer: '#15803d' } },
            red:    { colorName: 'red',    lightColors: { main: '#ef4444', container: '#fef2f2', onContainer: '#b91c1c' } },
            amber:  { colorName: 'amber',  lightColors: { main: '#f59e0b', container: '#fffbeb', onContainer: '#92400e' } },
            purple: { colorName: 'purple', lightColors: { main: '#a855f7', container: '#faf5ff', onContainer: '#7e22ce' } },
            pink:   { colorName: 'pink',   lightColors: { main: '#ec4899', container: '#fdf2f8', onContainer: '#9d174d' } },
            teal:   { colorName: 'teal',   lightColors: { main: '#14b8a6', container: '#f0fdfa', onContainer: '#0f766e' } },
        },
        locale: 'pl-PL',
    });

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingEvents = useMemo(() => events
        .filter(e => {
            const d = new Date(e.startAt);
            return d >= now && d <= in7Days;
        })
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events]);

    function openCreate() {
        setForm(defaultFormState());
        setModal({ isOpen: true });
    }

    function closeModal() {
        setModal({ isOpen: false });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title.trim() || !form.date) return;
        setIsSaving(true);
        try {
            const startAt = form.time
                ? `${form.date}T${form.time}:00.000Z`
                : `${form.date}T00:00:00.000Z`;
            const input: CreateCalendarEventInput = {
                title: form.title,
                description: form.description || null,
                startAt,
                allDay: !form.time,
                color: form.color,
                clientId: form.clientId || null,
                offerId: form.offerId || null,
                leadId: form.leadId || null,
            };
            if (modal.editingEvent) {
                await calendarApi.update(modal.editingEvent.id, input);
                toast.success('Zdarzenie zaktualizowane');
            } else {
                await calendarApi.create(input);
                toast.success('Zdarzenie dodane');
            }
            closeModal();
            await refresh();
        } catch {
            toast.error('Nie udało się zapisać zdarzenia');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete(eventId: string) {
        if (!confirm('Czy na pewno usunąć to zdarzenie?')) return;
        try {
            await calendarApi.delete(eventId);
            toast.success('Zdarzenie usunięte');
            await refresh();
        } catch {
            toast.error('Nie udało się usunąć zdarzenia');
        }
    }

    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        Dashboard
                    </div>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">Kalendarz</h1>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 transition hover:brightness-110"
                >
                    <Plus className="h-4 w-4" /> Nowe zdarzenie
                </button>
            </div>

            {/* Calendar */}
            <div className="rounded-2xl border border-border bg-card p-1 shadow-card overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-32 text-muted-foreground">
                        <Calendar className="h-10 w-10 animate-pulse" />
                    </div>
                ) : (
                    <ScheduleXCalendar calendarApp={calendar} />
                )}
            </div>

            {/* Agenda: Next 7 days */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <h2 className="text-base font-semibold mb-4">Najbliższe 7 dni</h2>
                <div className="space-y-2">
                    {upcomingEvents.map(event => (
                        <div key={event.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0 group">
                            <div className={cn('w-3 h-3 rounded-full shrink-0', COLOR_CLASSES[event.color] || 'bg-blue-500')} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{event.title}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(event.startAt)}</p>
                            </div>
                            <button
                                onClick={() => handleDelete(event.id)}
                                className="opacity-0 group-hover:opacity-100 text-xs text-destructive hover:underline transition-opacity"
                            >
                                Usuń
                            </button>
                        </div>
                    ))}
                    {upcomingEvents.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Brak zaplanowanych zdarzeń</p>
                    )}
                </div>
            </div>

            {/* Create/Edit Event Modal */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <h2 className="text-base font-semibold">
                                {modal.editingEvent ? 'Edytuj zdarzenie' : 'Nowe zdarzenie'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
                            {/* Title */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Tytuł *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    className="w-full rounded-xl border border-border bg-surface-subtle px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    placeholder="Nazwa zdarzenia"
                                />
                            </div>
                            {/* Date + Time */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Data *</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.date}
                                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                        className="w-full rounded-xl border border-border bg-surface-subtle px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Czas (opcjonalnie)</label>
                                    <input
                                        type="time"
                                        value={form.time}
                                        onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                                        className="w-full rounded-xl border border-border bg-surface-subtle px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            {/* Color */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Kolor</label>
                                <div className="flex gap-2 flex-wrap">
                                    {ALL_COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, color }))}
                                            className={cn(
                                                'h-7 w-7 rounded-full transition ring-offset-2',
                                                COLOR_CLASSES[color],
                                                form.color === color ? 'ring-2 ring-foreground' : 'hover:scale-110'
                                            )}
                                            aria-label={color}
                                        />
                                    ))}
                                </div>
                            </div>
                            {/* Description */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Opis</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    rows={3}
                                    className="w-full rounded-xl border border-border bg-surface-subtle px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                                    placeholder="Opcjonalny opis..."
                                />
                            </div>
                            {/* Optional links */}
                            <details className="text-sm">
                                <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
                                    Powiązania (opcjonalnie)
                                </summary>
                                <div className="mt-3 space-y-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">ID klienta</label>
                                        <input
                                            type="text"
                                            value={form.clientId}
                                            onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                                            className="w-full rounded-xl border border-border bg-surface-subtle px-3 py-2 text-sm outline-none focus:border-primary"
                                            placeholder="np. clm123..."
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">ID oferty</label>
                                        <input
                                            type="text"
                                            value={form.offerId}
                                            onChange={e => setForm(f => ({ ...f, offerId: e.target.value }))}
                                            className="w-full rounded-xl border border-border bg-surface-subtle px-3 py-2 text-sm outline-none focus:border-primary"
                                            placeholder="np. off456..."
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">ID leadu</label>
                                        <input
                                            type="text"
                                            value={form.leadId}
                                            onChange={e => setForm(f => ({ ...f, leadId: e.target.value }))}
                                            className="w-full rounded-xl border border-border bg-surface-subtle px-3 py-2 text-sm outline-none focus:border-primary"
                                            placeholder="np. ld789..."
                                        />
                                    </div>
                                </div>
                            </details>
                            {/* Actions */}
                            <div className="flex justify-end gap-3 border-t border-border pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-secondary"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex h-10 items-center rounded-xl bg-gradient-primary px-4 text-sm font-semibold text-white shadow-glow ring-1 ring-white/15 transition hover:brightness-110 disabled:opacity-60"
                                >
                                    {isSaving ? 'Zapisywanie...' : 'Zapisz'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
