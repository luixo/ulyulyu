import React from "react";

import { useSessionStorage } from "react-use";

import { UserContext } from "@/contexts/user-id-context";
import { useCookie } from "@/hooks/use-cookie";
import { USER_ID_COOKIE, SESSION_ID_KEY } from "@/lib/cookie";
import { trpc } from "@/lib/trpc";

let run = false;

export const useUser = (serverUserId: string | undefined): UserContext => {
	const [userId, setUserId] = useCookie(USER_ID_COOKIE, serverUserId);
	const upsertUserQuery = trpc.users.upsert.useQuery(
		{ id: userId || "unknown" },
		{ enabled: Boolean(userId) },
	);
	const createUserIdMutation = trpc.users.put.useMutation({
		onSuccess: ({ userId: newUserId }) =>
			setUserId(newUserId, { expires: 365 }),
	});
	const [sessionId] = useSessionStorage(
		SESSION_ID_KEY,
		`session-${Math.random()}`,
	);
	React.useEffect(() => {
		if (userId) {
			return;
		}
		if (createUserIdMutation.status === "idle" && !run) {
			run = true;
			createUserIdMutation.mutate();
		}
	}, [userId, setUserId, createUserIdMutation]);
	return React.useMemo(
		() => ({
			id: userId ?? undefined,
			sessionId,
			name: upsertUserQuery.data?.name ?? null,
			query: upsertUserQuery,
		}),
		[sessionId, upsertUserQuery, userId],
	);
};
