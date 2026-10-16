import {
	IdentifierNode,
	LiteralNode,
	ObjectExpressionNode,
	PropertyNode,
	RawExpressionNode,
	UnionExpressionNode,
} from "kysely-codegen";
import type { Config } from "kysely-codegen";
import { pullObject, values } from "remeda";

const TYPES = {
	game: new IdentifierNode("GameId"),
	user: new IdentifierNode("UserId"),
	word: new IdentifierNode("WordId"),
};
// UserId, GameId, WordId

const config: Config = {
	customImports: pullObject(
		values(TYPES),
		(value) => value.name,
		() => "~/server/validation",
	),
	outFile: "src/db/database.gen.ts",
	overrides: {
		columns: {
			"definitions.guessUserId": new UnionExpressionNode([
				TYPES.user,
				new RawExpressionNode("null"),
			]),
			"definitions.userId": TYPES.user,
			"definitions.wordId": TYPES.word,
			"games.id": TYPES.game,
			"games.ownerId": TYPES.user,
			"games.state": new UnionExpressionNode([
				new ObjectExpressionNode([
					new PropertyNode("phase", new LiteralNode("start")),
				]),
				new ObjectExpressionNode([
					new PropertyNode("phase", new LiteralNode("proposal")),
					new PropertyNode("currentPosition", new IdentifierNode("number")),
				]),
				new ObjectExpressionNode([
					new PropertyNode("phase", new LiteralNode("guessing")),
					new PropertyNode("currentPosition", new IdentifierNode("number")),
				]),
				new ObjectExpressionNode([
					new PropertyNode("phase", new LiteralNode("finish")),
				]),
			]),
			"teams.gameId": TYPES.game,
			"teams.userId": TYPES.user,
			"users.id": TYPES.user,
			"words.gameId": TYPES.game,
			"words.id": TYPES.word,
		},
	},
};

export default config;
