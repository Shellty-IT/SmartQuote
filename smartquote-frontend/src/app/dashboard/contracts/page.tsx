// SmartQuote-AI/src/app/dashboard/contracts/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useContracts, useContractsStats } from '@/hooks/useContracts';
import { Button, Badge, Card, LoadingSpinner, EmptyState, ConfirmDialog } from '@/components/ui';
import { formatCurrency, formatDate, getContractStatusConfig } from '@/lib/utils';
import { ContractStatus, Contract } from '@/types';
import {
    DocumentTextIcon,
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    TrashIcon,
    FunnelIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';

const STATUS_OPTIONS: { value: ContractStatus | ''; label: string }[] = [
    { value: '', label: 'Wszystkie statusy' },
    { value: 'DRAFT', label: 'Szkic' },
    { value: 'PENDING_SIGNATURE', label: 'Do podpisu' },
    { value: 'ACTIVE', label: 'Aktywna' },
    { value: 'COMPLETED', label: 'Zakończona' },
    { value: 'TERMINATED', label: 'Rozwiązana' },
    { value: 'EXPIRED', label: 'Wygasła' },
];

export default function ContractsPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<ContractStatus | ''>('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const {
        contracts,
        pagination,
        loading,
        deleteContract
    } = useContracts({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
    });

    const { stats } = useContractsStats();

    const handleDelete = async () => {
        if (deleteId) {
            await deleteContract(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Umowy</h1>
                    <p className="text-gray-500 mt-1">
                        Zarządzaj umowami z klientami
                    </p>
                </div>
                <Link href="/dashboard/contracts/new">
                    <Button>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Nowa umowa
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                        <p className="text-sm text-gray-500">Wszystkie</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-gray-500">Aktywne</p>
                        <p className="text-2xl font-bold text-green-600">
                            {stats.byStatus.ACTIVE || 0}
                        </p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-gray-500">Do podpisu</p>
                        <p className="text-2xl font-bold text-yellow-600">
                            {stats.byStatus.PENDING_SIGNATURE || 0}
                        </p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-gray-500">Wartość aktywnych</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(stats.activeValue)}
                        </p>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Szukaj umów..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <FunnelIcon className="h-5 w-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as ContractStatus | '');
                                setPage(1);
                            }}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {STATUS_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                </div>
            ) : !contracts || contracts.length === 0 ? (
                <EmptyState
                    icon={<DocumentTextIcon className="h-12 w-12" />}
                    title="Brak umów"
                    description={search || statusFilter
                        ? "Nie znaleziono umów spełniających kryteria"
                        : "Utwórz pierwszą umowę lub wygeneruj ją z oferty"
                    }
                    action={{
                        label: "Nowa umowa",
                        onClick: () => { window.location.href = '/dashboard/contracts/new'; }
                    }}
                />
            ) : (
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Numer / Tytuł
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Klient
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Wartość
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Data
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Akcje
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {contracts.map((contract: Contract) => {
                                const statusConfig = getContractStatusConfig(contract.status);
                                return (
                                    <tr key={contract.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {contract.number}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {contract.title}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {contract.client.name}
                                            </div>
                                            {contract.client.company && (
                                                <div className="text-sm text-gray-500">
                                                    {contract.client.company}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                                                {statusConfig.label}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatCurrency(contract.totalGross, contract.currency)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                netto: {formatCurrency(contract.totalNet, contract.currency)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {contract.signedAt ? (
                                                <div>
                                                    <span className="text-green-600">Podpisana:</span>
                                                    <br />
                                                    {formatDate(contract.signedAt)}
                                                </div>
                                            ) : (
                                                formatDate(contract.createdAt)
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Link href={`/dashboard/contracts/${contract.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <EyeIcon className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteId(contract.id)}
                                                >
                                                    <TrashIcon className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Pokazano {contracts.length} z {pagination.total} umów
                            </p>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeftIcon className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-gray-700">
                                    {page} / {pagination.totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                >
                                    <ChevronRightIcon className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Delete Confirm Dialog */}
            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Usuń umowę"
                description="Czy na pewno chcesz usunąć tę umowę? Ta operacja jest nieodwracalna."
                confirmLabel="Usuń"
                variant="danger"
            />
        </div>
    );
}