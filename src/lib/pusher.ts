import { GamesId } from "@/db/models";

export const getGameChannelName = (gameId: GamesId) => `game-${gameId}`;
