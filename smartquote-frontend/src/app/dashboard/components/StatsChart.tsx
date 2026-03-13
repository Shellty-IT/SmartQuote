// src/app/dashboard/components/StatsChart.tsx
'use client';

import { useState } from 'react';

interface StatusData {
    label: string;
    value: number;
    color: string;
    bgColor: string;
}

interface StatsChartProps {
    data: StatusData[];
    total: number;
}

export default function StatsChart({ data, total }: StatsChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2 overflow-hidden rounded-xl h-3">
                {data.map((item, index) => {
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;
                    if (percentage === 0) return null;
                    return (
                        <div
                            key={index}
                            className={`h-full transition-all duration-500 first:rounded-l-xl last:rounded-r-xl ${item.color} ${
                                hoveredIndex === index ? 'opacity-100 scale-y-125' : hoveredIndex !== null ? 'opacity-60' : 'opacity-90'
                            }`}
                            style={{ width: `${percentage}%`, minWidth: percentage > 0 ? '4px' : '0' }}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        />
                    );
                })}
                {total === 0 && (
                    <div className="h-full w-full rounded-xl" style={{ backgroundColor: 'var(--divider)' }} />
                )}
            </div>

            <div className="space-y-3">
                {data.map((item, index) => {
                    const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

                    return (
                        <div
                            key={index}
                            className={`group transition-all duration-200 rounded-lg px-3 py-2 -mx-3 ${
                                hoveredIndex === index ? 'scale-[1.01]' : ''
                            }`}
                            style={{ backgroundColor: hoveredIndex === index ? 'var(--hover-bg)' : 'transparent' }}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                    <span className="text-sm text-themed">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-themed">{item.value}</span>
                                    <span className="text-xs text-themed-muted w-8 text-right">{percentage}%</span>
                                </div>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--divider)' }}>
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ease-out ${item.color}`}
                                    style={{ width: `${barWidth}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}