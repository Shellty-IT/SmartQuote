// src/components/ai/QuickActions.tsx
'use client';

interface QuickActionsProps {
    onAction: (prompt: string) => void;
}

const quickActions = [
    {
        icon: '📄',
        label: 'Stwórz ofertę',
        prompt: 'Pomóż mi stworzyć nową ofertę handlową',
        color: 'bg-blue-500',
    },
    {
        icon: '✉️',
        label: 'Napisz email',
        prompt: 'Pomóż mi napisać profesjonalny email do klienta',
        color: 'bg-green-500',
    },
    {
        icon: '👥',
        label: 'Analizuj klientów',
        prompt: 'Przeanalizuj moich klientów i zasugeruj działania',
        color: 'bg-purple-500',
    },
    {
        icon: '📊',
        label: 'Statystyki',
        prompt: 'Pokaż mi podsumowanie moich statystyk sprzedażowych',
        color: 'bg-orange-500',
    },
    {
        icon: '📅',
        label: 'Zaległe zadania',
        prompt: 'Jakie mam zaległe follow-upy i zadania do wykonania?',
        color: 'bg-red-500',
    },
    {
        icon: '💡',
        label: 'Porady sprzedażowe',
        prompt: 'Daj mi wskazówki jak poprawić konwersję ofert',
        color: 'bg-indigo-500',
    },
];

export function QuickActions({ onAction }: QuickActionsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {quickActions.map((action, index) => (
                <button
                    key={index}
                    onClick={() => onAction(action.prompt)}
                    className="flex items-center gap-3 p-4 rounded-xl border card-themed
                               hover:border-cyan-500 hover:shadow-md transition-all group"
                >
                    <div className={`p-2 rounded-lg ${action.color} text-white text-lg group-hover:scale-110 transition-transform`}>
                        {action.icon}
                    </div>
                    <span className="text-sm font-medium text-themed group-hover:text-cyan-600">
                        {action.label}
                    </span>
                </button>
            ))}
        </div>
    );
}