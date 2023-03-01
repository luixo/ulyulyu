import { ColumnType } from "kysely";

import * as models from "@/db/models";

type SelectTypeMap = {
	games: models.Games;
	users: models.Users;
	teams: models.Teams;
	words: models.Words;
	definitions: models.Definitions;
};

type InsertTypeMap = {
	games: models.GamesInitializer;
	users: models.UsersInitializer;
	teams: models.TeamsInitializer;
	words: models.WordsInitializer;
	definitions: models.DefinitionsInitializer;
};

type UpdateTypeMap = {
	games: models.GamesMutator;
	users: models.UsersMutator;
	teams: models.TeamsMutator;
	words: models.WordsMutator;
	definitions: models.DefinitionsMutator;
};

type TableColumnType<
	SelectTable,
	InsertTable extends Partial<SelectTable>,
	UpdateTable extends Partial<SelectTable>,
> = Required<{
	[Column in keyof SelectTable]: ColumnType<
		SelectTable[Column],
		InsertTable[Column],
		UpdateTable[Column]
	>;
}>;

type SecondDeepPartial<T> = {
	[LK in keyof T]: Partial<T[LK]>;
};

type DatabaseColumnType<
	SelectDatabase,
	InsertDatabase extends SecondDeepPartial<SelectDatabase> &
		Record<string, never>,
	UpdateDatabase extends SecondDeepPartial<SelectDatabase> &
		Record<string, never>,
> = {
	[Table in keyof SelectDatabase]: TableColumnType<
		SelectDatabase[Table],
		InsertDatabase[Table],
		UpdateDatabase[Table]
	>;
};

export type DatabaseTypes = DatabaseColumnType<
	SelectTypeMap,
	InsertTypeMap & Record<string, never>,
	UpdateTypeMap & Record<string, never>
>;
