/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/**
 * @import { Rule, Scope, AST } from "eslint"
 */

//Custom rule that enforces version and description for @deprecated

"use strict";

const { DateTime } = require("luxon");

const regexParts = {
  expired: "might be removed in next major version",
  notUntil: "will not be removed until after",
};

const deprecatedCommentRegex = new RegExp(
  [
    /@deprecated(?=[\W])(?: in (?<version>\d+(?:\.(?:\d|x)+){1,2}))?/.source,
    `(?: - (?<when>(?:${regexParts.expired})|(?:${regexParts.notUntil} (?<date>[0-9]{4}(?:-[0-9]{2}){2}))))?`,
    /(?:(?<separator>\.[^\S\r\n])?(?:[^\S\r\n]*)?(?<description>(?=[\S]).{5,}))?/.source,
  ].join(""),
  "gdu",
);

const previewRegex = new RegExp("@preview");

const validDescriptionRegex = /^[\w\]`]/;

const messages = {
  noDescription: "@deprecated must be followed by deprecation reason and/or alternative API usage required",
  doubleDeprecation: "Multiple @deprecated notes found in the same comment",
  oldDate: `Expired deprecation date was found and should be replaced with "${regexParts.expired}"`,
  noDate: `@deprecated should be followed by either "${regexParts.notUntil} {YYYY-MM-dd}" or "${regexParts.expired}"`,
  noVersion: `@deprecated should be followed by "in {major}.{minor}`,
  noSeparator:
    "Deprecation reason should be separated from any preceding text by `. ` ONLY if there is a version or other information before the description",
  badDescription: `Deprecation reason should match regex ${validDescriptionRegex.source.replace("\\\\", "\\")}`,
  badVersion: "Version numbers should be complete - no 'x' allowed",
};

/** @type {typeof messages} */
const messageIds = Object.keys(messages).reduce((obj, key) => {
  obj[key] = key;
  return obj;
}, {});

/** @param {string} str */
function firstUpper(str) {
  return `${str[0].toUpperCase()}${str.substring(1)}`;
}

/**
 * @param {Rule.RuleFixer} fixer
 * @param {AST.Program["comments"][0]} comment
 * @param {string} newText
 */
function wrapComment(fixer, comment, newText) {
  // @ts-expect-error -- comments are not considered nodes but this still works
  return fixer.replaceText(comment, comment.type === "Block" ? `/*${newText}*/` : `//${newText}`);
}

/** @type {Rule.RuleModule & {messageIds: typeof messageIds}} */
module.exports = {
  meta: {
    type: "problem",
    messages,
    fixable: "whitespace",
    schema: [
      {
        type: "object",
        properties: {
          removeOldDates: {
            type: "boolean",
          },
          addVersion: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    let sourceCode = context.sourceCode;

    function hasPreviewComment(node) {
      const comments = sourceCode.getCommentsBefore(node);
      return comments.some((comment) => previewRegex.test(comment.value));
    }

    /**
     * Apply lint rule on the comments of provided node
     * @param {Rule.Node} mainNode
     */
    function lintCommentsOfNode(mainNode) {
      for (const comment of sourceCode.getCommentsBefore(mainNode)) {
        let regexMatch;
        let found = 0;
        /** @type {Rule.Node} */
        // @ts-expect-error -- comments are not considered nodes but this still works
        const node = comment;
        /** @type {Scope.Scope["block"]} */
        while ((regexMatch = deprecatedCommentRegex.exec(comment.value))) {
          const match = regexMatch;
          if (found === 1) {
            context.report({
              node,
              messageId: messageIds.doubleDeprecation,
            });
          }
          found++;
          if (!match.groups?.description) {
            context.report({
              node,
              messageId: messageIds.noDescription,
            });
            continue; // no point in applying any fixes after this - the description will have to be added manually anyway.
          }

          let noVersion = false;
          let addDate = false;
          let oldDate = false;
          let addSeparator = false;
          let removeSeparator = false;
          let badDescription = false;
          let isPreview = false;
          if (!match.groups?.version) {
            // the version is missing
            if (context.options[0]?.addVersion || match.groups?.when) {
              // either the options require having a version, or the deprecation date is already there, in both cases the version should also be there.
              noVersion = true;
            }
          }

          if (match.groups?.version?.includes("x")) {
            context.report({
              node,
              messageId: messageIds.badVersion,
            });
          }

          if (context.options[0]?.addVersion && !match.groups?.when) {
            // add date
            addDate = true;

            // check for parents with @preview tag only if needed to add the date
            const ancestors = sourceCode.getAncestors(mainNode);
            isPreview = ancestors.some((ancestor) => hasPreviewComment(ancestor));
          }

          const now = DateTime.now();
          const currentDate = now.toFormat("yyyy-MM-dd");
          let targetDate;
          if (isPreview) {
            targetDate = now.plus({ month: 3 }).toFormat("yyyy-MM-dd");
          } else {
            targetDate = now.plus({ year: 1 }).toFormat("yyyy-MM-dd");
          }

          if (context.options[0]?.removeOldDates && match.groups?.date && match.groups.date < currentDate) {
            // remove old date
            oldDate = true;
          }

          if (match.groups?.description && !validDescriptionRegex.test(match.groups.description)) badDescription = true;

          if ((match.groups?.version || match.groups?.when) && !match.groups?.separator && match.groups?.description) addSeparator = true;
          else if (!(match.groups?.version || match.groups?.when) && match.groups?.separator && match.groups?.description) removeSeparator = true;

          const oldDescription = match.groups?.description?.trimStart() ?? "";
          const newDescription = firstUpper(oldDescription.replace(/^-\s*/, ""));
          const newComment =
            comment.value.substring(0, match.index) +
            "@deprecated" +
            (noVersion && context.options[0]?.addVersion
              ? ` in ${context.options[0].addVersion}`
              : match.groups?.version
              ? ` in ${match.groups.version}`
              : "") +
            (addDate
              ? ` - ${regexParts.notUntil} ${targetDate}`
              : oldDate
              ? ` - ${regexParts.expired}`
              : match.groups?.when
              ? ` - ${match.groups.when}`
              : "") +
            (addDate || oldDate || match.groups?.when || noVersion || match.groups?.version ? "." : "") +
            ` ${newDescription}` +
            comment.value.substring(match.index + match[0].length);

          /** @param {Rule.RuleFixer} fixer */
          const fix = newComment !== comment.value ? (fixer) => wrapComment(fixer, comment, newComment) : undefined;
          if (noVersion) context.report({ node, messageId: messageIds.noVersion, fix });
          if (addDate) context.report({ node, messageId: messageIds.noDate, fix });
          if (oldDate) context.report({ node, messageId: messageIds.oldDate, fix });
          if (addSeparator || removeSeparator) context.report({ node, messageId: messageIds.noSeparator, fix });
          if (badDescription) context.report({ node, messageId: messageIds.badDescription, fix });
        }
      }
    }

    return {
      ClassDeclaration(node) {
        lintCommentsOfNode(node);
      },
      FunctionDeclaration(node) {
        lintCommentsOfNode(node);
      },
      MethodDefinition(node) {
        lintCommentsOfNode(node);
      },
      TSEnumDeclaration(node) {
        lintCommentsOfNode(node);
      },
      TSInterfaceDeclaration(node) {
        lintCommentsOfNode(node);
      },
      PropertyDefinition(node) {
        lintCommentsOfNode(node);
      },
      TSEnumMember(node) {
        lintCommentsOfNode(node);
      },
      TSPropertySignature(node) {
        lintCommentsOfNode(node);
      },
      TSTypeAliasDeclaration(node) {
        lintCommentsOfNode(node);
      },
      ExportNamedDeclaration(node) {
        lintCommentsOfNode(node);
      },
      VariableDeclaration(node) {
        lintCommentsOfNode(node);
      },
      TSModuleDeclaration(node) {
        lintCommentsOfNode(node);
      },
    };
  },
  messageIds,
};
