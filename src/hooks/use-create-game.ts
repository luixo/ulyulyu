import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { useUpdateCache } from "~/hooks/use-update-cache";
import { useTRPC } from "~/utils/trpc";

export const useCreateGame = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const updateGamesCache = useUpdateCache(trpc.games.getAll.queryFilter());
  return useMutation(
    trpc.games.put.mutationOptions({
      onSuccess: (game) => {
        updateGamesCache((games) => [
          ...games,
          {
            ...game,
            createdAt: new Date(game.createdAt),
            state: "start",
          },
        ]);
        router.navigate({ to: "/games/$id", params: { id: game.id } });
      },
    }),
  );
};
