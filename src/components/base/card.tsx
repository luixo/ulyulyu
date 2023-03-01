import React from "react";

import { Card as RawCard } from "@nextui-org/react";

export const Card = React.memo<React.ComponentProps<typeof RawCard>>(
	({ css, ...props }) => (
		<RawCard
			css={React.useMemo(() => ({ padding: 12, ...css }), [css])}
			{...props}
		/>
	),
);
