import { defineConfig, globalIgnores } from "eslint/config";
import react from "eslint-plugin-react";
import unusedImports from "eslint-plugin-unused-imports";
import _import from "eslint-plugin-import";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import jsxA11Y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-plugin-prettier";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";

// Simplified config: avoid relying on @eslint/compat and other @eslint/* helper packages
// which aren't declared in the root package.json of this repo in CI. Keep the
// same plugin rules and global ignores, but use direct extends/plugins.
export default defineConfig([
	globalIgnores([
		".now/*",
		"**/*.css",
		"**/.changeset",
		"**/dist",
		"esm/*",
		"public/*",
		"tests/*",
		"scripts/*",
		"**/*.config.js",
		"**/.DS_Store",
		"**/node_modules",
		"**/coverage",
		"**/.next",
		"**/build",
		"!**/.commitlintrc.cjs",
		"!**/.lintstagedrc.cjs",
		"!**/jest.config.js",
		"!**/plopfile.js",
		"!**/react-shim.js",
		"!**/tsup.config.ts",
	]),
	{
		extends: [
			"plugin:react/recommended",
			"plugin:prettier/recommended",
			"plugin:react-hooks/recommended",
			"plugin:jsx-a11y/recommended",
			"plugin:@next/next/recommended",
		],

		plugins: {
			react,
			"unused-imports": unusedImports,
			import: _import,
			"@typescript-eslint": typescriptEslint,
			"jsx-a11y": jsxA11Y,
			prettier,
		},

		languageOptions: {
			globals: {
				...Object.fromEntries(Object.entries(globals.browser).map(([key]) => [key, "off"])),
				...globals.node,
			},

			parser: tsParser,
			ecmaVersion: 12,
			sourceType: "module",

			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},

		settings: {
			react: {
				version: "detect",
			},
		},

		files: ["**/*.ts", "**/*.tsx"],

		rules: {
			"no-console": "warn",
			"react/prop-types": "off",
			"react/jsx-uses-react": "off",
			"react/react-in-jsx-scope": "off",
			"react-hooks/exhaustive-deps": "off",
			"jsx-a11y/click-events-have-key-events": "warn",
			"jsx-a11y/interactive-supports-focus": "warn",
			"prettier/prettier": "warn",
			"no-unused-vars": "off",
			"unused-imports/no-unused-vars": "off",
			"unused-imports/no-unused-imports": "warn",

			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					args: "after-used",
					ignoreRestSiblings: false,
					argsIgnorePattern: "^_.*?$",
				},
			],

			"import/order": [
				"warn",
				{
					groups: [
						"type",
						"builtin",
						"object",
						"external",
						"internal",
						"parent",
						"sibling",
						"index",
					],

					pathGroups: [
						{
							pattern: "~/**",
							group: "external",
							position: "after",
						},
					],

					"newlines-between": "always",
				},
			],

			"react/self-closing-comp": "warn",

			"react/jsx-sort-props": [
				"warn",
				{
					callbacksLast: true,
					shorthandFirst: true,
					noSortAlphabetically: false,
					reservedFirst: true,
				},
			],

			"padding-line-between-statements": [
				"warn",
				{
					blankLine: "always",
					prev: "*",
					next: "return",
				},
				{
					blankLine: "always",
					prev: ["const", "let", "var"],
					next: "*",
				},
				{
					blankLine: "any",
					prev: ["const", "let", "var"],
					next: ["const", "let", "var"],
				},
			],
		},
	},
]);
