import React from "react";

import { Teams } from "~/components/game/start/teams";
import { Words } from "~/components/game/start/words";

export const StartPhase = React.memo(() => (
  <div className="flex flex-col gap-4">
    <Teams />
    <Words />
  </div>
));
