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
 * cache of directories to whether we already checked if it should be linted
 * @type {Map<string, boolean>} cache of directories to whether we already checked if it should be linted
 */
const shouldLintDirCache = new Map();

/**
 * @type {Map<string, boolean>}
 */
const isCheckedDepCache = new Map();

/**
 * This rule prevents the use of APIs with specific release tags.
 * @type {import("eslint").Rule.RuleModule}
 */
module.exports = {
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
          // experimental because most consumers will want to analyze all their code
          enableExperimentalAnalysisSkipping: {
            type: "boolean",
            default: false,
          }
        }
      }
    ]
  },

  create(context) {
    const bannedTags = (context.options.length > 0 && context.options[0].tag) || ["alpha", "internal"];
    const checkedPackagePatterns = (context.options.length > 0 && context.options[0].checkedPackagePatterns) || ["^@itwin/", "^@bentley/"];
    const checkedPackageRegexes = checkedPackagePatterns.map((p) => new RegExp(p));
    const allowWorkspaceInternal = !(context.options.length > 0 && context.options[0].dontAllowWorkspaceInternal) || false;
    const enableExperimentalAnalysisSkipping = context.options.length > 0 && context.options[0].enableExperimentalAnalysisSkipping || false;
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
      assert(parsed.root, "path must be absolute");

      const MAX_LOOPS = 1000;
      for (let i = 0; i < MAX_LOOPS; ++i) {
        filepath = path.dirname(filepath);
        if (filepath === parsed.root)
          return [undefined, undefined];
        const testPackageJsonPath = path.join(filepath, "package.json");
        try {
          const pkgJson = JSON.parse(fs.readFileSync(testPackageJsonPath, { encoding: "utf8" }));
          return [testPackageJsonPath, pkgJson]
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
     * Resolves the package.json manifest of a dependency from a directory
     * @param {string} pkgQualifiedName - qualified (scope-included) name of a package
     * @param {string} fromDir - directroy from which to resolve the package
     * @returns the path to the manifest (package.json) of the given package
     */
    function resolveDependencyPackageJson(pkgQualifiedName, fromDir) {
      // first try resolve package.json directly. This will throw if package.json#main is empty
      // or package.json#exports does not export itself
      let packageJsonPath;
      try {
        packageJsonPath = require.resolve(`${pkgQualifiedName}/package.json`, { paths: [fromDir] })
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: "utf8" }));
        return [packageJsonPath, packageJson];
      } catch (err) {
        if (err.code !== "MODULE_NOT_FOUND") throw err;
      }
      // find package.json from the path to the main module
      const packageMainPath = require.resolve(pkgQualifiedName, { paths: [fromDir] })
      return getOwningPackage(packageMainPath);
    }

    /**
     * As an optimization, do not bother linting files with no transitive dependencies that match
     * `checkedPackagePatterns`
     * @param {string} filepath
     */
    function checkShouldLintFile(filepath) {
      const dir = path.dirname(filepath);

      const cachedFileDir = shouldLintDirCache.get(dir);
      if (cachedFileDir !== undefined) return cachedFileDir;

      const [owningPackagePath, owningPackageJson]  = getOwningPackage(filepath)
      if (owningPackagePath === undefined) return true;

      const owningPackage = {
        path: owningPackagePath,
        name: owningPackageJson.name,
        packageJson: owningPackageJson,
      };

      const cachedShouldLintPackage = shouldLintDirCache.get(owningPackage.path);
      if (cachedShouldLintPackage !== undefined) return cachedShouldLintPackage;

      /**
       * This function throws as a form of async early return
       * @param {{ name: string, path: string, packageJson: any }} pkg
       * @returns {boolean}
       */
      function crawlDeps(pkg) {
        let cached = isCheckedDepCache.get(pkg.path);
        if (cached)
          return cached;

        let isChecked = false;

        for (const depName of [
          ...Object.keys(pkg.packageJson.dependencies ?? {}),
          ...Object.keys(pkg.packageJson.devDependencies ?? {}),
        ]) {
          isChecked = checkedPackageRegexes.some((r) => r.test(depName));
          if (isChecked) break;

          // NOTE: this will fail on packages that contain an explicit exports definition in package.json
          // and do not export their package.json. If we hit those, we will need to be more clever
          const [depPkgJsonPath, depPkgJson] = resolveDependencyPackageJson(depName, pkg.path);
          assert(depPkgJsonPath);
          const depPath = path.dirname(depPkgJsonPath);

          isChecked = crawlDeps({ path: depPath, packageJson: depPkgJson, name: depPkgJson.name });
          if (isChecked) break;
        }

        isCheckedDepCache.set(pkg.path, isChecked)
        return isChecked;
      }

      const hasCheckedDeps = crawlDeps(owningPackage);
      shouldLintDirCache.set(dir, hasCheckedDeps);
      shouldLintDirCache.set(owningPackage.path, hasCheckedDeps);
      return hasCheckedDeps;
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

    let shouldLintFile = true;

    return {
      Program() {
        if (!enableExperimentalAnalysisSkipping)
          return;

        const isEslintSpecialPath = context.filename === "<input>" || context.filename === "<text>";
        if (isEslintSpecialPath)
          return;

        shouldLintFile = checkShouldLintFile(context.filename);
      },

      "Program:exit"() {
        shouldLintFile = true;
      },

      CallExpression(node) {
        if (!shouldLintFile) return;

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
        if (!shouldLintFile) return;

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
        if (!shouldLintFile) return;

        const tsCall = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (!tsCall)
          return;

        const resolved = typeChecker.getSymbolAtLocation(tsCall);
        if (!resolved || !resolved.valueDeclaration)
          return;
        checkWithParent(resolved.valueDeclaration, node);
      },

      Decorator(node) {
        if (!shouldLintFile) return;

        const tsCall = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (!tsCall)
          return;

        const resolved = typeChecker.getResolvedSignature(tsCall);
        if (!resolved || !resolved.declaration)
          return;
        checkWithParent(resolved.declaration, node);
      },

      JSXOpeningElement(node) {
        if (!shouldLintFile) return;

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
        if (!shouldLintFile) return;

        const tsCall = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (!tsCall)
          return;

        const resolved = typeChecker.getResolvedSignature(tsCall);
        if (resolved)
          checkWithParent(resolved.declaration, node);
      },

      TSTypeReference(node) {
        if (!shouldLintFile) return;

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
