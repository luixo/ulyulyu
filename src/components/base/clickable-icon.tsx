import React from "react";

import type { IconBaseProps } from "react-icons";

import { ContentWrapper } from "@/components/base/content-wrapper";

type Props = Omit<IconBaseProps, "onClick"> & {
	Component: React.ComponentType<IconBaseProps>;
	disabled?: boolean;
} & Pick<React.HTMLAttributes<HTMLDivElement>, "onClick">;

export const ClickableIcon = React.memo<Props>(
	({ Component, onClick, disabled, ...props }) => (
		<ContentWrapper
			onClick={disabled ? undefined : onClick}
			disabled={disabled}
		>
			<Component {...props} />
		</ContentWrapper>
	),
);
