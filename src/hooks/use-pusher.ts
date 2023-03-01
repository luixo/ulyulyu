import React from "react";

import Pusher from "pusher-js";

import { userContext } from "@/contexts/user-id-context";
import { useGame } from "@/hooks/use-game";
import { useLogger } from "@/hooks/use-logger";
import { getGameChannelName } from "@/lib/pusher";
import { PusherMapping } from "@/types/pusher";

let pusherInstance: Pusher | undefined;

const timestamps: Partial<Record<keyof PusherMapping, number>> = {};

const subscribed: Record<string, boolean> = {};

export const usePusher = <K extends keyof PusherMapping>(
	event: K,
	onDataRaw: (data: PusherMapping[K]) => void,
) => {
	const { id } = useGame();
	const { sessionId } = React.useContext(userContext)!;
	const subscribe = React.useCallback(() => {
		if (!pusherInstance) {
			if (!process.env.NEXT_PUBLIC_PUSHER_APP_KEY) {
				throw new Error(
					"Expected to have 'NEXT_PUBLIC_PUSHER_APP_KEY' environment variable",
				);
			}
			if (!process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
				throw new Error(
					"Expected to have 'NEXT_PUBLIC_PUSHER_CLUSTER' environment variable",
				);
			}
			pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
				cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
			});
		}
		const channel = pusherInstance.subscribe(getGameChannelName(id));
		const onData = ({
			timestamp,
			senderSessionId,
			...data
		}: PusherMapping[K] & { timestamp: number; senderSessionId: string }) => {
			const lastTimestamp = timestamps[event];
			if (lastTimestamp && lastTimestamp > timestamp) {
				return;
			}
			if (senderSessionId === sessionId) {
				return;
			}
			timestamps[event] = timestamp;
			onDataRaw(data as unknown as PusherMapping[K]);
		};
		channel.bind(event, onData);
		return () => {
			channel.unbind(event, onData);
		};
	}, [id, event, onDataRaw, sessionId]);
	const logger = useLogger();
	React.useEffect(() => {
		if (subscribed[event]) {
			// eslint-disable-next-line no-console
			console.warn(`There is a double subscription to an event "${event}"`);
		}
		subscribed[event] = true;
		logger(`Subscribed to "${event}"`);
		const unsubscribe = subscribe();
		return () => {
			logger(`Unsubscribed from "${event}"`);
			subscribed[event] = false;
			unsubscribe();
		};
	}, [subscribe, event, logger]);
};
