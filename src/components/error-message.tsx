import type React from "react";

import { Card, CardBody } from "@heroui/react";
import { useTranslation } from "react-i18next";

export const ErrorMessage: React.FC<{
  error: unknown;
}> = ({ error }) => {
  const { t } = useTranslation();
  return (
    <Card className="border-danger">
      <CardBody>
        {t("common.error", {
          error:
            typeof error === "string"
              ? error
              : typeof error === "object" && error instanceof Error
                ? (error as Error).message
                : JSON.stringify(error, null, 4),
        })}
      </CardBody>
    </Card>
  );
};
