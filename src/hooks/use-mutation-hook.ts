import React from "react";

import { TRPCClientErrorLike } from "@trpc/client";
import { UseTRPCMutationOptions } from "@trpc/react-query/shared";
import type {
	AnyMutationProcedure,
	inferProcedureInput,
	inferProcedureOutput,
} from "@trpc/server";
import type { inferTransformedProcedureOutput } from "@trpc/server/shared";
import { Patch } from "immer";

type MutationOpts<P extends AnyMutationProcedure, C = unknown> = {
	getKey?: (vars: inferProcedureInput<P>) => string | string[];
	onMutate: (
		vars: inferProcedureInput<P>,
	) => undefined | Patch[] | { context: C; patches: Patch[] };
	onSuccess?: (result: inferProcedureOutput<P>, context: C) => void;
	revert: (patches: Patch[]) => void;
};

const useMutationIndexes = () => {
	const [mutationIndexes, setMutationIndexes] = React.useState<
		Partial<Record<string, number>>
	>({});
	const incrementIndex = React.useCallback((key: string) => {
		let nextIndex = 0;
		setMutationIndexes((indexes) => {
			const index = indexes[key] ?? 0;
			nextIndex = index;
			return { ...indexes, [key]: index + 1 };
		});
		return nextIndex;
	}, []);
	return [mutationIndexes, incrementIndex] as const;
};

export const useMutationHook = <P extends AnyMutationProcedure, C = unknown>(
	optOrOpts: MutationOpts<P, C> | MutationOpts<P, C>[],
): UseTRPCMutationOptions<
	inferProcedureInput<P>,
	TRPCClientErrorLike<P>,
	inferTransformedProcedureOutput<P>,
	{ shouldRevert: () => boolean; patches: Patch[]; context: C }[]
> => {
	const [mutationIndexes, incrementIndex] = useMutationIndexes();
	const opts = Array.isArray(optOrOpts) ? optOrOpts : [optOrOpts];
	return {
		onMutate: (variables) =>
			opts.map((opt) => {
				const patchesOrObject = opt.onMutate(variables);
				const patches =
					patchesOrObject === undefined
						? []
						: Array.isArray(patchesOrObject)
						  ? patchesOrObject
						  : patchesOrObject.patches;
				const context =
					patchesOrObject === undefined || Array.isArray(patchesOrObject)
						? (undefined as C)
						: patchesOrObject.context;
				const key = opt.getKey?.(variables) ?? "__common__";
				const flatKey = [...(Array.isArray(key) ? key : [key])].join("/");
				const mutationIndex = incrementIndex(flatKey);
				return {
					shouldRevert: () =>
						mutationIndex >= (mutationIndexes[flatKey] ?? Infinity),
					patches,
					context,
				};
			}),
		onError: (_error, _variables, contexts) => {
			if (!contexts) {
				return;
			}
			opts.forEach((opt, index) => {
				const context = contexts[index];
				if (
					context.patches === undefined ||
					context.patches.length === 0 ||
					!context.shouldRevert()
				) {
					return;
				}
				opt.revert(context.patches);
			});
		},
		onSuccess: (result, _variables, contexts) => {
			if (!contexts) {
				return;
			}
			opts.forEach((opt, index) => {
				const context = contexts[index];
				if (!opt.onSuccess) {
					return;
				}
				opt.onSuccess(result, context.context);
			});
		},
	};
};
