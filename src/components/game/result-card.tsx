import type React from "react";

import { Card, CardBody, CardFooter, CardHeader } from "@heroui/react";
import { useTranslation } from "react-i18next";

export const ResultCard: React.FC<
  Omit<React.ComponentProps<typeof Card>, "title"> & {
    title: React.ReactNode;
    points?: number;
    footer?: React.ReactNode;
  }
> = ({ title, points, footer, children, ...props }) => {
  const { t } = useTranslation();
  return (
    <Card {...props}>
      <CardHeader className="flex justify-between gap-2">
        {typeof title === "string" ? (
          <span className="text-lg font-bold">{title}</span>
        ) : (
          title
        )}
        {points === undefined ? null : (
          <span>{t("points", { count: points })}</span>
        )}
      </CardHeader>
      <CardBody>{children}</CardBody>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
};
