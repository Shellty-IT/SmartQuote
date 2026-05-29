import { useContext } from 'react';
import { LanguageContext } from '@/app/providers';
import { pl } from './pl';
import { en } from './en';

type Language = 'pl' | 'en';

type DeepReadonlyString<T> = {
    readonly [K in keyof T]: T[K] extends Record<string, unknown>
        ? DeepReadonlyString<T[K]>
        : string;
};

type Translations = DeepReadonlyString<typeof pl>;

const translations: Record<Language, Translations> = { pl, en };

export type { Language };
export { LanguageContext };

export function useLanguage() {
    return useContext(LanguageContext);
}

export function useTranslations<N extends keyof Translations>(namespace: N): Translations[N] {
    const { language } = useLanguage();
    return translations[language][namespace];
}
