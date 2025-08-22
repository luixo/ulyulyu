import { parse } from "cookie";
import type { BackendModule, InitOptions, ResourceKey } from "i18next";
import { keys } from "remeda";

import { DAY } from "~/utils/time";
import type { AssertAllEqual } from "~/utils/types";

import type defaultEn from "../../public/locales/en/default.json";
import type defaultRu from "../../public/locales/ru/default.json";

// To add a language add code in the list, namespace jsons, import at (*) and verification at (**)
export type Language = "en" | "ru";
export const baseLanguage = "en";
export const languages: Record<Language, true> = {
  en: true,
  ru: true,
};

// To add a namespace add name in the list, namespace json, import at (*) and verification at (**)
export type Namespace = "default";
export const defaultNamespace: Namespace = "default";
export const namespaces: Record<Namespace, true> = {
  default: true,
};

export type Resources = {
  default: typeof defaultEn;
};

type ValidatedResources = AssertAllEqual<
  [
    Resources,
    {
      default: typeof defaultRu;
    },
  ]
>;

declare module "i18next" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface CustomTypeOptions {
    defaultNS: "default";
    resources: ValidatedResources extends never ? never : Resources;
  }
}

export const getBackendModule = (): BackendModule => ({
  type: "backend",
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  init: () => {},
  read: async (language, namespace) => {
    try {
      if (import.meta.env.SSR) {
        const fs = await import("node:fs/promises");
        const url = await import("node:url");
        const jsonUrl = new url.URL(
          `../../public/locales/${language}/${namespace}.json`,
          import.meta.url,
        );

        const fileContent = await fs.readFile(url.fileURLToPath(jsonUrl));
        const resource = JSON.parse(fileContent.toString("utf8"));
        return resource as ResourceKey;
      }
      const response = await fetch(`/locales/${language}/${namespace}.json`);
      return await (response.json() as Promise<ResourceKey>);
    } catch (e) {
      console.error(`Failed to load ${language}/${namespace} i18n translation`);
      throw e;
    }
  },
});

export const i18nInitOptions: InitOptions = {
  fallbackLng: baseLanguage,
  defaultNS: defaultNamespace,
  ns: [defaultNamespace],
  supportedLngs: keys(languages),
  interpolation: {
    // React doesn't need to escape values
    escapeValue: false,
  },
  postProcess: "capitalize",
  partialBundledLanguages: true,
};

export const COOKIE_LANGUAGE_NAME = "ULYULYU_LANGUAGE";

export const setCookieLanguage = (language: Language) => {
  // see https://developer.chrome.com/blog/cookie-max-age-expires?hl=ru
  document.cookie = `${COOKIE_LANGUAGE_NAME}=${language};path=/;max-age=${(DAY * 400) / 1000};samesite=lax`;
};

const isLanguage = (input: string): input is Language =>
  keys(languages).includes(input as Language);

const getCookie = (request: Request | null) =>
  request ? (request.headers.get("cookie") ?? "") : document.cookie;

const getHeaderLanguages = (request: Request | null) =>
  request
    ? (request.headers.get("accept-language") ?? "")
        .split(",")
        .map((lang) => {
          const [tag = "", q = "1"] = lang.trim().split(";q=");
          return {
            fullTag: tag.toLowerCase(),
            baseTag: tag.split("-")[0]?.toLowerCase() || "",
            q: Number(q),
          };
        })
        .sort((a, b) => b.q - a.q)
        .flatMap(({ fullTag, baseTag }) => [fullTag, baseTag])
    : window.navigator.languages;

type Strategy = "cookie" | "header" | "baseLocale";
const strategies: Strategy[] = ["cookie", "header", "baseLocale"];
export const getLanguageFromRequest = (request: Request | null) => {
  for (const strategy of strategies) {
    switch (strategy) {
      case "cookie": {
        const cookies = parse(getCookie(request));
        const cookieLanguage = cookies[COOKIE_LANGUAGE_NAME] ?? "";
        if (isLanguage(cookieLanguage)) {
          return cookieLanguage;
        }
        break;
      }
      case "header": {
        const headerLanguages = getHeaderLanguages(request);
        for (const headerLanguage of headerLanguages) {
          if (isLanguage(headerLanguage)) {
            return headerLanguage;
          }
        }
        break;
      }
      case "baseLocale": {
        return baseLanguage;
      }
    }
  }
  return baseLanguage;
};
