import React from "react";

export const nonNullishGuard = <T>(
	arg: T,
): arg is Exclude<T, null | undefined> => arg !== null && arg !== undefined;

export const genericMemo: <T>(component: T) => T = React.memo;
export const omitUndefined = <T extends object>(
	obj: T,
): Exclude<T, undefined> =>
	Object.fromEntries(
		Object.entries(obj).filter(([, value]) => value !== undefined),
	) as Exclude<T, undefined>;
