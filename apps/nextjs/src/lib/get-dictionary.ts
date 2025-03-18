import "server-only";
import type { Dictionary } from "~/types";
import type { Locale } from "~/config/i18n-config";

// Define a type for the dictionary import function
type DictionaryFunction = () => Promise<Dictionary>;

// We enumerate all dictionaries here for better linting and typescript support
const dictionaries: Record<Locale, DictionaryFunction> = {
  es: () =>
    import("~/config/dictionaries/es.json").then((module) => {
      const dict = module.default as unknown;
      return dict as Dictionary;
    }),
  en: () =>
    import("~/config/dictionaries/en.json").then((module) => {
      const dict = module.default as unknown;
      return dict as Dictionary;
    }),
  zh: () =>
    import("~/config/dictionaries/zh.json").then((module) => {
      const dict = module.default as unknown;
      return dict as Dictionary;
    }),
  ko: () =>
    import("~/config/dictionaries/ko.json").then((module) => {
      const dict = module.default as unknown;
      return dict as Dictionary;
    }),
  ja: () =>
    import("~/config/dictionaries/ja.json").then((module) => {
      const dict = module.default as unknown;
      return dict as Dictionary;
    }),
};

export const getDictionary = async (locale: Locale): Promise<Dictionary> =>
  dictionaries[locale]?.() ?? dictionaries.es();

export const getDictionarySync = (locale: Locale): Promise<Dictionary> =>
  dictionaries[locale]?.() ?? dictionaries.es();