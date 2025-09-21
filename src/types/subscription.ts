import type { Game } from "~/hooks/use-game";
import type { UserId, WordId } from "~/server/validation";

export type SubscriptionMapping = {
  "game:state": {
    state: Game["state"];
  };
  "game:currentPosition": {
    currentPosition: number;
  };
  "game:start": {
    teamIds: UserId[];
  };
  "team:join": {
    userId: UserId;
    nickname: string;
  };
  "team:leave": {
    userId: UserId;
  };
  "team:readiness": {
    userId: UserId;
    ready: boolean;
  };
  "team:nickname": {
    userId: UserId;
    nickname: string;
  };
  "word:add": {
    id: WordId;
    position: number;
    term: string;
    definition: string;
  };
  "word:remove": {
    id: WordId;
  };
  "word:term-update": {
    wordId: WordId;
    term: string;
  };
  "definition:ready": {
    wordId: WordId;
    teamId: UserId;
    ready: boolean;
  };
  "guessing:ready": {
    wordId: WordId;
    teamId: UserId;
    ready: boolean;
  };
  "guessing:reveal": {
    wordId: WordId;
    mapping: Record<string, null | { id: UserId; vote: UserId | null }>;
  };
};
