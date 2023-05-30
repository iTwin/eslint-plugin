/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

const reactHooksPlugin = require("eslint-plugin-react-hooks");
const typescriptEslintPlugin = require("@typescript-eslint/eslint-plugin");
const importPlugin = require("eslint-plugin-import");
const preferArrowPlugin = require("eslint-plugin-prefer-arrow");
const deprecationPlugin = require("eslint-plugin-deprecation");
const reactPlugin = require("eslint-plugin-react");
const eslintPlugin = require("../rules/index");

const typescriptParser = require("@typescript-eslint/parser");

module.exports =
{
  plugins: {
    "react-hooks": reactHooksPlugin,
    "@typescript-eslint/eslint-plugin": typescriptEslintPlugin,
    "import": importPlugin,
    "prefer-arrow": preferArrowPlugin,
    "deprecation": deprecationPlugin,
    "react": reactPlugin,
    "@itwin": eslintPlugin
  },
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
    "@itwin/public-extension-exports": [
      "error",
      {
        "releaseTags": [
          "public",
          "preview"
        ],
        "outputApiFile": true
      }
    ]
  }
}
