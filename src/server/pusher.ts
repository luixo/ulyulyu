import Pusher from "pusher";

import { GamesId } from "@/db/models";
import { getGameChannelName } from "@/lib/pusher";
import { AuthContext } from "@/server/procedures";
import { PusherMapping } from "@/types/pusher";

let pusherInstance: Pusher | undefined;

type TypedPusher = {
	trigger: <K extends keyof PusherMapping>(
		event: K,
		data: PusherMapping[K],
	) => void;
};

export const getPusher = (
	context: AuthContext,
	gameId: GamesId,
): TypedPusher => {
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
	if (!process.env.PUSHER_SECRET) {
		throw new Error("Expected to have 'PUSHER_APP_ID' environment variable");
	}
	if (!process.env.PUSHER_APP_ID) {
		throw new Error("Expected to have 'PUSHER_SECRET' environment variable");
	}
	if (!pusherInstance) {
		pusherInstance = new Pusher({
			appId: process.env.PUSHER_APP_ID,
			key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
			secret: process.env.PUSHER_SECRET,
			cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
		});
	}
	return {
		trigger: (event, data) =>
			pusherInstance!.trigger(getGameChannelName(gameId), event, {
				...data,
				timestamp: Date.now(),
				senderSessionId: context.auth.sessionId,
			}),
	};
};
