import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface TranslationState {
    language: string;
    translations: Record<string, string>;
    setLanguage: (lang: string) => Promise<void>;
    fetchTranslations: () => Promise<void>;
}

export const useTranslationStore = create<TranslationState>()(
    persist(
        (set, get) => ({
            language: 'en',
            translations: {},
            setLanguage: async (lang: string) => {
                set({ language: lang });
                await get().fetchTranslations();
            },
            fetchTranslations: async () => {
                const { language } = get();
                try {
                    const response = await api.get(`/api/v1/translations/${language}`);
                    set({ translations: response.data });
                    // Set document direction for RTL support
                    if (typeof document !== 'undefined') {
                        if (language === 'ar') {
                            document.documentElement.dir = 'rtl';
                        } else {
                            document.documentElement.dir = 'ltr';
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch translations:', error);
                }
            },
        }),
        {
            name: 'translation-storage',
        }
    )
);
