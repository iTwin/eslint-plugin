/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

// Writing all of these eslint rules in javascript so we can run them before the build step

"use strict";

const { getParserServices } = require("./utils/parser");
const ts = require("typescript");
const path = require("path");
const workspace = require("workspace-tools");

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
    const enableExperimentalAnalysisSkipping = !(context.options.length > 0 && context.options[0].enableExperimentalAnalysisSkipping) || false;
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
     * @param {string} filePath
     */
    function getOwningPackage(filePath) {
      const packageList = workspace.getWorkspaces(filePath);
      
      // Look through all package infos to find the one containing our packagePath
      let packageObj = packageList.find((pkg) => {
        const packageBaseDir = path.dirname(pkg.packageJson.packageJsonPath);
        return dirContainsPath(packageBaseDir, filePath);
      });

      return packageObj;
    }

    /**
     * Checks if the package that owns the specified file path matches a checked package pattern regex.s
     * @param {string} filePath
     */
    function owningPackageIsCheckedPackage(filePath) {
      const owningPackage = getOwningPackage(filePath);
      return owningPackage !== undefined && pathContainsCheckedPackage(owningPackage.name);
    }

    // would be nice to share this cache with other plugins
    const shouldLintDirCache = new Map();

    /**
     * As an optimization, do not bother linting files with no transitive dependencies that match
     * `checkedPackagePatterns`
     * @param {string} filepath
     */
    async function checkShouldLintFile(filepath) {
      const dir = path.dirname(filepath);

      const cachedFileDir = shouldLintDirCache.get(dir);
      if (cachedFileDir !== undefined) return cachedFileDir;

      const owningPackage = getOwningPackage(filepath);
      if (!owningPackage) return true;

      const cachedShouldLintPackage = shouldLintDirCache.get(owningPackage.path);
      if (cachedShouldLintPackage !== undefined) return cachedShouldLintPackage;

      const depSet = new Set();
      /** @param {NonNullable<typeof owningPackage>} pkg */
      async function recurseHasCheckedDeps(pkg) {
        if (depSet.has(pkg.name)) return false;
        depSet.add(pkg.name);

        return Promise.all([
          ...Object.keys(pkg.packageJson.dependencies ?? {}),
          ...Object.keys(pkg.packageJson.devDependencies ?? {}),
        ].map((depName) => {
          const isCheckedPackage = checkedPackageRegexes.some((r) => r.test(depName));
          if (isCheckedPackage) return true;

          // NOTE: this will fail on packages that contain an explicit exports definition in package.json
          // and do not export their package.json. If we hit those, we will need to be more clever
          const depPkgJsonPath = require.resolve(`${depName}/package.json`, { paths: [pkg.path] })
          const depPath = path.dirname(depPkgJsonPath);
          const depPkgJson = require(depPkgJsonPath);

          return recurseHasCheckedDeps({ path: depPath, packageJson: depPkgJson, name: depPkgJson.name });
        }));
      }

      const hasCheckedDeps = await recurseHasCheckedDeps(owningPackage);
      shouldLintDirCache.set(cachedFileDir, hasCheckedDeps);
      shouldLintDirCache.set(cachedShouldLintPackage, hasCheckedDeps);
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
      async Program() {
        if (!enableExperimentalAnalysisSkipping)
          return;

        shouldLintFile = await checkShouldLintFile(context.filename);
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
