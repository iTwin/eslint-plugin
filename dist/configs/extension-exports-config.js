/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

module.exports =
{
  plugins: {
    "react-hooks": require("eslint-plugin-react-hooks"),
    "@typescript-eslint/eslint-plugin": require("@typescript-eslint/eslint-plugin"),
    "import": require("eslint-plugin-import"),
    "prefer-arrow": require("eslint-plugin-prefer-arrow"),
    "deprecation": require("eslint-plugin-deprecation"),
    "react": require("eslint-plugin-react"),
    "@itwin": require("../rules/index")
  },
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parser: require("@typescript-eslint/parser"),
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
