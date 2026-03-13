// src/components/ai/AIOfferGenerator.tsx
'use client';

import { useState } from 'react';
import { Modal, Button, Textarea, LoadingSpinner } from '@/components/ui';
import { useAI } from '@/hooks/useAI';
import { GeneratedOffer } from '@/types';

interface AIOfferGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    onOfferGenerated: (offer: GeneratedOffer) => void;
    clientId?: string;
    clientName?: string;
}

export function AIOfferGenerator({
                                     isOpen,
                                     onClose,
                                     onOfferGenerated,
                                     clientId,
                                     clientName,
                                 }: AIOfferGeneratorProps) {
    const { generateOffer, isLoading } = useAI();
    const [description, setDescription] = useState('');
    const [generatedOffer, setGeneratedOffer] = useState<GeneratedOffer | null>(null);
    const [step, setStep] = useState<'input' | 'preview'>('input');

    const handleGenerate = async () => {
        if (!description.trim()) return;

        const offer = await generateOffer(description, clientId);
        if (offer) {
            setGeneratedOffer(offer);
            setStep('preview');
        }
    };

    const handleAccept = () => {
        if (generatedOffer) {
            onOfferGenerated(generatedOffer);
            handleClose();
        }
    };

    const handleClose = () => {
        setDescription('');
        setGeneratedOffer(null);
        setStep('input');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="✨ Generuj ofertę z AI"
            size="lg"
        >
            {step === 'input' ? (
                <div className="space-y-4">
                    {clientName && (
                        <div className="p-3 ai-card-themed border rounded-lg text-sm">
                            Tworzysz ofertę dla: <strong>{clientName}</strong>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-themed-label mb-2">
                            Opisz potrzeby klienta i oczekiwany zakres oferty
                        </label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Np. Klient potrzebuje strony internetowej dla małej firmy. Chce stronę z 5 podstronami, formularzem kontaktowym, integracją z Google Analytics. Budżet około 5000-7000 PLN."
                            rows={6}
                        />
                        <p className="mt-2 text-xs text-themed-muted">
                            Im więcej szczegółów podasz, tym lepsza będzie wygenerowana oferta.
                        </p>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={handleClose}>
                            Anuluj
                        </Button>
                        <Button
                            onClick={handleGenerate}
                            disabled={!description.trim() || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Generuję...
                                </>
                            ) : (
                                'Generuj ofertę'
                            )}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {generatedOffer && (
                        <>
                            <div className="p-4 section-themed rounded-lg">
                                <h3 className="font-semibold text-lg text-themed mb-4">{generatedOffer.title}</h3>

                                <div className="space-y-3">
                                    {generatedOffer.items.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex justify-between items-center p-3 card-themed border rounded"
                                        >
                                            <div>
                                                <div className="font-medium text-themed">{item.name}</div>
                                                {item.description && (
                                                    <div className="text-sm text-themed-muted">{item.description}</div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-themed">
                                                    {item.unitPrice.toLocaleString('pl-PL')} PLN
                                                </div>
                                                <div className="text-xs text-themed-muted">
                                                    {item.quantity} {item.unit} × VAT {item.vatRate}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {generatedOffer.notes && (
                                    <div className="mt-4 p-3 badge-warning rounded text-sm">
                                        📝 {generatedOffer.notes}
                                    </div>
                                )}

                                <div className="mt-4 text-right text-sm text-themed-muted">
                                    Ważność: {generatedOffer.validDays} dni
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <Button variant="outline" onClick={() => setStep('input')}>
                                    ← Wróć i zmień
                                </Button>
                                <Button onClick={handleAccept}>
                                    Użyj tej oferty
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </Modal>
    );
}