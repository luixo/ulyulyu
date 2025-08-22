import React from "react";

import { IoEyeOff as CrossedEyeIcon, IoEye as EyeIcon } from "react-icons/io5";

import { ClickableIcon } from "~/components/base/clickable-icon";

export const HideControl = React.memo<{
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
}>(({ show, setShow }) => {
  const switchShowDefinition = React.useCallback(
    () => setShow((value) => !value),
    [setShow],
  );
  return (
    <ClickableIcon
      Component={show ? EyeIcon : CrossedEyeIcon}
      onClick={switchShowDefinition}
      size={20}
    />
  );
});
