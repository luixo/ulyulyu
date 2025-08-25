import type React from "react";

import { useRouter } from "@tanstack/react-router";
import { VscWordWrap as LogoIcon } from "react-icons/vsc";

import { ClickableIcon } from "~/components/base/clickable-icon";
import { AccountSettings } from "~/components/settings/account-settings";
import { ModeSwitch } from "~/components/settings/mode-switch";
import { Settings } from "~/components/settings/settings";

export const Header: React.FC<{
  title?: React.ReactNode;
}> = ({ title }) => {
  const router = useRouter();
  return (
    <div className="flex items-start justify-between gap-4">
      <ClickableIcon
        className="bg-gradient-to-tr from-blue-500 to-pink-500 text-8xl font-extrabold"
        Component={LogoIcon}
        size={56}
        onClick={() => router.navigate({ to: "/" })}
      />
      {title}
      <div className="flex flex-row items-center gap-4 p-4">
        <ModeSwitch />
        <AccountSettings />
        <Settings />
      </div>
    </div>
  );
};
