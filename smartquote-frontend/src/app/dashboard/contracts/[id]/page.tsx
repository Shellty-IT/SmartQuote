// SmartQuote-AI/src/app/dashboard/contracts/[id]/page.tsx

'use client';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useContract, useContracts } from '@/hooks/useContracts';
import { Button, Badge, Card, LoadingSpinner } from '@/components/ui';
import { formatCurrency, formatDate, getContractStatusConfig } from '@/lib/utils';
import { ContractStatus } from '@/types';
import {
    ArrowLeftIcon,
    PencilIcon,
    DocumentArrowDownIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

const STATUS_ACTIONS: Record<ContractStatus, { next: ContractStatus; label: string; icon: typeof CheckCircleIcon }[]> = {
    DRAFT: [
        { next: 'PENDING_SIGNATURE', label: 'Wyślij do podpisu', icon: ClockIcon },
    ],
    PENDING_SIGNATURE: [
        { next: 'ACTIVE', label: 'Oznacz jako podpisaną', icon: CheckCircleIcon },
        { next: 'TERMINATED', label: 'Anuluj', icon: XCircleIcon },
    ],
    ACTIVE: [
        { next: 'COMPLETED', label: 'Zakończ umowę', icon: CheckCircleIcon },
        { next: 'TERMINATED', label: 'Rozwiąż umowę', icon: XCircleIcon },
    ],
    COMPLETED: [],
    TERMINATED: [],
    EXPIRED: [],
};

export default function ContractDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { contract, loading, error } = useContract(id);
    const { updateStatus } = useContracts();

    const handleStatusChange = async (newStatus: ContractStatus) => {
        await updateStatus(id, newStatus);
        router.refresh();
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error || !contract) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500">{error || 'Umowa nie znaleziona'}</p>
                <Link href="/dashboard/contracts">
                    <Button variant="outline" className="mt-4">
                        Wróć do listy
                    </Button>
                </Link>
            </div>
        );
    }

    const statusConfig = getContractStatusConfig(contract.status);
    const availableActions = STATUS_ACTIONS[contract.status] || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/dashboard/contracts">
                        <Button variant="ghost" size="sm">
                            <ArrowLeftIcon className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{contract.number}</h1>
                        <p className="text-gray-500">{contract.title}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                    </Badge>
                </div>
            </div>

            {/* Status Actions */}
            {availableActions.length > 0 && (
                <Card className="p-4">
                    <div className="flex flex-wrap gap-2">
                        {availableActions.map((action) => (
                            <Button
                                key={action.next}
                                variant={action.next === 'TERMINATED' ? 'danger' : 'primary'}
                                onClick={() => handleStatusChange(action.next)}
                            >
                                <action.icon className="h-5 w-5 mr-2" />
                                {action.label}
                            </Button>
                        ))}
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Contract Info */}
                    <Card>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Szczegóły umowy</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {contract.description && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Opis</label>
                                    <p className="mt-1 text-gray-900">{contract.description}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Data rozpoczęcia</label>
                                    <p className="mt-1 text-gray-900">
                                        {contract.startDate ? formatDate(contract.startDate) : '-'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Data zakończenia</label>
                                    <p className="mt-1 text-gray-900">
                                        {contract.endDate ? formatDate(contract.endDate) : '-'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Data podpisania</label>
                                    <p className="mt-1 text-gray-900">
                                        {contract.signedAt ? formatDate(contract.signedAt) : '-'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Termin płatności</label>
                                    <p className="mt-1 text-gray-900">{contract.paymentDays} dni</p>
                                </div>
                            </div>
                            {contract.terms && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Warunki umowy</label>
                                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">{contract.terms}</p>
                                </div>
                            )}
                            {contract.offerId && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Utworzona z oferty</label>
                                    <Link
                                        href={`/dashboard/offers/${contract.offerId}`}
                                        className="mt-1 text-blue-600 hover:underline block"
                                    >
                                        {contract.offer?.number || contract.offerId}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Items */}
                    <Card>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Pozycje umowy</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Nazwa
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Ilość
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Cena jedn.
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        VAT
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Wartość brutto
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {contract.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                            {item.description && (
                                                <div className="text-sm text-gray-500">{item.description}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                                            {item.quantity} {item.unit}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                                            {formatCurrency(item.unitPrice)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                                            {item.vatRate}%
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                            {formatCurrency(item.totalGross)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                                        Suma netto:
                                    </td>
                                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                                        {formatCurrency(contract.totalNet)}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                                        VAT:
                                    </td>
                                    <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                                        {formatCurrency(contract.totalVat)}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-bold text-gray-900">
                                        RAZEM BRUTTO:
                                    </td>
                                    <td className="px-6 py-3 text-right text-lg font-bold text-gray-900">
                                        {formatCurrency(contract.totalGross, contract.currency)}
                                    </td>
                                </tr>
                                </tfoot>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Client */}
                    <Card>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Klient</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Nazwa</label>
                                <p className="mt-1 text-gray-900 font-medium">{contract.client.name}</p>
                            </div>
                            {contract.client.company && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Firma</label>
                                    <p className="mt-1 text-gray-900">{contract.client.company}</p>
                                </div>
                            )}
                            {contract.client.email && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Email</label>
                                    <p className="mt-1 text-gray-900">{contract.client.email}</p>
                                </div>
                            )}
                            {contract.client.phone && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Telefon</label>
                                    <p className="mt-1 text-gray-900">{contract.client.phone}</p>
                                </div>
                            )}
                            {contract.client.nip && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">NIP</label>
                                    <p className="mt-1 text-gray-900">{contract.client.nip}</p>
                                </div>
                            )}
                            <Link href={`/dashboard/clients/${contract.client.id}`}>
                                <Button variant="outline" size="sm" className="w-full mt-4">
                                    Zobacz profil klienta
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Akcje</h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <Link href={`/dashboard/contracts/${contract.id}/edit`}>
                                <Button variant="outline" className="w-full">
                                    <PencilIcon className="h-5 w-5 mr-2" />
                                    Edytuj umowę
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={async () => {
                                    try {
                                        const blob = await api.downloadBlob(`/contracts/${contract.id}/pdf`);
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `umowa-${contract.number.replace(/\//g, '-')}.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                    } catch (error) {
                                        console.error('Błąd pobierania PDF:', error);
                                        alert('Nie udało się pobrać PDF');
                                    }
                                }}
                            >
                                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                                Pobierz PDF
                            </Button>
                        </div>
                    </Card>

                    {/* Notes */}
                    {contract.notes && (
                        <Card>
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold">Notatki</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-700 whitespace-pre-wrap">{contract.notes}</p>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}