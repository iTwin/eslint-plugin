module.exports =
{
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
}