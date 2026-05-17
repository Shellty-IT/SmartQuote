// src/app/dashboard/components/DashboardSkeleton.tsx

import {
    Skeleton,
    SkeletonLine,
    SkeletonKPICard,
    SkeletonOfferRow,
    SkeletonInsightCard,
} from '@/components/ui/Skeleton';

const chartBarWidths = ['65%', '45%', '80%', '30%', '55%', '20%'];

export default function DashboardSkeleton() {
    return (
        <div className="min-h-screen">
            <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                    <div className="space-y-2">
                        <SkeletonLine width={220} height={28} />
                        <SkeletonLine width={280} height={14} />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="rounded-lg" width={120} height={36} />
                        <Skeleton className="rounded-lg" width={130} height={36} />
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonKPICard key={i} />
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">

                    <div className="xl:col-span-8 space-y-4 sm:space-y-6">

                        <div className="rounded-2xl border overflow-hidden dash-section">
                            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b dash-section-header">
                                <div className="space-y-1.5">
                                    <SkeletonLine width={150} height={18} />
                                    <SkeletonLine width={210} height={13} />
                                </div>
                                <SkeletonLine width={85} height={14} />
                            </div>
                            <div className="divide-y" style={{ borderColor: 'var(--divider)' }}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <SkeletonOfferRow key={i} />
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border overflow-hidden dash-section">
                            <div className="px-4 sm:px-6 py-4 border-b dash-section-header">
                                <SkeletonLine width={200} height={18} />
                            </div>
                            <div className="p-4 sm:p-6 space-y-3">
                                {chartBarWidths.map((width, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <SkeletonLine width={75} height={14} />
                                        <div className="flex-1">
                                            <Skeleton className="rounded" width={width} height={24} />
                                        </div>
                                        <SkeletonLine width={24} height={14} />
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="xl:col-span-4 space-y-4 sm:space-y-6">

                        <div className="rounded-2xl border overflow-hidden ai-card-themed">
                            <div
                                className="flex items-center justify-between px-5 py-3.5 border-b"
                                style={{ borderColor: 'var(--ai-card-border)', backgroundColor: 'var(--ai-info-from)' }}
                            >
                                <div className="flex items-center gap-2">
                                    <Skeleton className="rounded-lg" width={32} height={32} />
                                    <SkeletonLine width={80} height={14} />
                                </div>
                                <SkeletonLine width={75} height={13} />
                            </div>
                            <div className="p-4 space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <SkeletonInsightCard key={i} />
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border overflow-hidden dash-section">
                            <div className="px-4 sm:px-5 py-4 border-b dash-section-header">
                                <SkeletonLine width={120} height={16} />
                            </div>
                            <div className="p-4 sm:p-5 space-y-1.5">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                                        <Skeleton className="rounded-lg flex-shrink-0" width={36} height={36} />
                                        <div className="flex-1 space-y-1.5">
                                            <SkeletonLine width="45%" height={14} />
                                            <SkeletonLine width="65%" height={12} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}