import globals from "globals";
import pluginJs from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        files: [ "**/*.{js,mjs,cjs,ts}" ],
        plugins: {
            jsdoc: jsdoc
        },
        languageOptions: { globals: globals.node },
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
            "jsdoc/check-param-names": "error",
            "jsdoc/check-indentation": "off",
        }
    }
];
