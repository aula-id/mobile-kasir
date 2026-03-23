import { en, id, jv, su, ban } from './locales';
import type { Translations } from './locales';

export type Language = 'en' | 'id' | 'jv' | 'su' | 'ban';

const translations: Record<Language, Translations> = {
  en,
  id,
  jv,
  su,
  ban,
};

export function getTranslations(lang: Language): Translations {
  return translations[lang] || translations.id;
}

export function t(lang: Language, key: string, params?: Record<string, string | number>): string {
  const trans = getTranslations(lang);
  const keys = key.split('.');
  let value: unknown = trans;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key; // Return key if not found
    }
  }

  let result = typeof value === 'string' ? value : key;

  // Handle interpolation if params provided
  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
    });
  }

  return result;
}
