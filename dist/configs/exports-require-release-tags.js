/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

module.exports = {
  plugins: {
    "@itwin": require("../plugin"),
  },
  languageOptions: require("./utils/language-options"),
  rules: {
    "@itwin/exports-require-release-tag": [
      "error",
      {
        releaseTags: ["public"],
        outputApiFile: true,
      },
    ],
  },
};
