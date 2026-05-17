import { SkeletonFilterBar, SkeletonTableRow, SkeletonStatsCardWithIcon } from '@/components/ui/Skeleton';

export default function ContractsLoading() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonStatsCardWithIcon key={i} />)}
            </div>
            <SkeletonFilterBar />
            <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} />)}
            </div>
        </div>
    );
}
