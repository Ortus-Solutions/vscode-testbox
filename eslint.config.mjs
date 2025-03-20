import globals from "globals";

export default [
    {
        files: [
            "**/*.js",
            "**/*.mjs"
        ],

        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
                myCustomGlobal: "readonly"
            }
        },

        extends: [
            "eslint:recommend"
        ],

        parser: "@babel/eslint-parser",
        parserOptions: {
            ecmaVersion: "latest",
            sourceType: "module"
        },
        "plugins": [
            "jsdoc",
            "@typescript-eslint"
        ],

        rules: {
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
    }
];