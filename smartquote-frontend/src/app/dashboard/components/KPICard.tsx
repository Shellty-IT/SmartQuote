'use client';

interface KPICardProps {
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
    iconBg: string;
    description?: string;
}

export default function KPICard({ title, value, change, changeType, icon, iconBg, description }: KPICardProps) {
    const changeColors = {
        positive: 'text-emerald-500 bg-emerald-500/10',
        negative: 'text-red-500 bg-red-500/10',
        neutral: 'text-slate-500 bg-slate-500/10',
    };

    const changeIcons = {
        positive: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
        ),
        negative: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 7l-9.2 9.2M7 7v10h10" />
            </svg>
        ),
        neutral: (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" />
            </svg>
        ),
    };

    return (
        <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/60 transition-all duration-300">
            {/* Gradient accent on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
                        {icon}
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${changeColors[changeType]}`}>
                        {changeIcons[changeType]}
                        {change}
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
                    {description && (
                        <p className="text-xs text-slate-400 mt-2">{description}</p>
                    )}
                </div>
            </div>
        </div>
    );
}