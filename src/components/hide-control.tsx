import type React from "react";

import { IoEyeOff as CrossedEyeIcon, IoEye as EyeIcon } from "react-icons/io5";

import { ClickableIcon } from "~/components/base/clickable-icon";

export const HideControl: React.FC<{
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ show, setShow }) => (
  <ClickableIcon
    Component={show ? EyeIcon : CrossedEyeIcon}
    onClick={() => setShow((value) => !value)}
    size={20}
  />
);
