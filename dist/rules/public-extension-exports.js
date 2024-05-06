/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

// Writing all of these eslint rules in javascript so we can run them before the build step

"use strict";

const { getParserServices } = require("./utils/parser");
const ts = require("typescript");
const fs = require("fs");

/** converts the numeric typescript enum value for ts.SyntaxKind to a string. Defaults to "real". */
const getSyntaxKindFriendlyName = (syntaxKind) => {
  const syntaxKindFriendlyNames = {
    [ts.SyntaxKind.ClassDeclaration]: "real",
    [ts.SyntaxKind.EnumDeclaration]: "enum",
    [ts.SyntaxKind.InterfaceDeclaration]: "interface",
    [ts.SyntaxKind.TypeAliasDeclaration]: "type",
  };
  return syntaxKindFriendlyNames[syntaxKind] || "real";
};

let firstRun = true;

/**
 * This rule prevents the exporting of extension APIs without denoted release tags.
 */
module.exports = {
  meta: {
    /** @type {'problem' | 'suggestion' | 'layout' | undefined} */
    type: "problem",
    docs: {
      description:
        "Prevent the exporting of extension APIs that do not contain a release tag.",
      category: "TypeScript",
    },
    messages: {
      missingExtensionReleaseTag: `Extension exports must be annotated with both an @extensions and @public tag. Please review the tags for "{{name}}".`,
      namespace: `Namespace "{{name}}" requires an @extensions tag because one of its members is tagged for @extensions.`,
    },
    schema: [
      {
        type: "object",
        additionalProperties: false,
        properties: {
          releaseTags: {
            type: "array",
            uniqueItems: true,
            items: {
              type: "string",
              enum: ["public", "beta", "alpha", "internal"],
            },
          },
          outputApiFile: {
            type: "boolean",
          },
        },
      },
    ],
  },

  create(context) {
    const parserServices = getParserServices(context);

    const releaseTags = (context.options.length > 0 &&
      context.options[0].releaseTags) || [
      "public",
      "beta",
      "alpha",
      "internal",
    ];
    const extensionsTag = "extensions";
    const publicTag = "public";

    const outputApiFile =
      (context.options.length > 0 && context.options[0].outputApiFile) || false;
    const apiFilePath = "./lib/GeneratedExtensionApi.csv";

    if (firstRun) {
      firstRun = false;
      if (outputApiFile) {
        // create/clear output api file on first run
        fs.writeFileSync(apiFilePath, "");
      }
    }

    function addToApiList(declaration, tags) {
      if (!outputApiFile) {
        return;
      }
      const validReleaseTag = tags.find((tag) =>
        releaseTags.includes(tag.tagName.escapedText)
      );

      const createCsvString = (name, kind) =>
        `${name},${kind},${validReleaseTag}\n`;

      const names =
        declaration.kind === ts.SyntaxKind.VariableStatement
          ? declaration.declarationList.declarations.map(
              (d) => d.symbol.escapedName
            )
          : [declaration.symbol.escapedName];

      names.forEach((name) => {
        const kind = getSyntaxKindFriendlyName(declaration.kind);
        const csvString = createCsvString(name, kind);
        fs.writeFileSync(apiFilePath, csvString, { flag: "a" });
      });
    }

    function getName(declaration) {
      let name;
      if (declaration.kind === ts.SyntaxKind.Constructor)
        name = declaration.parent?.symbol?.escapedName;
      else {
        name = declaration.symbol?.escapedName;
        const parentSymbol = getParentSymbolName(declaration);
        if (parentSymbol) name = `${parentSymbol}.${name}`;
      }
      return name;
    }

    function getParentSymbolName(declaration) {
      const escapedName = declaration.parent?.symbol?.escapedName;
      if (!escapedName?.startsWith('"')) return escapedName;

      return undefined;
    }

    // reports an error if namespace doesn't have a valid @extensions tag but a member does
    function checkNamespaceTags(declaration, node) {
      const tags = ts.getJSDocTags(declaration.parent);

      for (const tag of tags) {
        if (tag.tagName.escapedText === extensionsTag) {
          return;
        }
      }

      const declarationName = ts.getNameOfDeclaration(declaration.parent);
      const name = declarationName ? declarationName.getFullText() : "";

      context.report({
        node,
        messageId: "namespace",
        data: {
          name: name.trim(), // namespace name is parsed with extra whitespace
        },
      });
    }

    // returns true if it was added to the API without error
    function checkJsDoc(declaration, node) {
      if (!declaration || !declaration.jsDoc) return;

      const tags = ts.getJSDocTags(declaration);

      function tagEscapedText(tag) {
        return tag?.tagName?.escapedText;
      }

      const hasExtensionTag = tags.find(
        (tag) => tagEscapedText(tag) === extensionsTag
      );
      const hasPublicTag = tags.some(
        (tag) => tagEscapedText(tag) === publicTag
      );

      const validTags = hasExtensionTag
        ? releaseTags.filter((t) => t !== "internal")
        : [...releaseTags];

      const name = getName(declaration);
      const commonReport = {
        node,
        data: {
          kind: getSyntaxKindFriendlyName(declaration.kind),
          name,
          releaseTags: validTags.join(", "),
        },
      };

      if (hasExtensionTag) {
        addToApiList(declaration, tags);
        if (!hasPublicTag)
          context.report({
            ...commonReport,
            messageId: "missingExtensionReleaseTag",
          });
        return true;
      }
      return false;
    }

    function isNamespace(declaration) {
      return (
        ts.isModuleBlock(declaration) &&
        ts.isModuleDeclaration(declaration.parent)
      );
    }

    function check(declaration, node) {
      if (!declaration) return;

      if (checkJsDoc(declaration, node)) {
        if (declaration.parent && isNamespace(declaration.parent))
          checkNamespaceTags(declaration.parent, node);
      }
    }

    function checkFunction(node) {
      const tsCall = parserServices.esTreeNodeToTSNodeMap.get(node);
      if (!tsCall) return;
      check(tsCall, node);
    }

    return {
      TSNamespaceExportDeclaration: checkFunction,
      TSExportAssignment: checkFunction,
      TSExportKeyword: checkFunction,
      ExportDefaultDeclaration: checkFunction,
      ExportNamedDeclaration: checkFunction,
      ExportAllDeclaration: checkFunction,
      ExportSpecifier: checkFunction,
    };
  },
};
