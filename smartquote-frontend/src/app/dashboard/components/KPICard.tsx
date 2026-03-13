// src/app/dashboard/components/KPICard.tsx
'use client';

interface KPICardProps {
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
    iconBg: string;
    description?: string;
    onClick?: () => void;
}

export default function KPICard({ title, value, change, changeType, icon, iconBg, description, onClick }: KPICardProps) {
    const changeColors = {
        positive: 'text-emerald-500 bg-emerald-500/10',
        negative: 'text-red-500 bg-red-500/10',
        neutral: 'text-themed-muted bg-slate-500/10',
    };

    const changeIcons = {
        positive: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
        ),
        negative: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
        ),
        neutral: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" />
            </svg>
        ),
    };

    return (
        <div
            onClick={onClick}
            className={`group relative rounded-2xl p-5 sm:p-6 border transition-all duration-300 card-themed
                hover:shadow-lg hover:scale-[1.02] ${onClick ? 'cursor-pointer' : ''}`}
            style={{
                borderColor: 'var(--kpi-card-border)',
                backgroundColor: 'var(--kpi-card-bg)',
            }}
        >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
                        {icon}
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${changeColors[changeType]}`}>
                        {changeIcons[changeType]}
                        <span className="hidden sm:inline">{change}</span>
                        <span className="sm:hidden">{change.split(' ')[0]}</span>
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-themed-muted">{title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-themed tracking-tight">{value}</p>
                    {description && (
                        <p className="text-xs text-themed-muted mt-1">{description}</p>
                    )}
                </div>
            </div>
        </div>
    );
}