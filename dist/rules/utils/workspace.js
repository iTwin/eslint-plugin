/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

// Minimal replacement for `getWorkspaces` from `workspace-tools`, which pulled in
// micromatch/fast-glob/braces. Mirrors workspace-tools@0.36 manager detection (including the
// PREFERRED_WORKSPACE_MANAGER override) and package discovery.

"use strict";

const fs = require("node:fs");
const path = require("node:path");

/**
 * Files indicating the workspace root for each manager.
 * DO NOT REORDER! Key order determines precedence (e.g. lerna.json + yarn.lock).
 */
const managerFiles = {
  lerna: "lerna.json",
  rush: "rush.json",
  yarn: "yarn.lock",
  pnpm: "pnpm-workspace.yaml",
  npm: "package-lock.json",
};

/** Workspace packages per workspace root, read once per process. */
const packagesByRoot = new Map();

/** Search up from `cwd` for any of `fileNames`, returning the full path of the first match. */
function searchUp(fileNames, cwd) {
  let dir = path.resolve(cwd);
  const root = path.parse(dir).root;
  while (dir !== root) {
    const found = fileNames.find((f) => fs.existsSync(path.join(dir, f)));
    if (found)
      return path.join(dir, found);
    dir = path.dirname(dir);
  }
  return undefined;
}

function getPreferredWorkspaceManager() {
  const preferred = process.env.PREFERRED_WORKSPACE_MANAGER;
  return preferred && managerFiles[preferred] ? preferred : undefined;
}

/** @returns {{ manager: string, root: string } | undefined} */
function getWorkspaceManagerAndRoot(cwd) {
  const preferred = getPreferredWorkspaceManager();
  const managerFile = searchUp(preferred ? [managerFiles[preferred]] : Object.values(managerFiles), cwd);
  if (!managerFile)
    return undefined;
  const fileName = path.basename(managerFile);
  return {
    manager: Object.keys(managerFiles).find((name) => managerFiles[name] === fileName),
    root: path.dirname(managerFile),
  };
}

/** Parse JSON with comments/trailing commas (rush.json, lerna.json). */
function readJsonc(file) {
  const ts = require("typescript");
  const { config, error } = ts.parseConfigFileTextToJson(file, fs.readFileSync(file, "utf-8"));
  if (error)
    throw new Error(ts.flattenDiagnosticMessageText(error.messageText, "\n"));
  return config;
}

/** Resolve package folder globs (e.g. package.json `workspaces`) to absolute package directories. */
function getPackagePaths(root, packageGlobs) {
  const { globSync } = require("tinyglobby");
  const patterns = packageGlobs.map((glob) => path.join(glob, "package.json").replace(/\\/g, "/"));
  return globSync(patterns, {
    cwd: root,
    absolute: true,
    ignore: ["**/node_modules/**", "**/__fixtures__/**"],
    expandDirectories: false,
  }).map((packageJsonPath) => path.normalize(path.dirname(packageJsonPath)));
}

function getPackageJsonWorkspaceGlobs(root) {
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8"));
  } catch {
    throw new Error("Could not load package.json from workspaces root");
  }
  const { workspaces } = packageJson;
  if (Array.isArray(workspaces))
    return workspaces;
  if (!workspaces || !workspaces.packages)
    throw new Error("Could not find a workspaces object in package.json (expected if this is not a monorepo)");
  return workspaces.packages;
}

function getWorkspacePackagePaths(manager, root) {
  switch (manager) {
    case "rush": {
      const rushConfig = readJsonc(path.join(root, "rush.json"));
      return rushConfig.projects.map((project) => path.join(root, project.projectFolder));
    }
    case "lerna":
      return getPackagePaths(root, readJsonc(path.join(root, "lerna.json")).packages);
    case "pnpm": {
      const yaml = require("js-yaml");
      const config = yaml.load(fs.readFileSync(path.join(root, "pnpm-workspace.yaml"), "utf8"));
      return getPackagePaths(root, config.packages);
    }
    case "yarn":
    case "npm":
      return getPackagePaths(root, getPackageJsonWorkspaceGlobs(root));
  }
  return [];
}

/** @returns {Array<{ name: string, path: string }>} */
function readWorkspacePackages(manager, root) {
  let packagePaths;
  try {
    packagePaths = getWorkspacePackagePaths(manager, root);
  } catch {
    return [];
  }
  return packagePaths.flatMap((packagePath) => {
    try {
      const { name } = JSON.parse(fs.readFileSync(path.join(packagePath, "package.json"), "utf-8"));
      return [{ name, path: packagePath }];
    } catch {
      return [];
    }
  });
}

/**
 * Get the name and directory of each package in the workspace containing `cwd`.
 * Returns an empty array if no workspace is found or it can't be read.
 * @param {string} cwd
 * @returns {Array<{ name: string, path: string }>}
 */
function getWorkspaces(cwd) {
  const managerAndRoot = getWorkspaceManagerAndRoot(cwd);
  if (!managerAndRoot)
    return [];
  const { manager, root } = managerAndRoot;
  if (!packagesByRoot.has(root))
    packagesByRoot.set(root, readWorkspacePackages(manager, root));
  return packagesByRoot.get(root);
}

module.exports = { getWorkspaces };
