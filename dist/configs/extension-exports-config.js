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

const typescriptParser = require("@typescript-eslint/parser");

const publicExtensionExportsRule = require("../rules/public-extension-exports");

module.exports =
{
  plugins: {
    "react-hooks": reactHooksPlugin,
    "@typescript-eslint/eslint-plugin": typescriptEslintPlugin,
    "import": importPlugin,
    "prefer-arrow": preferArrowPlugin,
    "deprecation": deprecationPlugin,
    "react": reactPlugin,
    custom: {
      rules: {
        publicExtensionExports: publicExtensionExportsRule
      }
    }
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
    "custom/publicExtensionExports": [
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
