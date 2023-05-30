#! /usr/bin/env node

/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
"use strict"
const path = require('path');
const fs = require('fs');

function getNodeModulesDir(startPath) {
  let currPath = startPath;
  let baseName = path.basename(currPath);
  while (baseName !== "node_modules") {
    currPath = path.resolve(currPath, "..")
    if (currPath === "/")
      return undefined;
    baseName = path.basename(currPath);
  }
  return currPath;
}

const nodeModules = getNodeModulesDir(path.dirname(process.argv[1]));
if (!nodeModules)
  throw ("Could not find node_modules directory");

const distDir = path.join(nodeModules, "@itwin/eslint-plugin/dist")
if (!fs.existsSync(distDir))
  throw ("Could not find required dir: " + distDir);

const configDir = path.join(nodeModules, "@itwin/eslint-plugin/dist/bin/eslint.config.js")
if (!fs.existsSync(distDir))
  throw ("Could not find required dir: " + configDir);

let tags;
if (process.argv.length > 3) {
  tags = process.argv[2].toString();
}


// Run eslint with the appropriate configuration and formatter to get a report of the no-internal rule
let args;
if (tags) {
  const custom = "{@itwin/no-internal:[error,{'tag':" + tags + "}]}";
  args = [
    "-f", path.join(distDir, "formatters/no-internal-summary.js"),
    "-c", configDir,
    "--rule", custom,
    ...process.argv.slice(3)
  ];
} else
  args = [
    "-f", path.join(distDir, "formatters/no-internal-summary.js"),
    "-c", configDir,
    ...process.argv.slice(2)
  ];

let results;
const child = require('child_process');
try {
  results = child.execFileSync("eslint", args, { shell: true });
} catch (error) {
  results = error.stdout;
}
console.log(results.toString());
