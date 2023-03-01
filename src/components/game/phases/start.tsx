import React from "react";

import { Spacer } from "@nextui-org/react";

import { Teams } from "@/components/game/start/teams";
import { Words } from "@/components/game/start/words";

export const StartPhase = React.memo(() => (
	<>
		<Teams />
		<Spacer y={1} />
		<Words />
	</>
));
