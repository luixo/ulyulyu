import { getLintConfig } from "@luixo/configs";

export default getLintConfig({
	env: {
		browser: true,
		node: true,
	},
	ignorePatterns: ["dist/**", "**/*.gen.*"],
	overrides: [
		{
			files: ["src/routes/**/*"],
			rules: {
				// We use Route before definition
				"eslint/no-use-before-define": "off",
			},
		},
		{
			files: ["src/server/**", "src/db/**", "vite.config.ts"],
			rules: {
				// This is node environment, we might use process.env there
				"import/no-nodejs-modules": "off",
				"node/no-process-env": "off",
			},
		},
		{
			files: ["src/styles/heroui.ts"],
			rules: {
				"import/no-default-export": "off",
			},
		},
	],
	rules: {
		// We use a lot of magic numbers throughout the project
		"eslint/no-magic-numbers": "off",
		// We're not publishing this as a package
		"node/no-top-level-await": "off",
		// We don't have translations yet
		"react/jsx-no-literals": "off",
		// There are false positives on `z.foo().catch()`
		"unicorn/prefer-top-level-await": "off",
	},
});
