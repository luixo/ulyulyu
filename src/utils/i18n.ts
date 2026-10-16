import { createIsomorphicFn } from "@tanstack/react-start";
import { parse } from "cookie";
import type { BackendModule, InitOptions, ResourceKey } from "i18next";
import { keys } from "remeda";
import { DAY } from "~/utils/time";
import type { AssertAllEqual } from "~/utils/types";
/* oxlint-disable import/no-relative-parent-imports */
import type defaultEn from "../../public/locales/en/default.json";
import type defaultRu from "../../public/locales/ru/default.json";
/* oxlint-enable import/no-relative-parent-imports */

// To add a language add code in the list, namespace jsons, import at (*) and verification at (**)
export type Language = "en" | "ru";
const baseLanguage = "en";
export const languages: Record<Language, true> = {
	en: true,
	ru: true,
};

// To add a namespace add name in the list, namespace json, import at (*) and verification at (**)
type Namespace = "default";
const defaultNamespace: Namespace = "default";

type Resources = {
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

const readIsomorphic = createIsomorphicFn()
	.server(async (language: Language, namespace: Namespace) => {
		/* oxlint-disable import/no-nodejs-modules */
		const fs = await import("node:fs/promises");
		const url = await import("node:url");
		/* oxlint-enable import/no-nodejs-modules */
		const jsonUrl = new url.URL(
			`../../public/locales/${language}/${namespace}.json`,
			import.meta.url,
		);

		const fileContent = await fs.readFile(url.fileURLToPath(jsonUrl));
		const resource = JSON.parse(fileContent.toString("utf8")) as ResourceKey;
		return resource;
	})
	.client(async (language: Language, namespace: Namespace) => {
		const response = await fetch(`/locales/${language}/${namespace}.json`);
		return response.json() as Promise<ResourceKey>;
	});

export const getBackendModule = (): BackendModule => ({
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	init: () => {},
	// This is a bug in i18n
	// oxlint-disable-next-line typescript/strict-void-return typescript/no-misused-promises
	read: async (language, namespace) => {
		try {
			return await readIsomorphic(language as Language, namespace as Namespace);
		} catch (error) {
			// oxlint-disable-next-line no-console
			console.error(`Failed to load ${language}/${namespace} i18n translation`);
			throw error;
		}
	},
	type: "backend",
});

export const i18nInitOptions: InitOptions = {
	defaultNS: defaultNamespace,
	fallbackLng: baseLanguage,
	interpolation: {
		// React doesn't need to escape values
		escapeValue: false,
	},
	ns: [defaultNamespace],
	partialBundledLanguages: true,
	postProcess: "capitalize",
	supportedLngs: keys(languages),
};

const COOKIE_LANGUAGE_NAME = "ULYULYU_LANGUAGE";

export const setCookieLanguage = async (language: Language) => {
	// see https://developer.chrome.com/blog/cookie-max-age-expires?hl=ru
	await cookieStore.set({
		expires: Date.now() + DAY * 400,
		name: COOKIE_LANGUAGE_NAME,
		path: "/",
		sameSite: "lax",
		value: language,
	});
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
					const [baseTag = ""] = tag.split("-");
					return {
						baseTag: baseTag.toLowerCase(),
						fullTag: tag.toLowerCase(),
						q: Number(q),
					};
				})
				.toSorted((a, b) => b.q - a.q)
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
