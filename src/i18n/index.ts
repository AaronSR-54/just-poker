import { useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { messages } from './translations';

export type Locale = 'es' | 'en';

export const LOCALES: Locale[] = ['es', 'en'];

export const LOCALE_LABELS: Record<Locale, string> = {
  es: 'ES',
  en: 'EN',
};

/**
 * Idioma inicial según el idioma del sistema/navegador. Recorre la lista de
 * preferencias y devuelve el primer idioma soportado; si no hay ninguno,
 * inglés. Solo se usa como valor por defecto: en cuanto el usuario elige un
 * idioma en Ajustes, `useLocaleStore` lo persiste y prevalece.
 */
export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const candidates = [...(navigator.languages ?? []), navigator.language];
  for (const tag of candidates) {
    if (!tag) continue;
    const lang = tag.toLowerCase();
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('es')) return 'es';
  }
  return 'en';
}

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: detectLocale(),
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'just-poker-language' }
  )
);

export type TranslateParams = Record<string, string | number>;

const lookup = (locale: Locale, key: string): string | undefined => {
  const value = key
    .split('.')
    .reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined), messages[locale]);
  return typeof value === 'string' ? value : undefined;
};

/** Traduce una clave con notación de punto, interpolando `{param}`. */
export function translate(locale: Locale, key: string, params?: TranslateParams): string {
  const raw = lookup(locale, key) ?? lookup('es', key) ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
    params[name] !== undefined ? String(params[name]) : match
  );
}

export interface I18n {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TranslateParams) => string;
}

/** Hook principal: expone el idioma activo y el traductor `t`. */
export function useI18n(): I18n {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const t = useCallback(
    (key: string, params?: TranslateParams) => translate(locale, key, params),
    [locale]
  );
  return { locale, setLocale, t };
}

/** Traductor fuera de componentes (usa el idioma activo del store). */
export function t(key: string, params?: TranslateParams): string {
  return translate(useLocaleStore.getState().locale, key, params);
}
