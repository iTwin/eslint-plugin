/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

"use strict";

/** @import { RuleTester } from "eslint" */

module.exports = {
  /**
   * allow specifying `only` and `skip` properties for easier debugging
   * @param {{
			valid: Array<RuleTester.ValidTestCase & {only?: boolean, skip?: boolean}>;
			invalid: Array<RuleTester.InvalidTestCase & {only?: boolean, skip?: boolean}>;
     }} obj
   * @returns {{
			valid: Array<string | RuleTester.ValidTestCase>;
			invalid: RuleTester.InvalidTestCase[];
     }}
   */

  supportSkippedAndOnlyInTests(obj) {
    const hasOnly = obj.valid.some((test) => Boolean(test.only)) || obj.invalid.some((test) => Boolean(test.only));
    const keepTest = (test) => (hasOnly ? test.only : !test.skip);
    const stripExtraTags = (test) => {
      delete test.skip;
      delete test.only;
      return test;
    };
    return {
      valid: obj.valid.filter(keepTest).map(stripExtraTags),
      invalid: obj.invalid.filter(keepTest).map(stripExtraTags),
    };
  },

  /**
   * Removes leading indentation from template literals.
   * Supports interpolations by combining strings and values.
   *
   * @param {TemplateStringsArray} strings - The template literal strings.
   * @param {...any} values - The interpolated values.
   * @returns {string} - The dedented string.
   */
  dedent(strings, ...values) {
    const fullString = strings.reduce((result, str, i) => {
      return result + str + (values[i] || "");
    }, "");
    const codeLines = fullString.split("\n");
    if (codeLines.length <= 1) return fullString;
    const leftPadding = codeLines[1].match(/[\t ]+/)?.[0];
    if (!leftPadding) return codeLines.slice(1, -1).join("\n");
    return codeLines
      .slice(1, -1)
      .map((l) => l.substring(leftPadding.length))
      .join("\n");
  },

  /**
   * wraps an array of message ids in the format that RuleTester expects
   * @param {string[]} messages
   * @returns {RuleTester.TestCaseError[]}
   */
  wrapMessageIds(messages) {
    return messages.map((msg) => ({ messageId: msg }));
  },
};
