import { recase } from "@kristiandupont/recase";
import {
	processDatabase,
	generateIndexFile,
	defaultGetPropertyMetadata,
} from "kanel";
import path from "path";

import { getDatabaseConfig } from "@/db/config";

const fileRecase = recase("pascal", "dash");
const kebabToPascal = recase("dash", "pascal");

const TYPE_OVERRIDES: Record<string, Record<string, string>> = {
	games: {
		state: `
    | { phase: "start" }
    | { phase: "proposal", currentPosition: number }
    | { phase: "guessing", currentPosition: number }
    | { phase: "finish" }`,
	},
};

/* eslint-disable no-console */
const run = async () => {
	console.log(`\n> Generating types...`);
	try {
		const outputPath = path.join(__dirname, "../src/db/models");
		await processDatabase({
			connection: getDatabaseConfig(),
			outputPath,
			preDeleteOutputFolder: true,
			getMetadata: (details, generateFor) => ({
				name: kebabToPascal(
					generateFor === "selector"
						? details.name
						: `${details.name}-${generateFor}`,
				),
				comment: undefined,
				path: path.join(outputPath, fileRecase(details.name)),
			}),
			getPropertyMetadata: (property, details, generateFor, config) => {
				if (
					"fakeInformationSchemaValue" in property ||
					!("dimensions" in property)
				) {
					return defaultGetPropertyMetadata(
						property,
						details,
						generateFor,
						config,
					);
				}
				const comments = property.comment ? [property.comment] : [];
				if (property.indices) {
					comments.push(
						...property.indices.map(({ name, isPrimary }) =>
							isPrimary ? `Primary key. Index: ${name}` : `Index: ${name}`,
						),
					);
				}
				if (property.defaultValue && generateFor === "initializer") {
					comments.push(`Default value: ${property.defaultValue}`);
				}
				const typeOverrideTable = TYPE_OVERRIDES[details.name];
				const typeOverrideColumn = typeOverrideTable?.[property.name];
				return {
					name: property.name,
					comment: comments,
					typeOverride: typeOverrideColumn,
				};
			},
			generateIdentifierType: (column, details) => ({
				declarationType: "typeDeclaration",
				name: kebabToPascal(`${details.name}-${column.name}`),
				exportAs: "named",
				typeDefinition: [`string & { __flavor?: '${details.name}' }`],
				comment: [`Identifier type for "${details.name}" table`],
			}),
			typeFilter: (pgType) => !pgType.name.includes("kysely"),
			preRenderHooks: [generateIndexFile],
			postRenderHooks: [
				(_, lines) =>
					[
						"// @generated",
						"// Automatically generated. Don't change this file manually.",
						"",
						...lines,
					].filter((s): s is string => s !== undefined),
			],
		});
		console.log(`< Types successfully generated!`);
	} catch (e) {
		console.error(`< Error generating types:`, e);
	}
};
/* eslint-enable no-console */

void run();
