import {
  type Config,
  IdentifierNode,
  LiteralNode,
  ObjectExpressionNode,
  PropertyNode,
  RawExpressionNode,
  UnionExpressionNode,
} from "kysely-codegen";
import { values } from "remeda";

const TYPES = {
  user: new IdentifierNode("UserId"),
  game: new IdentifierNode("GameId"),
  word: new IdentifierNode("WordId"),
};

const config: Config = {
  outFile: "src/db/database.gen.ts",
  overrides: {
    columns: {
      "users.id": TYPES.user,
      "games.id": TYPES.game,
      "games.ownerId": TYPES.user,
      "teams.gameId": TYPES.game,
      "teams.userId": TYPES.user,
      "words.id": TYPES.word,
      "words.gameId": TYPES.game,
      "definitions.guessUserId": new UnionExpressionNode([
        TYPES.user,
        new RawExpressionNode("null"),
      ]),
      "definitions.userId": TYPES.user,
      "definitions.wordId": TYPES.word,
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
    },
  },
  transform: (code) =>
    [
      `import type { ${values(TYPES)
        .map((type) => type.name)
        .join(", ")} } from '~/server/validation';`,
      `export type { ${values(TYPES)
        .map((type) => type.name)
        .join(", ")} };`,
      code,
    ].join("\n"),
};

export default config;
