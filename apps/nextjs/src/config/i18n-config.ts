export const i18n = {
  defaultLocale: "es",
  locales: ["es", "en", "zh", "ko", "ja"],
} as const;

export type Locale = (typeof i18n)["locales"][number];

// 新增的映射对象
export const localeMap = {
  es: "Español",
  en: "English",
  zh: "中文",
  ko: "한국어",
  ja: "日本語",
} as const;
