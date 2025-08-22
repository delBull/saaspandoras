export const i18n = {
  defaultLocale: "es",
  locales: ["es", "en", "zh", "ko", "ja"],
} as const;

export type Locale = (typeof i18n)["locales"][number];

export const localeMap = {
  es: "Español",
  en: "English",
  zh: "中文",
  ko: "한국어",
  ja: "日本語",
} as const;
