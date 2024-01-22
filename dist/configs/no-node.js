/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

module.exports =
{
  plugins: {
    "import": require("eslint-plugin-import"),
  },
  languageOptions: require("./utils/language-options"),
  rules: {
    "import/no-nodejs-modules": "error",
  }
}
