/** @type {import('eslint').Linter.Config} */
module.exports = {
	"env": {
		"es2021": true,
		"node": true
	},
	"parser": "@babel/eslint-parsert",
	"parserOptions": { "sourceType": "module" },
	extends: [
		"prettier",
		// Uncomment any of the lines below to choose desired strictness,
		// but leave only one uncommented!
		// See https://eslint.vuejs.org/rules/#available-rules
		// "plugin:vue/essential" // Priority A: Essential (Error Prevention)
		// "plugin:vue/strongly-recommended" // Priority B: Strongly Recommended (Improving Readability)
		// "plugin:vue/recommended" // Priority C: Recommended (Minimizing Arbitrary Choices and Cognitive Overhead)
	],

	"plugins": [
		"jsdoc",
		"@typescript-eslint"
	],
	"rules": {
		"array-bracket-spacing": [
			"error",
			"always",
			{
				"singleValue": true,
				"arraysInArrays": true,
				"objectsInArrays": true
			}
		],
		"array-bracket-newline": [
			"error",
			{ "multiline": true }
		],
		"array-element-newline": [
			"error",
			{ "multiline": true, "minItems": 2 }
		],
		"camelcase": [
			"error",
			{ "properties": "always" }
		],
		"indent": [
			"error",
			"tab",
			{ ignoredNodes: ["TemplateLiteral"] }
		],
		"keyword-spacing": [
			"error",
			{ "after": true, "before": true }
		],
		"key-spacing": [
			"error",
			{
				"singleLine": {
					"beforeColon": false,
					"afterColon": true
				},
				"multiLine": {
					"beforeColon": true,
					"afterColon": true,
					"align": "colon"
				}
			}
		],
		"no-trailing-spaces": [
			"error",
			{
				"skipBlankLines": false,
				"ignoreComments": false
			}
		],
		"no-fallthrough": "error",
		"object-curly-newline": [
			"error",
			{ "multiline": true }
		],
		"object-curly-spacing": [
			"error",
			"always",
			{
				"objectsInObjects": true,
				"arraysInObjects": true
			}
		],
		"object-property-newline": [
			"error",
			{ "allowAllPropertiesOnSameLine": true }
		],
		"prefer-promise-reject-errors": "off",
		"semi": [
			"error",
			"always"
		],
		"space-in-parens": [
			"error",
			"always"
		],
		"space-before-function-paren": [
			"error",
			{
				"anonymous": "never",
				"named": "never",
				"asyncArrow": "never"
			}
		],

		"curly": "error",
		"new-parens": "error",
		"no-redeclare": "error",
		"no-unused-expressions": "warn",
		"no-var": "error",
		"prefer-arrow-callback": "error",
		"prefer-const": "warn",
		"prefer-promise-reject-errors": "off",
		"quotes": [
			"error",
			"double",
			{
				"avoidEscape": true,
				"allowTemplateLiterals": true
			}
		],
		"spaced-comment": "error",
		"jsdoc/check-alignment": "error",
		"jsdoc/check-indentation": "error",
		"jsdoc/newline-after-description": "error",
		"jsdoc/check-param-names": "error",
		"@typescript-eslint/adjacent-overload-signatures": "error",
		"@typescript-eslint/array-type": "error",
		"@typescript-eslint/ban-types": "error",
		"@typescript-eslint/consistent-type-assertions": "error",
		"@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/member-delimiter-style": "error",
		"@typescript-eslint/no-empty-interface": "error",
		"@typescript-eslint/no-inferrable-types": "error",
		"@typescript-eslint/prefer-for-of": "error"
	},
	"overrides": [
		{
			// enable the rule specifically for TypeScript files
			"files": [
				"*.ts",
				"*.mts",
				"*.cts",
				"*.tsx"
			],
			"rules": { "@typescript-eslint/explicit-function-return-type": "error" }
		}
	]
};
