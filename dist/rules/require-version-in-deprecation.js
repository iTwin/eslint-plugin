/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

/**
 * @import { Rule, Scope } from "eslint"
 */

//Custom rule that enforces version and description for @deprecated

"use strict";

const regexParts = {
  expired: "might be removed in next major version",
  notUntil: "will not be removed until",
};

const deprecatedCommentRegex = new RegExp(
  [
    /@deprecated(?=[\W])(?: in (?<version>\d+(?:\.(?:\d|x)+){1,2}))?/.source,
    `(?: - (?<when>(?:${regexParts.expired})|(?:${regexParts.notUntil} (?<date>[0-9]{4}(?:-[0-9]{2}){2}))))?`,
    /(?:(?<separator>\.[^\S\r\n])?(?:[^\S\r\n]*)?(?<description>(?=[\S]).{5,}))?/.source,
  ].join(),
  "gdu"
);

const validDescriptionRegex = /^[\w\]`]/;

const messages = {
  noDescription: "@deprecated must be followed by deprecation reason and/or alternative API usage required",
  doubleDeprecation: "Multiple @deprecated notes found in the same comment",
  oldDate: `Expired deprecation date was found and should be replaced with "${regexParts.expired}"`,
  noDate: `@deprecated should be followed by either "${regexParts.notUntil} {YYYY-MM-dd}" or "${regexParts.expired}"`,
  noVersion: `@deprecated should be followed by "in {major}.{minor}`,
  noSeparator: "Deprecation reason should be separated from any preceding text by `. `",
  badDescription: `Deprecation reason should match regex ${validDescriptionRegex.source}`,
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

/** @param {Date} date */
function formatDate(date) {
  return `${date.getUTCFullYear()}-${("0" + (date.getUTCMonth() + 1)).slice(-2)}-${("0" + (date.getUTCDate() + 1)).slice(-2)}`;
}

/** @type {Rule.RuleModule} */
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
    return {
      Program(node) {
        let regexMatch;
        for (const comment of node.comments ?? []) {
          let found = 0;
          /** @type {Scope.Scope["block"]} */
          while ((regexMatch = deprecatedCommentRegex.exec(comment.value))) {
            const match = regexMatch;
            if (found === 1) {
              context.report({
                // @ts-expect-error -- comments are not considered nodes but this still works
                node: comment,
                messageId: messageIds.doubleDeprecation,
              });
            }
            found++;
            if (!match?.groups?.description) {
              context.report({
                // @ts-expect-error -- comments are not considered nodes but this still works
                node: comment,
                messageId: messageIds.noDescription,
              });
              continue; // no point in applying any fixes after this - the description will have to be added manually anyway.
            }

            if (context.options[0]?.addVersion && !match.groups?.version) {
              // add version
              context.report({
                // @ts-expect-error -- comments are not considered nodes but this still works
                node: comment,
                messageId: messageIds.noVersion,
                fix: (() => {
                  return (fixer) =>
                    fixer.replaceText(comment, `@deprecated in ${context.options[0].addVersion}${comment.value.substring("@deprecated".length)}`);
                })(),
              });
            }

            // TODO: what if the version is there but not specific enough? e.g. 5.x should be replaced with 5.1

            const currentDate = new Date();

            // This will not work if the version is missing. However, eslint should run the rule in multiple passes if any fixes are applied.
            // So if the above fix is applied, next time it runs, the version will be there.
            if (context.options[0]?.addVersion && !match.groups?.when) {
              // add date
              context.report({
                // @ts-expect-error -- comments are not considered nodes but this still works
                node: comment,
                messageId: messageIds.noDate,
                fix: (() => {
                  if (match.indices?.groups?.version === undefined) return undefined;
                  const versionIndices = match.indices.groups.version;
                  return (fixer) =>
                    fixer.replaceText(
                      comment,
                      // prettier-ignore
                      `${comment.value.substring(0, versionIndices[1])} - ${regexParts.notUntil} ${formatDate(currentDate)}${comment.value.substring(versionIndices[1])}`
                    );
                })(),
              });
            }

            if (context.options[0]?.removeOldDates && match.groups?.date && new Date(match.groups.date) < currentDate) {
              // remove old date
              context.report({
                // @ts-expect-error -- comments are not considered nodes but this still works
                node: comment,
                messageId: messageIds.oldDate,
                fix: (() => {
                  if (match.indices?.groups?.when === undefined) return undefined;
                  const whenIndices = match.indices.groups.when;
                  return (fixer) =>
                    fixer.replaceText(
                      comment,
                      `${comment.value.substring(0, whenIndices[0])}${regexParts.expired}${comment.value.substring(whenIndices[1])}`
                    );
                })(),
              });
            }

            if (match.groups?.description && !validDescriptionRegex.test(match.groups.description)) {
              context.report({
                // @ts-expect-error -- comments are not considered nodes but this still works
                node: commment,
                messageId: messageIds.badDescription,
              });
            }

            if ((match.groups?.version || match.groups?.when) && !match.groups?.separator && match.groups?.description) {
              const description = match.groups.description;
              // add separator
              context.report({
                // @ts-expect-error -- comments are not considered nodes but this still works
                node: comment,
                messageId: messageIds.noSeparator,
                fix: (() => {
                  if (match.indices?.groups?.description === undefined) return undefined;
                  const descriptionIndices = match.indices.groups.description;
                  return (fixer) => fixer.replaceText(comment, `${comment.value.substring(0, descriptionIndices[0])}. ${firstUpper(description)}`);
                })(),
              });
            }
          }
        }
      },
    };
  },
};
