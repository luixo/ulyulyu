import React, { type SetStateAction } from "react";

import {
  type DataTag,
  type QueryFilters,
  useQueryClient,
} from "@tanstack/react-query";
import type { TRPCQueryKey } from "@trpc/tanstack-react-query";

import { useGame } from "~/hooks/use-game";
import type { RouterOutput } from "~/utils/query";
import { updateSetStateAction } from "~/utils/react";
import { useTRPC } from "~/utils/trpc";

const useUpdateCache = <Output>(
  queryFilters: QueryFilters<DataTag<TRPCQueryKey, Output, unknown>>,
) => {
  const queryClient = useQueryClient();
  const updateCache = React.useCallback(
    (setStateAction: React.SetStateAction<Output>) =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      queryClient.setQueryData<Output>(queryFilters.queryKey!, (prevOutput) =>
        prevOutput === undefined
          ? undefined
          : updateSetStateAction(prevOutput, setStateAction),
      ),
    [queryClient, queryFilters],
  );
  const updateData = React.useCallback(
    (setStateAction: SetStateAction<Output>) => {
      let savedPrevValue: Output | undefined;
      updateCache((prevOutput) => {
        const nextOutput = updateSetStateAction(prevOutput, setStateAction);
        savedPrevValue = prevOutput;
        return nextOutput;
      });
      return savedPrevValue;
    },
    [updateCache],
  );
  const invalidateData = React.useCallback(
    () => queryClient.invalidateQueries(queryFilters),
    [queryClient, queryFilters],
  );
  return [updateData, invalidateData] as const;
};

export const useUpdateGamesCache = () => {
  const trpc = useTRPC();
  return useUpdateCache(trpc.games.getAll.queryFilter());
};

export const useUpdateGameCache = () => {
  const trpc = useTRPC();
  const { id } = useGame();
  const [updateCache, invalidateCache] = useUpdateCache(
    trpc.games.get.queryFilter({ id }),
  );
  const updateSureCache = React.useCallback(
    (
      setStateAction: SetStateAction<
        Exclude<RouterOutput["games"]["get"], null>
      >,
    ) =>
      updateCache((prevOutput) =>
        prevOutput === null
          ? null
          : updateSetStateAction(prevOutput, setStateAction),
      ),
    [updateCache],
  );
  return [updateSureCache, invalidateCache] as const;
};

export const useUpdateAdminGuessingCache = () => {
  const trpc = useTRPC();
  const { id: gameId } = useGame();
  return useUpdateCache(
    trpc.definitions.getAdminGuessing.queryFilter({ gameId }),
  );
};

export const useUpdatePlayerGuessingCache = () => {
  const trpc = useTRPC();
  const { id: gameId } = useGame();
  return useUpdateCache(
    trpc.definitions.getPlayerGuessing.queryFilter({ gameId }),
  );
};

export const useUpdateAdminDefinitionsCache = () => {
  const trpc = useTRPC();
  const { id: gameId } = useGame();
  return useUpdateCache(trpc.definitions.getAdmin.queryFilter({ gameId }));
};
export const useUpdatePlayerDefinitionsCache = () => {
  const trpc = useTRPC();
  const { id: gameId } = useGame();
  return useUpdateCache(trpc.definitions.getPlayer.queryFilter({ gameId }));
};
