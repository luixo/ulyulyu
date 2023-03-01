import type { Paths, I18n, Translate } from "next-translate";

import { AssertTrue, Equals, Tail } from "@/types/utils";

import type commonEn from "@/../locales/en/common.json";
import type commonRu from "@/../locales/ru/common.json";

type Resources = {
	common: Paths<typeof commonRu>;
};

type ValidatedResources = AssertTrue<
	Equals<Resources, { common: Paths<typeof commonEn> }>,
	Resources
>;

declare module "next-translate/useTranslation" {
	interface TypeSafeTranslate<Namespace extends keyof ValidatedResources>
		extends Omit<I18n, "t"> {
		t: {
			(
				key: ValidatedResources[Namespace],
				...rest: Tail<Parameters<Translate>>
			): string;
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			// <T extends string>(template: TemplateStringsArray): string;
		};
	}

	export default function useTranslation<
		Namespace extends keyof ValidatedResources,
	>(namespace?: Namespace): TypeSafeTranslate<Namespace>;
}
