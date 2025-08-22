import type { GameId } from "~/db/database.gen";
import type { AuthContext } from "~/server/procedures";
import { getPusherInstance } from "~/server/pusher";
import type { SubscriptionMapping } from "~/types/subscription";
import { getChannelName } from "~/utils/pusher";
import { transformer } from "~/utils/transformer";

type TypedEmitter = {
  trigger: <K extends keyof SubscriptionMapping>(
    event: K,
    data: SubscriptionMapping[K],
  ) => void;
};

export const getEmitter = (
  context: AuthContext,
  gameId: GameId,
): TypedEmitter => {
  const pusherInstance = getPusherInstance();
  return {
    trigger: (event, data) =>
      pusherInstance.trigger(
        getChannelName(gameId),
        event,
        transformer.serialize({
          ...data,
          timestamp: Date.now(),
          sessionId: context.auth.sessionId,
        }),
      ),
  };
};
