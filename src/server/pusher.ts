import Pusher from "pusher";

let pusherInstance: Pusher | undefined;
export const getPusherInstance = (): Pusher => {
  if (!process.env.VITE_PUSHER_APP_KEY) {
    throw new Error(
      "Expected to have 'VITE_PUSHER_APP_KEY' environment variable",
    );
  }
  if (!process.env.VITE_PUSHER_CLUSTER) {
    throw new Error(
      "Expected to have 'VITE_PUSHER_CLUSTER' environment variable",
    );
  }
  if (!process.env.PUSHER_SECRET) {
    throw new Error("Expected to have 'PUSHER_APP_ID' environment variable");
  }
  if (!process.env.PUSHER_APP_ID) {
    throw new Error("Expected to have 'PUSHER_SECRET' environment variable");
  }
  pusherInstance ??= new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.VITE_PUSHER_APP_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.VITE_PUSHER_CLUSTER,
  });
  return pusherInstance;
};
