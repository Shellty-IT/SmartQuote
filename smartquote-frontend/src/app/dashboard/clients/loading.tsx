import { SkeletonFilterBar, SkeletonMobileCard, SkeletonStatsCard } from '@/components/ui/Skeleton';

export default function ClientsLoading() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonStatsCard key={i} />)}
            </div>
            <SkeletonFilterBar />
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonMobileCard key={i} />)}
            </div>
        </div>
    );
}
