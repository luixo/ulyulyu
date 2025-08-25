import type React from "react";

import { Button } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { keys } from "remeda";

import { type Language, languages, setCookieLanguage } from "~/utils/i18n";

const LOCALE_NAMES: Partial<Record<Language, string>> = {
  ru: "Русский",
  en: "English",
};

const Language: React.FC<{ lang: Language }> = ({ lang }) => {
  const { i18n } = useTranslation();
  return (
    <Button
      color="primary"
      onPress={() => {
        i18n.changeLanguage(lang);
        setCookieLanguage(lang);
      }}
    >
      {LOCALE_NAMES[lang] ?? "unknown"}
    </Button>
  );
};

export const LangSwitcher = () => {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <h3 className="text-xl">{t("settings.langSwitcher.title")}</h3>
      <div className="flex flex-col gap-1">
        {keys(languages)
          .filter((lang) => lang !== i18n.language)
          .map((lang) => (
            <Language key={lang} lang={lang} />
          ))}
      </div>
    </div>
  );
};
