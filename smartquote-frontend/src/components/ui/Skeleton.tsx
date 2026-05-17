// src/components/ui/Skeleton.tsx

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
}

const SK = 'animate-pulse bg-slate-200/80 dark:bg-slate-700/60';

function Skeleton({ className = '', width, height }: SkeletonProps) {
    const style: React.CSSProperties = {};
    if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;
    return <div className={`${SK} ${className}`} style={style} />;
}

function SkeletonLine({ width = '100%', height = 14, className = '' }: { width?: string | number; height?: number; className?: string }) {
    return <Skeleton className={`rounded ${className}`} width={width} height={height} />;
}

function SkeletonCircle({ size = 40, className = '' }: { size?: number; className?: string }) {
    return <Skeleton className={`rounded-full ${className}`} width={size} height={size} />;
}

function SkeletonKPICard() {
    return (
        <div className="card-themed rounded-xl border p-3 sm:p-4" style={{ borderColor: 'var(--divider)' }}>
            <div className="flex items-center justify-between mb-3">
                <SkeletonLine width="55%" height={12} />
                <Skeleton className="rounded-xl flex-shrink-0" width={40} height={40} />
            </div>
            <div className="mb-2">
                <SkeletonLine width="40%" height={26} />
            </div>
            <div className="space-y-1">
                <SkeletonLine width="65%" height={12} />
                <SkeletonLine width="50%" height={10} />
            </div>
        </div>
    );
}

function SkeletonOfferRow() {
    return (
        <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4">
            <SkeletonCircle size={40} className="flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                    <SkeletonLine width="55%" height={14} />
                    <Skeleton className="rounded-full hidden sm:block" width={60} height={20} />
                </div>
                <SkeletonLine width="35%" height={12} />
            </div>
            <div className="flex-shrink-0 flex flex-col items-end space-y-2">
                <SkeletonLine width={85} height={14} />
                <SkeletonLine width={65} height={12} />
            </div>
        </div>
    );
}

function SkeletonInsightCard() {
    return (
        <div className="rounded-xl p-3.5 border" style={{ borderColor: 'var(--divider)' }}>
            <div className="flex items-center gap-2 mb-2">
                <Skeleton className="rounded-full flex-shrink-0" width={8} height={8} />
                <SkeletonLine width="28%" height={12} />
                <Skeleton className="rounded-full" width={55} height={18} />
            </div>
            <div className="space-y-1.5 mb-2">
                <SkeletonLine width="92%" height={12} />
                <SkeletonLine width="65%" height={12} />
            </div>
            <div className="flex items-center justify-between pt-1">
                <SkeletonLine width="28%" height={11} />
                <SkeletonLine width="18%" height={11} />
            </div>
        </div>
    );
}

function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
    return (
        <tr>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-6 py-4">
                    <div className="space-y-1.5">
                        <SkeletonLine width={i === 0 ? '75%' : i === columns - 1 ? '50%' : '60%'} height={14} />
                        {i < 2 && <SkeletonLine width="45%" height={11} />}
                    </div>
                </td>
            ))}
        </tr>
    );
}

function SkeletonStatsCard() {
    return (
        <div className="card-themed rounded-xl border p-3 md:p-4" style={{ borderColor: 'var(--divider)' }}>
            <div className="mb-2">
                <SkeletonLine width="60%" height={12} />
            </div>
            <SkeletonLine width="35%" height={26} />
        </div>
    );
}

function SkeletonStatsCardWithIcon() {
    return (
        <div className="card-themed rounded-xl border p-4" style={{ borderColor: 'var(--divider)' }}>
            <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                    <SkeletonLine width="60%" height={12} />
                    <SkeletonLine width="35%" height={26} />
                </div>
                <Skeleton className="rounded-lg flex-shrink-0" width={40} height={40} />
            </div>
        </div>
    );
}

function SkeletonFilterBar({ extraFilters = 2 }: { extraFilters?: number }) {
    return (
        <div className="card-themed rounded-xl border p-3 md:p-4" style={{ borderColor: 'var(--divider)' }}>
            <div className="flex flex-col gap-3 md:flex-row md:gap-4">
                <div className="flex-1">
                    <Skeleton className="rounded-lg w-full" height={42} />
                </div>
                <div className="flex gap-3">
                    {Array.from({ length: extraFilters }).map((_, i) => (
                        <Skeleton key={i} className="rounded-lg flex-1 md:flex-none" width={180} height={42} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function SkeletonMobileCard() {
    return (
        <div className="card-themed rounded-xl border p-4" style={{ borderColor: 'var(--divider)' }}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <SkeletonCircle size={40} className="flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <SkeletonLine width="65%" height={14} />
                        <SkeletonLine width="40%" height={12} />
                    </div>
                </div>
                <Skeleton className="rounded-full flex-shrink-0" width={65} height={22} />
            </div>
            <div className="flex items-center justify-between mb-3">
                <div className="space-y-1.5">
                    <SkeletonLine width={100} height={12} />
                    <SkeletonLine width={80} height={10} />
                </div>
                <div className="space-y-1.5 flex flex-col items-end">
                    <SkeletonLine width={90} height={14} />
                    <SkeletonLine width={70} height={12} />
                </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--divider)' }}>
                <Skeleton className="rounded-lg flex-1" height={34} />
                <Skeleton className="rounded-lg flex-1" height={34} />
                <Skeleton className="rounded-lg" width={40} height={34} />
                <Skeleton className="rounded-lg" width={40} height={34} />
            </div>
        </div>
    );
}

export {
    Skeleton,
    SkeletonLine,
    SkeletonCircle,
    SkeletonKPICard,
    SkeletonOfferRow,
    SkeletonInsightCard,
    SkeletonTableRow,
    SkeletonStatsCard,
    SkeletonStatsCardWithIcon,
    SkeletonFilterBar,
    SkeletonMobileCard,
};