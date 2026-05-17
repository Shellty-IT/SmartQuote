// src/components/publicOffer/VariantSelector.tsx
'use client';

interface VariantSelectorProps {
    variants: string[];
    selectedVariant: string | null;
    onSelect: (variant: string) => void;
    disabled?: boolean;
    primaryColor: string;
}

export default function VariantSelector({
                                            variants,
                                            selectedVariant,
                                            onSelect,
                                            disabled = false,
                                            primaryColor,
                                        }: VariantSelectorProps) {
    if (variants.length === 0) return null;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
                <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    style={{ color: primaryColor }}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                </svg>
                <h2 className="text-lg font-semibold text-slate-900">
                    Wybierz wariant
                </h2>
            </div>

            <p className="text-sm text-slate-500 mb-4">
                Oferta zawiera {variants.length} wariant{variants.length > 1 ? 'y' : ''}.
                Wybierz ten, który najlepiej odpowiada Twoim potrzebom.
            </p>

            <div className="flex flex-wrap gap-2">
                {variants.map((variant) => {
                    const isSelected = selectedVariant === variant;

                    return (
                        <button
                            key={variant}
                            onClick={() => !disabled && onSelect(variant)}
                            disabled={disabled}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                isSelected
                                    ? 'text-white shadow-lg'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            style={
                                isSelected
                                    ? {
                                        backgroundColor: primaryColor,
                                        boxShadow: `0 10px 15px -3px ${primaryColor}40`,
                                    }
                                    : undefined
                            }
                        >
                            {variant}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}