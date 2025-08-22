import React from "react";

import type { upsertUser } from "~/server/user";
import type { UserId } from "~/server/validation";

export const UserContext = React.createContext<
  Awaited<ReturnType<typeof upsertUser>>
>({
  id: "unknown" as UserId,
  name: "unknown",
});
