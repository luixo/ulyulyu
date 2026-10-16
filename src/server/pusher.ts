import Pusher from "pusher";

let pusherInstance: Pusher | undefined = undefined;
export const getPusherInstance = (): Pusher => {
	const {
		VITE_PUSHER_APP_KEY = "",
		VITE_PUSHER_HOST = "",
		PUSHER_SECRET = "",
		PUSHER_APP_ID = "",
	} = process.env;
	if (!VITE_PUSHER_APP_KEY) {
		throw new Error(
			"Expected to have 'VITE_PUSHER_APP_KEY' environment variable",
		);
	}
	if (!VITE_PUSHER_HOST) {
		throw new Error("Expected to have 'VITE_PUSHER_HOST' environment variable");
	}
	if (!PUSHER_SECRET) {
		throw new Error("Expected to have 'PUSHER_APP_ID' environment variable");
	}
	if (!PUSHER_APP_ID) {
		throw new Error("Expected to have 'PUSHER_SECRET' environment variable");
	}
	pusherInstance ??= new Pusher({
		appId: PUSHER_APP_ID,
		host: VITE_PUSHER_HOST,
		key: VITE_PUSHER_APP_KEY,
		secret: PUSHER_SECRET,
		useTLS: true,
	});
	return pusherInstance;
};
