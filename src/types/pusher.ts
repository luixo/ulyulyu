import { Games, UsersId, WordsId } from "@/db/models";

export type PusherMapping = {
	"game:state": {
		state: Games["state"];
	};
	"game:currentPosition": {
		currentPosition: number;
	};
	"game:start": {
		teamIds: UsersId[];
	};
	"team:join": {
		userId: UsersId;
		nickname: string;
	};
	"team:leave": {
		userId: UsersId;
	};
	"team:readiness": {
		userId: UsersId;
		ready: boolean;
	};
	"team:nickname": {
		userId: UsersId;
		nickname: string;
	};
	"word:add": {
		id: WordsId;
		position: number;
		term: string;
		definition: string;
	};
	"word:remove": {
		id: WordsId;
	};
	"word:term-update": {
		wordId: WordsId;
		term: string;
	};
	"definition:ready": {
		wordId: WordsId;
		teamId: UsersId;
		ready: boolean;
	};
	"guessing:ready": {
		wordId: WordsId;
		teamId: UsersId;
		ready: boolean;
	};
	"guessing:reveal": {
		wordId: WordsId;
		mapping: Record<string, null | { id: UsersId; vote: UsersId | null }>;
	};
};
