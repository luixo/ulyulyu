import React from "react";

import { useCookie as useCookieRaw } from "react-use";

type Subscriber<T extends string> = (
	nextValue: T | undefined,
	options?: Cookies.CookieAttributes,
) => void;

const store: Partial<{
	[T in string]: Subscriber<T>[];
}> = {};

export const useCookie = <T extends string>(
	cookieName: string,
	serverValue: T | null = null,
) => {
	const [value, setValue, deleteValue] = useCookieRaw(cookieName);
	React.useEffect(() => {
		const subscriber: Subscriber<T> = (nextValue, options) => {
			if (nextValue === undefined) {
				deleteValue();
			} else {
				setValue(nextValue, options);
			}
		};
		// @ts-expect-error
		store[cookieName] = [...(store[cookieName] || []), subscriber];
		return () => {
			store[cookieName] = (store[cookieName] || []).filter(
				(lookup) => lookup !== subscriber,
			);
		};
	}, [cookieName, setValue, deleteValue]);
	return [
		(value ?? serverValue) as T | null,
		React.useCallback(
			(nextValue: T, options?: Parameters<typeof setValue>[1]) => {
				setValue(nextValue, options);
				store[cookieName]!.forEach((subscriber) => subscriber(nextValue));
			},
			[setValue, cookieName],
		),
		React.useCallback(() => {
			deleteValue();
			store[cookieName]!.forEach((subscriber) => subscriber(undefined));
		}, [deleteValue, cookieName]),
	] as const;
};
