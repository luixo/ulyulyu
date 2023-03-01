import React from "react";

import { DecorateProcedure } from "@trpc/react-query/dist/shared/proxy/utilsProxy";
import {
	AnyQueryProcedure,
	inferProcedureInput,
	inferProcedureOutput,
} from "@trpc/server";
import { Patch, applyPatches, produceWithPatches } from "immer";

import { useGame } from "@/hooks/use-game";
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "@/server/router";

type TrpcUtils = ReturnType<(typeof trpc)["useUtils"]>;

type Update<T> = (prev: T) => T;
type UpdateProcedure<
	T extends AnyQueryProcedure,
	V extends inferProcedureOutput<T> = inferProcedureOutput<T>,
> = (prevOutput: V) => void;

const useUpdateCache = <P extends AnyQueryProcedure>(
	getFn: (utils: TrpcUtils) => DecorateProcedure<P>,
	input: inferProcedureInput<P>,
) => {
	const trpcUtils = trpc.useUtils();
	const updateCache = React.useCallback(
		(updater: Update<inferProcedureOutput<P>>) =>
			getFn(trpcUtils).setData(input, (prevOutput) =>
				prevOutput === undefined ? undefined : updater(prevOutput),
			),
		[trpcUtils, input, getFn],
	);
	const updateData = React.useCallback(
		(updater: UpdateProcedure<P>) => {
			let reversePatches: Patch[] = [];
			updateCache((prevOutput) => {
				const patchesTuple = produceWithPatches<inferProcedureOutput<P>>(
					prevOutput,
					updater,
				);
				// eslint-disable-next-line prefer-destructuring
				reversePatches = patchesTuple[2];
				return patchesTuple[0];
			});
			return reversePatches;
		},
		[updateCache],
	);
	const revertData = React.useCallback(
		(patches: Patch[]) =>
			updateCache((prevOutput) => applyPatches(prevOutput, patches)),
		[updateCache],
	);
	return [updateData, revertData] as const;
};

export const useUpdateGamesCache = () =>
	useUpdateCache((utils) => utils.games.getAll, undefined);

export const useUpdateGameCache = () => {
	const { id } = useGame();
	const [updateCache, revertCache] = useUpdateCache(
		React.useCallback((utils) => utils.games.get, []),
		React.useMemo(() => ({ id }), [id]),
	);
	const updateSureCache = React.useCallback(
		(
			updateProcedure: UpdateProcedure<
				AppRouter["games"]["get"],
				NonNullable<inferProcedureOutput<AppRouter["games"]["get"]>>
			>,
		) =>
			updateCache((prevOutput) =>
				prevOutput === null ? undefined : updateProcedure(prevOutput),
			),
		[updateCache],
	);
	return [updateSureCache, revertCache] as const;
};

export const useUpdateAdminGuessingCache = () => {
	const { id: gameId } = useGame();
	return useUpdateCache(
		(utils) => utils.definitions.getAdminGuessing,
		React.useMemo(() => ({ gameId }), [gameId]),
	);
};

export const useUpdatePlayerGuessingCache = () => {
	const { id: gameId } = useGame();
	return useUpdateCache(
		(utils) => utils.definitions.getPlayerGuessing,
		React.useMemo(() => ({ gameId }), [gameId]),
	);
};

export const useUpdateAdminDefinitionsCache = () => {
	const { id: gameId } = useGame();
	return useUpdateCache(
		(utils) => utils.definitions.getAdmin,
		React.useMemo(() => ({ gameId }), [gameId]),
	);
};
export const useUpdatePlayerDefinitionsCache = () => {
	const { id: gameId } = useGame();
	return useUpdateCache(
		(utils) => utils.definitions.getPlayer,
		React.useMemo(() => ({ gameId }), [gameId]),
	);
};
