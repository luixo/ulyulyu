import { useRouter } from "next/router";

import { useUpdateGamesCache } from "@/hooks/use-update-cache";
import { trpc } from "@/lib/trpc";

export const useCreateGame = () => {
	const router = useRouter();
	const [updateGamesCache] = useUpdateGamesCache();
	return trpc.games.put.useMutation({
		onSuccess: (game) => {
			updateGamesCache((games) => {
				games.push({
					...game,
					createTimestamp: new Date(game.createTimestamp),
					state: { phase: "start" },
				});
			});
			router.push(`/game/${game.id}`);
		},
	});
};
