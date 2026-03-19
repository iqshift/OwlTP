"use client";

import { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const { language, fetchTranslations } = useTranslation();

    useEffect(() => {
        // Initial fetch
        fetchTranslations();
    }, [fetchTranslations]);

    useEffect(() => {
        // Sync HTML attributes
        if (typeof document !== 'undefined') {
            const html = document.documentElement;
            html.dir = language === 'ar' ? 'rtl' : 'ltr';
            html.lang = language;

            // Update body classes if needed
            document.body.dir = html.dir;
        }
    }, [language]);

    return <>{children}</>;
};
