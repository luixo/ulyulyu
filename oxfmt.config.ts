import { getFormatConfig } from "@luixo/configs";

export default getFormatConfig({
	ignorePatterns: [".output", "*.gen.ts"],
	imports: {
		customGroups: [
			{
				elementNamePattern: ["react", "react-dom/client"],
				groupName: "react",
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
	tailwind: {
		stylesheet: "src/styles/app.css",
	},
});
