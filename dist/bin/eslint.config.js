const noInternal = require("../rules/no-internal");
const typescriptParser = require("@typescript-eslint/parser");

module.exports = [
    {
        plugins: {
            customRules: {
                rules: {
                    noInternalRule: noInternal
                }
            }
        },
        files: ["src/**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parser: typescriptParser,
            parserOptions: {
                project: "tsconfig.json",
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            "customRules/noInternalRule": "error",
        }
    }
];
