import React from "react";

import type { UserId } from "~/server/validation";
import type { RouterOutput } from "~/utils/query";

export const UserContext = React.createContext<RouterOutput["users"]["upsert"]>(
  {
    id: "unknown" as UserId,
    name: "unknown",
  },
);
