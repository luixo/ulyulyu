import React from "react";

import { InferQueryResult } from "@trpc/react-query/dist/utils/inferReactQueryProcedure";

import { UsersId } from "@/db/models";
import type { AppRouter } from "@/server/router";

export type UserContext = {
	id: UsersId | undefined;
	name: string | null;
	sessionId: string;
	query: InferQueryResult<AppRouter["users"]["upsert"]>;
};

export const userContext = React.createContext<UserContext | undefined>(
	undefined,
);
