import React from "react";

import type { IconBaseProps } from "react-icons";
import { twMerge } from "tailwind-merge";

type Props = Omit<IconBaseProps, "onClick"> & {
  Component: React.ComponentType<IconBaseProps>;
  disabled?: boolean;
} & Pick<React.HTMLAttributes<HTMLOrSVGElement>, "onClick">;

export const ClickableIcon = React.memo<Props>(
  ({ Component, onClick, disabled, className, ...props }) => (
    <Component
      {...props}
      className={twMerge(
        "flex h-full cursor-pointer justify-center",
        disabled ? "cursor-default opacity-50" : undefined,
        className,
      )}
      onClick={disabled ? undefined : onClick}
    />
  ),
);
