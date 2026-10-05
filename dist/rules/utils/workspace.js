/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

// Minimal replacement for `getWorkspaces` from `workspace-tools`, which pulled in
// micromatch/fast-glob/braces. Mirrors workspace-tools@0.36 behavior: manager detection,
// PREFERRED_WORKSPACE_MANAGER override, and per-process caching of roots and package paths.

"use strict";

const fs = require("fs");
const path = require("path");

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

const managerAndRootCache = new Map();
const packagePathsCache = new Map();

function logVerboseWarning(description, err) {
  if (process.env.VERBOSE)
    console.warn(`${description}${err ? ":\n" : ""}`, (err && err.stack) || err || "");
}

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
  if (managerAndRootCache.has(cwd))
    return managerAndRootCache.get(cwd);

  const preferred = getPreferredWorkspaceManager();
  const managerFile = searchUp(preferred ? [managerFiles[preferred]] : Object.values(managerFiles), cwd);
  let result;
  if (managerFile) {
    const fileName = path.basename(managerFile);
    result = {
      manager: Object.keys(managerFiles).find((name) => managerFiles[name] === fileName),
      root: path.dirname(managerFile),
    };
  }
  managerAndRootCache.set(cwd, result);
  return result;
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
  if (packagePathsCache.has(root))
    return packagePathsCache.get(root);

  const { globSync } = require("tinyglobby");
  const patterns = packageGlobs.map((glob) => path.join(glob, "package.json").replace(/\\/g, "/"));
  const result = globSync(patterns, {
    cwd: root,
    absolute: true,
    ignore: ["**/node_modules/**", "**/__fixtures__/**"],
    expandDirectories: false,
  }).map((packageJsonPath) => path.normalize(path.dirname(packageJsonPath)));

  packagePathsCache.set(root, result);
  return result;
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

/**
 * Get the name, path and package.json contents for each package in the workspace containing `cwd`.
 * Returns an empty array if no workspace is found or it can't be read.
 * @param {string} cwd
 * @returns {Array<{ name: string, path: string, packageJson: { packageJsonPath: string, [key: string]: any } }>}
 */
function getWorkspaces(cwd) {
  const managerAndRoot = getWorkspaceManagerAndRoot(cwd);
  if (!managerAndRoot)
    return [];

  let packagePaths;
  try {
    packagePaths = getWorkspacePackagePaths(managerAndRoot.manager, managerAndRoot.root);
  } catch (err) {
    logVerboseWarning(`Error getting ${managerAndRoot.manager} workspace package paths for ${cwd}`, err);
    return [];
  }

  return packagePaths
    .map((workspacePath) => {
      const packageJsonPath = path.join(workspacePath, "package.json");
      let packageJson;
      try {
        packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      } catch (err) {
        logVerboseWarning(`Error reading or parsing ${packageJsonPath} while getting workspace package info`, err);
        return null;
      }
      return {
        name: packageJson.name,
        path: workspacePath,
        packageJson: { packageJsonPath, ...packageJson },
      };
    })
    .filter(Boolean);
}

module.exports = { getWorkspaces };
