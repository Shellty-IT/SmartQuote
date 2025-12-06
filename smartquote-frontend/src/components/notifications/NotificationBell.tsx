// src/components/notifications/NotificationBell.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { followUpsApi } from '@/lib/api';
import { FollowUp, Priority } from '@/types';
import { formatDate } from '@/lib/utils';

const priorityConfig: Record<Priority, { label: string; color: string; icon: string }> = {
    LOW: { label: 'Niski', color: 'bg-slate-100 text-slate-600', icon: '' },
    MEDIUM: { label: 'Średni', color: 'bg-blue-100 text-blue-700', icon: '' },
    HIGH: { label: 'Wysoki', color: 'bg-orange-100 text-orange-700', icon: '⚡' },
    URGENT: { label: 'Pilne', color: 'bg-red-100 text-red-700', icon: '🔥' },
};

const typeIcons: Record<string, string> = {
    CALL: '📞',
    EMAIL: '✉️',
    MEETING: '🤝',
    TASK: '✅',
    REMINDER: '🔔',
    OTHER: '📌',
};

export default function NotificationBell() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<FollowUp[]>([]);
    const [overdueCount, setOverdueCount] = useState(0);
    const [todayCount, setTodayCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            setLoading(true);

            const [overdueRes, upcomingRes] = await Promise.all([
                followUpsApi.list({ overdue: 'true', limit: 10 }),
                followUpsApi.list({ upcoming: 1, status: 'PENDING', limit: 10 }),
            ]);

            const overdue = overdueRes.success ? overdueRes.data || [] : [];
            const upcoming = upcomingRes.success ? upcomingRes.data || [] : [];

            const allNotifications = [...overdue];
            upcoming.forEach((item: FollowUp) => {
                if (!allNotifications.find((n) => n.id === item.id)) {
                    allNotifications.push(item);
                }
            });

            allNotifications.sort((a, b) => {
                const aOverdue = new Date(a.dueDate) < new Date();
                const bOverdue = new Date(b.dueDate) < new Date();
                if (aOverdue && !bOverdue) return -1;
                if (!aOverdue && bOverdue) return 1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            });

            setNotifications(allNotifications.slice(0, 10));
            setOverdueCount(overdue.length);
            setTodayCount(upcoming.length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const totalCount = overdueCount + todayCount;
    const isOverdue = (followUp: FollowUp) => new Date(followUp.dueDate) < new Date();

    const handleItemClick = (followUp: FollowUp) => {
        setIsOpen(false);
        router.push(`/dashboard/followups/${followUp.id}`);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>

                {totalCount > 0 && (
                    <span
                        className={`absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs font-bold text-white rounded-full px-1 ${
                            overdueCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'
                        }`}
                    >
                        {totalCount > 99 ? '99+' : totalCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900">Powiadomienia</h3>
                            <div className="flex gap-2">
                                {overdueCount > 0 && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                        {overdueCount} zaległych
                                    </span>
                                )}
                                {todayCount > 0 && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                        {todayCount} na dziś
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <svg
                                        className="w-6 h-6 text-green-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </div>
                                <p className="text-slate-600 font-medium">Wszystko zrobione!</p>
                                <p className="text-sm text-slate-400">Brak zaległych zadań</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map((followUp) => {
                                    const priority = priorityConfig[followUp.priority];

                                    return (
                                        <button
                                            key={followUp.id}
                                            onClick={() => handleItemClick(followUp)}
                                            className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                                                isOverdue(followUp) ? 'bg-red-50/50' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Icon */}
                                                <div
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                                                        isOverdue(followUp) ? 'bg-red-100' : 'bg-slate-100'
                                                    }`}
                                                >
                                                    {typeIcons[followUp.type] || '📌'}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-slate-900 truncate">
                                                            {followUp.title}
                                                        </p>
                                                        <span className={`px-1.5 py-0.5 text-xs rounded whitespace-nowrap ${priority.color}`}>
                                                            {priority.icon && <span className="mr-0.5">{priority.icon}</span>}
                                                            {priority.label}
                                                        </span>
                                                    </div>

                                                    {followUp.client && (
                                                        <p className="text-sm text-slate-500 truncate">
                                                            {followUp.client.name}
                                                        </p>
                                                    )}

                                                    <p
                                                        className={`text-xs mt-1 ${
                                                            isOverdue(followUp)
                                                                ? 'text-red-600 font-medium'
                                                                : 'text-slate-400'
                                                        }`}
                                                    >
                                                        {isOverdue(followUp) ? '⚠️ Zaległe: ' : '📅 '}
                                                        {formatDate(followUp.dueDate)}
                                                    </p>
                                                </div>

                                                {/* Arrow */}
                                                <svg
                                                    className="w-4 h-4 text-slate-400 flex-shrink-0"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5l7 7-7 7"
                                                    />
                                                </svg>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/dashboard/followups');
                            }}
                            className="w-full text-center text-sm font-medium text-cyan-600 hover:text-cyan-700"
                        >
                            Zobacz wszystkie follow-upy →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}