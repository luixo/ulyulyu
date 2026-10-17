import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookies as getRawCookies } from "@tanstack/react-start/server";
import { pullObject } from "remeda";

export const getCookies = createIsomorphicFn()
	// oxlint-disable-next-line unicorn/no-useless-promise-resolve-reject
	.server(async () => Promise.resolve(getRawCookies()))
	.client(async () => {
		const cookies = await cookieStore.getAll();
		return pullObject(
			cookies,
			// oxlint-disable-next-line typescript/no-non-null-assertion
			({ name }) => name!,
			({ value }) => value,
		);
	});
