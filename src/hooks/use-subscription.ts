import React from "react";

import { useGame } from "~/hooks/use-game";
import type { SubscriptionMapping } from "~/types/subscription";
import { getChannelName, useBindSubscription } from "~/utils/pusher";

const subscribed: Record<string, boolean> = {};

export const useSubscription = <K extends keyof SubscriptionMapping>(
  event: K,
  onData: (data: SubscriptionMapping[K]) => void,
) => {
  const { id: gameId } = useGame();
  const subscribe = useBindSubscription(getChannelName(gameId));
  React.useEffect(() => {
    if (subscribed[event]) {
      console.warn(`There is a double subscription to an event "${event}"`);
    }
    subscribed[event] = true;
    const unsubscribe = subscribe(event, onData);
    return () => {
      subscribed[event] = false;
      unsubscribe();
    };
  }, [subscribe, event, onData]);
};
