import type React from "react";

import {
  type DataTag,
  type QueryFilters,
  useQueryClient,
} from "@tanstack/react-query";
import type { TRPCQueryKey } from "@trpc/tanstack-react-query";
import { useEventCallback } from "usehooks-ts";

import { updateSetStateAction } from "~/utils/react";

export const useUpdateCache = <Output>(
  queryFilters: QueryFilters<DataTag<TRPCQueryKey, Output, unknown>>,
) => {
  const queryClient = useQueryClient();
  return useEventCallback((setStateAction: React.SetStateAction<Output>) => {
    let savedPrevValue: Output | undefined;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    queryClient.setQueryData<Output>(queryFilters.queryKey!, (prevOutput) => {
      if (prevOutput === undefined) {
        return;
      }
      savedPrevValue = prevOutput;
      return updateSetStateAction(prevOutput, setStateAction);
    });
    return savedPrevValue;
  });
};

export const useInvalidateCache = <Output>(
  queryFilters: QueryFilters<DataTag<TRPCQueryKey, Output, unknown>>,
) => {
  const queryClient = useQueryClient();
  return useEventCallback(() => queryClient.invalidateQueries(queryFilters));
};
