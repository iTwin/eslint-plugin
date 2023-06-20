/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
/** @type {import("beachball").BeachballConfig } */
module.exports = {
    bumpDeps: false,
    access: "public",
    tag: "latest",
    ignorePatterns: [
      ".nycrc",
      ".eslintrc.json",
      ".mocharc.json",
      "tsconfig.*",
      ".*ignore",
      ".github/**",
      ".vscode/**",
      "pnpm-lock.yaml",
      "tests/fixtures",
    ],
    package: "@itwin/eslint-plugin",
    changehint: "Run 'pnpm change' to generate a change file",
  };
