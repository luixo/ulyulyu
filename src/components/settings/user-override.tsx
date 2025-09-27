import React, { useState } from "react";

import { Button, Input } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { UserContext, setUserLanguage } from "~/contexts/user-id-context";
import type { UserId } from "~/server/validation";

const uuidLength = crypto.randomUUID().length;

export const UserOverride = () => {
  const { t } = useTranslation();
  const [user, setUser] = React.use(UserContext);
  const queryClient = useQueryClient();
  const [localUserId, setLocalUserId] = useState<UserId>(user.id);
  return (
    <div className="flex w-90 flex-col gap-2">
      <Input
        value={localUserId}
        label={t("accountSettings.override.label")}
        aria-label={t("accountSettings.override.label")}
        labelPlacement="outside"
        onValueChange={(nextValue) => {
          setLocalUserId(nextValue as UserId);
        }}
        minLength={uuidLength}
        maxLength={uuidLength}
      />
      <Button
        className="z-10"
        variant="bordered"
        onPress={() => {
          setUser((prevUser) => ({ ...prevUser, id: localUserId }));
          setUserLanguage(localUserId);
          queryClient.clear();
        }}
      >
        {t("accountSettings.override.button")}
      </Button>
    </div>
  );
};
