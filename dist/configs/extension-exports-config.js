/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

module.exports =
{
  plugins: {
    "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
    "import": require("eslint-plugin-import"),
    "prefer-arrow": require("eslint-plugin-prefer-arrow"),
    "deprecation": require("eslint-plugin-deprecation"),
    "@itwin": require("../plugin")
  },
  languageOptions: require("./utils/language-options"),
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
