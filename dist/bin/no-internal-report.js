#! /usr/bin/env node
/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
"use strict"
const path = require('path');
const assert = require('assert');
const eslintBinPath = path.join(require.resolve("eslint"), "../../bin/eslint.js");

const argCount = process.argv.length;
try {
  assert(argCount >= 3 && argCount <= 4);
} catch(error) {
  console.error("Incorrect number of arguments");
  console.error("Usage: no-internal-report [tags: internal,alpha,beta,public] [FILE_GLOBS]");
  console.error("The 'tag' argument may be one or more comma-separated api tag names")
  process.exit(1);
}

const tags = argCount == 3 ? "" : process.argv[2].split(",");
const custom = tags ? {"@itwin/no-internal":["error",{tag: tags }]} : {"@itwin/no-internal": "error"};

const args = [
  eslintBinPath,
  "-f", require.resolve("../formatters/no-internal-summary.js"),
  "--parser", "@typescript-eslint/parser",
  "--parser-options", "{project:['tsconfig.json'],sourceType:'module'}",
  "--rule", JSON.stringify(custom),
  ...process.argv.slice(argCount - 1)
];

let results;
try {
  const child = require('child_process');
  results = child.execFileSync("node", args);
} catch (error) {
  results = error.stdout;
}
console.log(results.toString());
