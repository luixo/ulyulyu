import React from "react";

import { useRouter } from "@tanstack/react-router";
import { VscWordWrap as LogoIcon } from "react-icons/vsc";

import { ClickableIcon } from "~/components/base/clickable-icon";
import { AccountSettings } from "~/components/settings/account-settings";
import { ModeSwitch } from "~/components/settings/mode-switch";
import { Settings } from "~/components/settings/settings";

type Props = {
  title?: React.ReactNode;
};

export const Header = React.memo<Props>(({ title }) => {
  const router = useRouter();
  const toIndex = React.useCallback(
    () => router.navigate({ to: "/" }),
    [router],
  );
  return (
    <div className="flex items-start justify-between gap-4">
      <ClickableIcon
        className="bg-gradient-to-tr from-blue-500 to-pink-500 text-8xl font-extrabold"
        Component={LogoIcon}
        size={56}
        onClick={toIndex}
      />
      {title}
      <div className="flex flex-row items-center gap-4 p-4">
        <ModeSwitch />
        <AccountSettings />
        <Settings />
      </div>
    </div>
  );
});
