import { getFormatConfig } from "@luixo/configs";

export default getFormatConfig({
	tailwind: {
		stylesheet: "src/styles/app.css",
	},
	imports: {
		customGroups: [
			{
				groupName: "react",
				elementNamePattern: ["react", "react-dom/client"],
			},
		],
		groups: [
			"react",
			["builtin", "external"],
			"internal",
			"parent",
			["sibling", "index"],
			"unknown",
		],
		internalPattern: ["~/"],
	},
	ignorePatterns: [".output", "*.gen.ts"],
});
