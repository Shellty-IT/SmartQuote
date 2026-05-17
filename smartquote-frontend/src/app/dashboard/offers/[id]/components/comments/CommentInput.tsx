// src/app/dashboard/offers/[id]/components/comments/CommentInput.tsx
'use client';

interface CommentInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    isSending: boolean;
}

export function CommentInput({ value, onChange, onSubmit, isSending }: CommentInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="flex gap-2">
      <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          placeholder="Odpowiedz klientowi..."
          rows={2}
          className="flex-1 px-4 py-3 rounded-xl border input-themed resize-none disabled:opacity-50 text-sm"
      />
            <button
                onClick={onSubmit}
                disabled={!value.trim() || isSending}
                className="self-end px-4 py-3 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
                {isSending ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                )}
            </button>
        </div>
    );
}