import { useTranslationStore } from '@/store/translationStore';
import { useEffect } from 'react';

export const useTranslation = () => {
    const { translations, language, setLanguage, fetchTranslations } = useTranslationStore();

    useEffect(() => {
        if (Object.keys(translations).length === 0) {
            fetchTranslations();
        }
    }, []);

    const t = (key: string, fallback?: string) => {
        return translations[key] || fallback || key;
    };

    return { t, language, setLanguage, fetchTranslations };
};
