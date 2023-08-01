/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

// Writing all of these eslint rules in javascript so we can run them before the build step

"use strict";

const { getParserServices } = require("./utils/parser");
const ts = require("typescript");
const path = require("path");
const assert = require("assert");
const fs = require("fs");
const module_ = require("module");
const pnpmLockfiles = require("@pnpm/lockfile-file");

const syntaxKindFriendlyNames = {
  [ts.SyntaxKind.ClassDeclaration]: "class",
  [ts.SyntaxKind.EnumDeclaration]: "enum",
  [ts.SyntaxKind.InterfaceDeclaration]: "interface",
  [ts.SyntaxKind.ModuleDeclaration]: "module",
  [ts.SyntaxKind.MethodDeclaration]: "method",
  [ts.SyntaxKind.MethodSignature]: "method",
  [ts.SyntaxKind.FunctionDeclaration]: "function",
  [ts.SyntaxKind.GetAccessor]: "getter",
  [ts.SyntaxKind.SetAccessor]: "setter",
  [ts.SyntaxKind.PropertyDeclaration]: "property",
  [ts.SyntaxKind.PropertySignature]: "property",
  [ts.SyntaxKind.Constructor]: "constructor",
  [ts.SyntaxKind.EnumMember]: "enum member",
}

// NOTE: these must be module level because eslint reruns create for each file

/**
 * map of "name@version?options" per package to whether it will be checked,
 * used with `preloadCheckedDeps` as a performance optimization. Currently only
 * exposed for custom users due to using a faster lock-file based async api for
 * speed, which is not compatible with eslint which is sync
 * @type {Map<string, boolean>}
 */
const isCheckedDepCache = new Map();
let _usingCheckedDepCache = false;

/**
 * @param {{name: string, version: string}} pkgObj
 * @param {string[]} checkedPkgPatterns
 */
const getCheckedDep = (pkgObj, checkedPkgPatterns) =>
  isCheckedDepCache.get(`${pkgObj.name}@${pkgObj.version}?cpp=${checkedPkgPatterns.join("\0")}`);
/**
 * @param {{name: string, version: string}} pkgObj
 * @param {string[]} checkedPkgPatterns
 * @param {boolean} value
 */
const setCheckedDep = (pkgObj, checkedPkgPatterns, value) =>
  isCheckedDepCache.set(`${pkgObj.name}@${pkgObj.version}?cpp=${checkedPkgPatterns.join("\0")}`, value);

/**
 * Preload checked dependencies. Currently only supports pnpm.
 * @param {string} dir
 * @param {string[]} checkedPkgPatterns
 * @returns {Promise<void>}
 */
async function preloadCheckedDeps(dir, checkedPkgPatterns) {
  // FIXME: don't just use env var
  // TODO: determine what versions of pnpm this works with, seems to be multiple
  // NOTE: the `ignoreIncompatible` option appears to be inverted
  const lockfile = await pnpmLockfiles.readWantedLockfile(process.env.PRELOAD_WORKSPACE_DIR ?? dir, { ignoreIncompatible: false });
  if (lockfile === null)
    return;

  _usingCheckedDepCache = true;
  const checkedPkgRegexes = checkedPkgPatterns.map((r) => new RegExp(r));

  const alreadyCrawled = new Set();

  /** @param {string} packageId */
  function crawlDeps(packageId) {
    const isScopedPkg = packageId[1] === "@";
    let nameEnd = packageId.indexOf("/", 1);
    if (isScopedPkg)
      nameEnd = packageId.indexOf("/", nameEnd + 1);
    assert(nameEnd !== -1, `unexpected resolved package id format in lockfile: '${packageId}'`)
    const name = packageId.slice(1, nameEnd);
    let versionEnd = packageId.indexOf("(", nameEnd);
    if (versionEnd === -1) versionEnd = undefined;
    const version = packageId.slice(nameEnd + 1, versionEnd);

    const result = getCheckedDep({ name, version }, checkedPkgPatterns);
    if (result !== undefined)
      return result;

    if (alreadyCrawled.has(packageId))
      return;
    alreadyCrawled.add(packageId);

    if (checkedPkgRegexes.some((r) => r.test(name))) {
      setCheckedDep({ name, version }, checkedPkgPatterns, true);
      return true;
    }

    let value = false;
    for (const [depName, depResId] of Object.entries(lockfile.packages?.[packageId].dependencies ?? {})) {
      const depHasCustomResolution = depResId[0] === "/";
      const depId = depHasCustomResolution ? depResId : `/${depName}/${depResId}`;
      const depResult = crawlDeps(depId);
      if (depResult) {
        setCheckedDep({ name, version }, checkedPkgPatterns, depResult);
        value = true;
        break;
      }
    }

    setCheckedDep({ name, version }, checkedPkgPatterns, value);
    return value;
  }

  for (const [id, pkgInfo] of Object.entries(lockfile.packages ?? {})) {
    crawlDeps(id);
  }
}

/**
 * This rule prevents the use of APIs with specific release tags.
 * @type {import("eslint").Rule.RuleModule}
 */
module.exports = {
  _preloadCheckedDeps: preloadCheckedDeps,
  meta: {
    type: "problem",
    docs: {
      description: "Prevent the use of APIs with specific release tags.",
      category: "TypeScript",
    },
    messages: {
      forbidden: `{{kind}} "{{name}}" is {{tag}}.`,
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          tag: {
            type: "array",
            uniqueItems: true,
            items: {
              type: "string",
              enum: ["public", "beta", "alpha", "internal"]
            }
          },
          checkedPackagePatterns: {
            type: "array",
            uniqueItems: true,
            items: {
              type: "string",
            }
          },
          dontAllowWorkspaceInternal: {
            type: "boolean",
          },
        }
      }
    ]
  },

  create(context) {
    const bannedTags = (context.options.length > 0 && context.options[0].tag) || ["alpha", "internal"];
    const checkedPackagePatterns = (context.options.length > 0 && context.options[0].checkedPackagePatterns) || ["^@itwin/", "^@bentley/"];
    const checkedPackageRegexes = checkedPackagePatterns.map((p) => new RegExp(p));
    const allowWorkspaceInternal = !(context.options.length > 0 && context.options[0].dontAllowWorkspaceInternal) || false;
    const parserServices = getParserServices(context);
    const typeChecker = parserServices.program.getTypeChecker();
    const reportedViolationsSet = new Set();


    function getFileName(parent) {
      let currentParent = parent;
      while (currentParent) {
        if (currentParent.fileName !== undefined)
          return currentParent.fileName;
        currentParent = currentParent.parent;
      }
      return undefined;
    }

    /**
     * Checks if a directory contains a certain path.
     * @note this returns false if `packagePath === packageBaseDir`
     * @param {string} dir
     * @param {string} targetPath
     */
    function dirContainsPath(dir, targetPath) {
      const relative = path.relative(dir, targetPath);
      return (
        !!relative && !relative.startsWith("..") && !path.isAbsolute(relative)
      );
    }

    /**
     * Checks if the path to a package matches a checked package pattern regex.
     * @param {string} packagePath
     */
    function pathContainsCheckedPackage(packagePath) {
      return checkedPackageRegexes.some((r) => r.test(packagePath));
    }

    /**
     * get the package that a specific file belongs to
     * @param {string} filepath - links are not handled
     * @returns {[string, any] | [undefined, undefined]}
     */
    function getOwningPackage(filepath) {
      const parsed = path.parse(filepath);
      assert(parsed.root, `path '${filepath}' must be absolute`);

      const MAX_LOOPS = 1000;
      for (let i = 0; i < MAX_LOOPS; ++i) {
        filepath = path.dirname(filepath);
        if (filepath === parsed.root)
          return [undefined, undefined];
        const testPackageJsonPath = path.join(filepath, "package.json");
        try {
          const pkgJson = JSON.parse(fs.readFileSync(testPackageJsonPath, { encoding: "utf8" }));
          return [filepath, pkgJson]
        } catch (err) {
          if (err.code !== "ENOENT") throw err;
        }
      }

      throw Error("exceeded MAX_LOOPS while getting owning package.json");
    }

    /**
     * Checks if the package that owns the specified file path matches a checked package pattern regex
     * @param {string} filePath
     */
    function owningPackageIsCheckedPackage(filePath) {
      const [, owningPkgJson] = getOwningPackage(filePath);
      return owningPkgJson !== undefined && pathContainsCheckedPackage(owningPkgJson.name);
    }


    /**
     * Returns true if a file is within a package for which the internal tag is a violation.
     * By default `@itwin` and `@bentley` packages are included, see the `checkedPackagePatterns` option.
     * @param declaration 
     */
    function isCheckedFile(declaration) {
      if (!declaration)
        return false;
      const fileName = getFileName(declaration.parent);

      if (fileName.includes('node_modules')) {
        // If in node_modules (installed dependency), check path

        // eslint fileName always uses unix path separators
        const packageSegments = fileName.split("node_modules/");
        // can be undefined
        const packagePath = packageSegments[packageSegments.length - 1];
        return packagePath && pathContainsCheckedPackage(packagePath);
      }

      const isWorkspaceLinkedDependency = !dirContainsPath(parserServices.program.getCommonSourceDirectory(), fileName);

      if (allowWorkspaceInternal && isWorkspaceLinkedDependency)
        return false;
      
      // Else !allowWorkspaceInternal or is a local file, check package name in package.json
      return owningPackageIsCheckedPackage(fileName);
    }

    function getParentSymbolName(declaration) {
      if (declaration.parent && declaration.parent.symbol && !declaration.parent.symbol.escapedName.startsWith('"'))
        return declaration.parent.symbol.escapedName;
      return undefined;
    }

    function checkJsDoc(declaration, node) {
      if (!declaration || !declaration.jsDoc)
        return undefined;

      for (const jsDoc of declaration.jsDoc) {
        if (jsDoc.tags) {
          for (const tag of jsDoc.tags) {
            if (!bannedTags.includes(tag.tagName.escapedText) || !isCheckedFile(declaration)) {
              continue;
            }
            //Violation key to track and report violations on a per-usage basis
            const violationKey = `${declaration.kind}_${declaration.symbol.escapedName}_${tag}_${node.range[0]}`;
            if (reportedViolationsSet.has(violationKey)) {
              continue;
            }
            reportedViolationsSet.add(violationKey);
            let name;
            if (declaration.kind === ts.SyntaxKind.Constructor)
              name = declaration.parent.symbol.escapedName;
            else {
              name = declaration.symbol.escapedName;
              const parentSymbol = getParentSymbolName(declaration);
              if (parentSymbol)
                name = `${parentSymbol}.${name}`;
            }

            context.report({
              node,
              messageId: "forbidden",
              data: {
                kind: syntaxKindFriendlyNames.hasOwnProperty(declaration.kind) ? syntaxKindFriendlyNames[declaration.kind] : "unknown object type " + declaration.kind,
                name,
                tag: tag.tagName.escapedText,
              }
            });
          }
        }
      }
    }

    function checkWithParent(declaration, node) {
      if (!declaration) {
        return;
      }
      checkJsDoc(declaration, node);
      if (declaration.parent && [
        ts.SyntaxKind.ClassDeclaration,
        ts.SyntaxKind.EnumDeclaration,
        ts.SyntaxKind.InterfaceDeclaration,
        ts.SyntaxKind.ModuleDeclaration,
      ].includes(declaration.parent.kind)) {
        checkJsDoc(declaration.parent, node);
      }
    }

    const isSpecialEslintFile = context.getFilename() === "<text>" || context.getFilename() === "<input>";
    if (_usingCheckedDepCache && !isSpecialEslintFile) {
      const [, owningPkgJson] = getOwningPackage(context.getFilename());
      const isChecked = isCheckedDepCache.get({ name: owningPkgJson.name, version: owningPkgJson.version }, checkedPackagePatterns);
      if (isChecked === false) {
        return {};
      }
    }

    return {
      CallExpression(node) {
        const tsCall = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (!tsCall)
          return;

        const resolved = typeChecker.getResolvedSignature(tsCall);
        if (!resolved || !resolved.declaration)
          return;
        checkWithParent(resolved.declaration, node);

        const resolvedSymbol = typeChecker.getSymbolAtLocation(tsCall.expression);
        if (resolvedSymbol)
          checkWithParent(resolvedSymbol.valueDeclaration, node);
      },

      NewExpression(node) {
        const tsCall = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (!tsCall)
          return;

        const resolvedClass = typeChecker.getTypeAtLocation(tsCall);
        if (resolvedClass && resolvedClass.symbol)
          checkWithParent(resolvedClass.symbol.valueDeclaration, node);

        const resolvedConstructor = typeChecker.getResolvedSignature(tsCall);
        if (resolvedConstructor)
          checkWithParent(resolvedConstructor.declaration, node);
      },

      MemberExpression(node) {
        const tsCall = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (!tsCall)
          return;

        const resolved = typeChecker.getSymbolAtLocation(tsCall);
        if (!resolved || !resolved.valueDeclaration)
          return;
        checkWithParent(resolved.valueDeclaration, node);
      },

      Decorator(node) {
        const tsCall = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (!tsCall)
          return;

        const resolved = typeChecker.getResolvedSignature(tsCall);
        if (!resolved || !resolved.declaration)
          return;
        checkWithParent(resolved.declaration, node);
      },

      JSXOpeningElement(node) {
        const tsCall = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (!tsCall)
          return;

        const resolved = typeChecker.getResolvedSignature(tsCall);
        if (!resolved)
          return;
        if (resolved.resolvedReturnType && resolved.resolvedReturnType.symbol)
          checkWithParent(resolved.resolvedReturnType.symbol.valueDeclaration, node); // class
        if (resolved.declaration)
          checkWithParent(resolved.declaration, node); // constructor
      },

      TaggedTemplateExpression(node) {
        const tsCall = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (!tsCall)
          return;

        const resolved = typeChecker.getResolvedSignature(tsCall);
        if (resolved)
          checkWithParent(resolved.declaration, node);
      },

      TSTypeReference(node) {
        const tsCall = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (!tsCall)
          return;

        const resolved = typeChecker.getTypeAtLocation(tsCall);
        if (resolved)
          checkWithParent(resolved.declaration, node);
      },
    };
  }
}
