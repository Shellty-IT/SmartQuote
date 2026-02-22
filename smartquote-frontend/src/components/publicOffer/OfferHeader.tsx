// SmartQuote-AI/src/components/publicOffer/OfferHeader.tsx

'use client';

import type { PublicOfferData } from '@/types';

interface OfferHeaderProps {
    seller: PublicOfferData['offer']['seller'];
    client: PublicOfferData['offer']['client'];
    offerNumber: string;
    title: string;
    description: string | null;
    createdAt: string;
    validUntil: string | null;
    expired: boolean;
}

function formatDateLocal(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

export default function OfferHeader({
                                        seller,
                                        client,
                                        offerNumber,
                                        title,
                                        description,
                                        createdAt,
                                        validUntil,
                                        expired,
                                    }: OfferHeaderProps) {
    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:justify-between gap-6">
                    <div className="flex items-start gap-4">
                        {seller.logo ? (
                            <img
                                src={seller.logo}
                                alt={seller.company || ''}
                                className="w-16 h-16 object-contain rounded-lg flex-shrink-0"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                                {(seller.company || seller.name || 'S').charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                {seller.company || seller.name}
                            </h2>
                            {seller.address && (
                                <p className="text-sm text-slate-600">{seller.address}</p>
                            )}
                            {(seller.postalCode || seller.city) && (
                                <p className="text-sm text-slate-600">
                                    {[seller.postalCode, seller.city].filter(Boolean).join(' ')}
                                </p>
                            )}
                            {seller.nip && (
                                <p className="text-sm text-slate-500 mt-1">NIP: {seller.nip}</p>
                            )}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                                {seller.email && (
                                    <a
                                        href={`mailto:${seller.email}`}
                                        className="text-sm text-cyan-600 hover:text-cyan-700 transition-colors"
                                    >
                                        {seller.email}
                                    </a>
                                )}
                                {seller.phone && (
                                    <a
                                        href={`tel:${seller.phone}`}
                                        className="text-sm text-cyan-600 hover:text-cyan-700 transition-colors"
                                    >
                                        {seller.phone}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-left md:text-right flex-shrink-0">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Oferta</p>
                        <p className="text-xl font-bold text-cyan-600 mt-1">{offerNumber}</p>
                        <div className="mt-3 space-y-1">
                            <p className="text-sm text-slate-600">
                                <span className="text-slate-400">Wystawiona: </span>
                                {formatDateLocal(createdAt)}
                            </p>
                            {validUntil && (
                                <p className={`text-sm font-medium ${expired ? 'text-red-600' : 'text-slate-600'}`}>
                                    <span className={expired ? 'text-red-400' : 'text-slate-400'}>
                                        Ważna do:{' '}
                                    </span>
                                    {formatDateLocal(validUntil)}
                                    {expired && (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                            Wygasła
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-2">
                    Przygotowana dla
                </p>
                <p className="text-lg font-semibold text-slate-900">{client.name}</p>
                {client.company && client.company !== client.name && (
                    <p className="text-slate-600">{client.company}</p>
                )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                {description && (
                    <p className="mt-3 text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}