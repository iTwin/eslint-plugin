/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

// Writing all of these eslint rules in javascript so we can run them before the build step

"use strict";

const { getParserServices } = require("./utils/parser");
const findup = require("findup-sync");
const { readFileSync } = require("fs");
const path = require("path");
const ts = require("typescript");

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
 */
module.exports = {
  meta: {
    /** @type {'problem' | 'suggestion' | 'layout' | undefined} */
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
     * Returns true if the internal tag is a violation within the package that owns the specified file.
     * @param {string} filePath
     */
    function owningPackageIsCheckedPackage(filePath) {
      let owningPackageJson;
      let lintedPackageJson;
      
      // Find package.json of the file being linted
      const lintedPackageJsonPath = findup("package.json", { cwd: context.filename });
      if (lintedPackageJsonPath !== null) {
        lintedPackageJson = JSON.parse(readFileSync(lintedPackageJsonPath, "utf8"));
      }

      // Find package.json of the owning package
      const owningPackageJsonPath = findup("package.json", { cwd: filePath });
      if (owningPackageJsonPath !== null) {
        owningPackageJson = JSON.parse(readFileSync(owningPackageJsonPath, "utf8"));
      }

      // If both packages are in the itwinjs-core repository, allow internal tags
      if (
        typeof owningPackageJson?.repository !== "string" &&
        owningPackageJson?.repository?.url === "https://github.com/iTwin/itwinjs-core.git" &&
        owningPackageJson?.repository?.url === lintedPackageJson?.repository?.url
      ) {
        return false;
      }

      // Finally, see if package name matches the checked package patterns
      return (owningPackageJson !== undefined && owningPackageJson.name !== undefined && pathContainsCheckedPackage(owningPackageJson.name));
    }

    /**
     * Returns true if the internal tag is a violation within a file.
     * By default `@itwin` and `@bentley` packages are included, see the `checkedPackagePatterns` option.
     * @param declaration 
     */
    function isCheckedFile(declaration) {
      if (!declaration)
        return false;
      const fileName = getFileName(declaration.parent);
      const isWorkspaceLinkedDependency = !dirContainsPath(parserServices.program.getCommonSourceDirectory(), fileName);

      if (fileName.includes("node_modules")) {
        return owningPackageIsCheckedPackage(fileName);
      }

      if (allowWorkspaceInternal) {
        // If allowWorkspaceInternal, internal tags are allowed in workspace dependencies
        // so no need to check if fileName is local file or workspace dep
        return false;
      } else {
        return isWorkspaceLinkedDependency && owningPackageIsCheckedPackage(fileName);
      }
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
            // Violation key to track and report violations on a per-usage basis
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
