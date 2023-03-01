import React from "react";

import { Button, Spacer, Text } from "@nextui-org/react";
import setLanguage from "next-translate/setLanguage";
import useTranslation from "next-translate/useTranslation";

import { Flex } from "@/components/base/flex";

import i18n from "@/../i18n.json";

const LOCALE_NAMES: Partial<Record<string, string>> = {
	ru: "Русский",
	en: "English",
};

const Language = React.memo<{ locale: string }>(({ locale }) => {
	const { lang } = useTranslation();
	const changeLanguage = React.useCallback(() => setLanguage(locale), [locale]);
	return (
		<Button onClick={changeLanguage} disabled={locale === lang}>
			{LOCALE_NAMES[locale] ?? "unknown"}
		</Button>
	);
});

export const LangSwitcher = React.memo(() => {
	const { t } = useTranslation();
	return (
		<Flex crossAxis="center" mainAxis="end" direction="column">
			<Text h3>{t("settings.langSwitcher.title")}</Text>
			{i18n.locales.map((locale) => (
				<React.Fragment key={locale}>
					<Spacer y={0.5} />
					<Language locale={locale} />
				</React.Fragment>
			))}
		</Flex>
	);
});
