import React from "react";

import type { RouterOutput } from "~/utils/query";

export type GameContextType = RouterOutput["games"]["get"];

export const GameContext = React.createContext<GameContextType>(null);
