module.exports = [
    {
        plugins: {
            "@itwin": require("../index")
        },
        files: ["src/**/*.{ts,tsx}"],
        languageOptions: {
            sourceType: "module",
            parser: require("@typescript-eslint/parser"),
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
