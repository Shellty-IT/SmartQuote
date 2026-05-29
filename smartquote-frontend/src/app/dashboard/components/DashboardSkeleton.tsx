// src/app/dashboard/components/DashboardSkeleton.tsx
import { Skeleton, SkeletonLine, SkeletonKPICard, SkeletonOfferRow, SkeletonInsightCard } from '@/components/ui/Skeleton';

export default function DashboardSkeleton() {
    return (
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 sm:px-6">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-2">
                    <SkeletonLine width={80} height={11} />
                    <SkeletonLine width={240} height={28} />
                    <SkeletonLine width={280} height={14} />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="rounded-xl" width={130} height={40} />
                    <Skeleton className="rounded-xl" width={120} height={40} />
                </div>
            </div>

            {/* KPI grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonKPICard key={i} />)}
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                {/* Recent offers */}
                <div className="xl:col-span-2 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border px-6 py-5">
                        <div className="space-y-1.5">
                            <SkeletonLine width={140} height={18} />
                            <SkeletonLine width={200} height={13} />
                        </div>
                        <SkeletonLine width={70} height={14} />
                    </div>
                    <div className="divide-y divide-border/60">
                        {Array.from({ length: 5 }).map((_, i) => <SkeletonOfferRow key={i} />)}
                    </div>
                </div>

                {/* AI insights */}
                <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                        <div className="flex items-center gap-2.5">
                            <Skeleton className="rounded-xl" width={36} height={36} />
                            <div className="space-y-1">
                                <SkeletonLine width={90} height={14} />
                                <SkeletonLine width={50} height={10} />
                            </div>
                        </div>
                        <SkeletonLine width={60} height={12} />
                    </div>
                    <div className="space-y-2.5 p-4">
                        {Array.from({ length: 3 }).map((_, i) => <SkeletonInsightCard key={i} />)}
                    </div>
                </div>
            </div>

            {/* Bottom grid */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                {/* Status chart */}
                <div className="xl:col-span-2 rounded-2xl border border-border bg-card shadow-card p-6 space-y-4">
                    <div className="space-y-1">
                        <SkeletonLine width={180} height={18} />
                        <SkeletonLine width={100} height={12} />
                    </div>
                    <Skeleton className="rounded-full" height={10} />
                    <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-border bg-surface-subtle p-3 space-y-2">
                                <div className="flex justify-between">
                                    <SkeletonLine width="55%" height={14} />
                                    <SkeletonLine width="25%" height={14} />
                                </div>
                                <Skeleton className="rounded-full" height={6} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick actions */}
                <div className="rounded-2xl border border-border bg-card shadow-card p-6 space-y-3">
                    <SkeletonLine width={120} height={18} />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface-subtle p-3">
                            <Skeleton className="rounded-xl shrink-0" width={40} height={40} />
                            <div className="flex-1 space-y-1.5">
                                <SkeletonLine width="50%" height={14} />
                                <SkeletonLine width="70%" height={11} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
