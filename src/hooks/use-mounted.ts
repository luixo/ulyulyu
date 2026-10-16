import React from "react";

const subscribe = () => () => {
	// There is no external subscription; React compares server and client snapshots.
};

export const useMounted = () =>
	React.useSyncExternalStore(
		subscribe,
		() => true,
		() => false,
	);
