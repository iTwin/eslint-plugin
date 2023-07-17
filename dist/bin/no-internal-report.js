#! /usr/bin/env node
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
"use strict"
const path = require('path');
const assert = require('assert');
const eslintBinPath = path.join(require.resolve("eslint"), "../../bin/eslint.js");

const args = { tags: ["alpha", "internal"], files: [] };
for (let i = 2; i < process.argv.length; ++ i) {
  const arg = process.argv[i]
  if (arg == '--tags') {
    assert(i + 1 < process.argv.length, "tags option requires an argument");
    args.tags = process.argv[i + 1].split(",");
    i += 1; // skip next arg
  } else {
    args.files.push(arg);
  }
}

const eslintArgs = [
  eslintBinPath,
  "-f", require.resolve("../formatters/no-internal-summary.js"),
  "--parser", "@typescript-eslint/parser",
  "--parser-options", "{project:['tsconfig.json'],sourceType:'module'}",
  "--rule", JSON.stringify({"@itwin/no-internal":["error",{tag: args.tags }]}),
  ...args.files,
];

let results;
try {
  const child = require('child_process');
  results = child.execFileSync("node", eslintArgs);
} catch (error) {
  results = error.stdout;
}
console.log(results.toString());
