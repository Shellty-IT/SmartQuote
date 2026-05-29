'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    width?: string | number;
    height?: string | number;
}

function Skeleton({ className, width, height, style, ...props }: SkeletonProps) {
    const inline: React.CSSProperties = { ...style };
    if (width !== undefined) inline.width = typeof width === 'number' ? `${width}px` : width;
    if (height !== undefined) inline.height = typeof height === 'number' ? `${height}px` : height;
    return (
        <div
            className={cn('animate-pulse rounded-md bg-muted', className)}
            style={inline}
            {...props}
        />
    );
}

function SkeletonLine({
    width = '100%',
    height = 14,
    className = '',
}: { width?: string | number; height?: number; className?: string }) {
    return <Skeleton className={cn('rounded', className)} width={width} height={height} />;
}

function SkeletonCircle({ size = 40, className = '' }: { size?: number; className?: string }) {
    return <Skeleton className={cn('rounded-full', className)} width={size} height={size} />;
}

function SkeletonKPICard() {
    return (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
                <SkeletonLine width="55%" height={12} />
                <Skeleton className="shrink-0 rounded-xl" width={40} height={40} />
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
        <div className="flex items-center gap-4 px-6 py-4">
            <SkeletonCircle size={40} className="shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <SkeletonLine width="55%" height={14} />
                    <Skeleton className="hidden rounded-full sm:block" width={60} height={20} />
                </div>
                <SkeletonLine width="35%" height={12} />
            </div>
            <div className="flex shrink-0 flex-col items-end space-y-2">
                <SkeletonLine width={85} height={14} />
                <SkeletonLine width={65} height={12} />
            </div>
        </div>
    );
}

function SkeletonInsightCard() {
    return (
        <div className="rounded-xl border border-border p-3.5">
            <div className="mb-2 flex items-center gap-2">
                <Skeleton className="shrink-0 rounded-full" width={8} height={8} />
                <SkeletonLine width="28%" height={12} />
                <Skeleton className="rounded-full" width={55} height={18} />
            </div>
            <div className="mb-2 space-y-1.5">
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
                        <SkeletonLine
                            width={i === 0 ? '75%' : i === columns - 1 ? '50%' : '60%'}
                            height={14}
                        />
                        {i < 2 && <SkeletonLine width="45%" height={11} />}
                    </div>
                </td>
            ))}
        </tr>
    );
}

function SkeletonStatsCard() {
    return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-2">
                <SkeletonLine width="60%" height={12} />
            </div>
            <SkeletonLine width="35%" height={26} />
        </div>
    );
}

function SkeletonStatsCardWithIcon() {
    return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                    <SkeletonLine width="60%" height={12} />
                    <SkeletonLine width="35%" height={26} />
                </div>
                <Skeleton className="shrink-0 rounded-lg" width={40} height={40} />
            </div>
        </div>
    );
}

function SkeletonFilterBar({ extraFilters = 2 }: { extraFilters?: number }) {
    return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:gap-4">
                <div className="flex-1">
                    <Skeleton className="w-full rounded-lg" height={42} />
                </div>
                <div className="flex gap-3">
                    {Array.from({ length: extraFilters }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className="flex-1 rounded-lg md:flex-none"
                            width={180}
                            height={42}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function SkeletonMobileCard() {
    return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <SkeletonCircle size={40} className="shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <SkeletonLine width="65%" height={14} />
                        <SkeletonLine width="40%" height={12} />
                    </div>
                </div>
                <Skeleton className="shrink-0 rounded-full" width={65} height={22} />
            </div>
            <div className="mb-3 flex items-center justify-between">
                <div className="space-y-1.5">
                    <SkeletonLine width={100} height={12} />
                    <SkeletonLine width={80} height={10} />
                </div>
                <div className="flex flex-col items-end space-y-1.5">
                    <SkeletonLine width={90} height={14} />
                    <SkeletonLine width={70} height={12} />
                </div>
            </div>
            <div className="flex items-center gap-2 border-t border-border pt-3">
                <Skeleton className="flex-1 rounded-lg" height={34} />
                <Skeleton className="flex-1 rounded-lg" height={34} />
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
