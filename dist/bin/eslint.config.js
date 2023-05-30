const iTwinPlugin = require("../rules/index");
const typescriptParser = require("@typescript-eslint/parser");

module.exports = [
    {
        plugins: {
            "@itwin": iTwinPlugin
        },
        files: ["src/**/*.{ts,tsx}"],
        languageOptions: {
            sourceType: "module",
            parser: typescriptParser,
            parserOptions: {
                project: "tsconfig.json",
                ecmaVersion: "latest",
                ecmaFeatures: {
                    jsx: true,
                    modules: true
                },
            },
        },
        rules: {
            "@itwin/no-internal": "error",
        }
    }
];
