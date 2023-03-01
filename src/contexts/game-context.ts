import React from "react";

import { RouterOutput } from "@/lib/trpc";

export type MaybeGame = RouterOutput["games"]["get"];

export const gameContext = React.createContext<MaybeGame>(null);
