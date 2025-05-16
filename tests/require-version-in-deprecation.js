/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

"use strict";

const { DateTime } = require("luxon");

const ESLintTester = require("eslint").RuleTester;
const BentleyESLintPlugin = require("../dist");
const rule = BentleyESLintPlugin.rules["require-version-in-deprecation"];
const { supportSkippedAndOnlyInTests, wrapMessageIds: messageIds } = require("./test-utils");

const ruleTester = new ESLintTester({
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      ecmaVersion: 6,
    },
  },
});

ruleTester.run(
  "require-version-in-deprecation",
  rule,
  supportSkippedAndOnlyInTests({
    valid: [
      {
        code: `/**
      * @beta
      * @deprecated in 3.x. Use XYZ instead, see https://www.google.com/ for more details.
      */`,
      },
      {
        code: `/**
        * @deprecated in 3.x. Use XYZ instead
        * @beta
        */`,
      },
      { code: `// @deprecated in 3.6. Use XYZ instead.` },
      { code: `/* @deprecated in 12.x. Use xyz instead. */` },
      {
        code: `// @deprecated in 2.19.  Use xyz instead
        function canWeUseFunctions() {}`,
      },
      {
        code: `// @deprecated in 3.6. Use xyz instead.
        class canWeUseAClass {};`,
      },
      {
        code: `/* @deprecated in 2.x. Use XYZ instead */
        let canWeUseArrowFunction = () => {};`,
      },
      {
        code: `/**
        * @deprecated in 3.x. Please use XYZ.
        */
        export interface canWeUseInterface {}`,
      },
      {
        code: `/* @deprecated in 2.x. Use xyz instead. */
        namespace canWeUseNamespaces {}`,
      },
      {
        code: `// @deprecated in 3.6. Use XYZ instead.
        export enum canWeUseEnum {}`,
      },
      {
        code: `
        interface BackendHubAccess {
          /**
           * download a v1 checkpoint
           * @deprecated in 3.x. Here's a description.
           * @internal
           */
          downloadV1Checkpoint: (arg: CheckpointArg) => Promise<ChangesetIndexAndId>;
        }
        `,
      },
      { code: `// @deprecated in 2.x. Use [[InternalDocRef]] instead` },
      { code: `/** @deprecated in 3.x. Use [ExternalDocRef]($package) instead */` },
      { code: `/** @deprecated in 2.1 - will not be removed until 2022-01-01. Use [[methodB]] instead */` },
      { code: `/** @deprecated Use [[methodB]] instead */` },
      { code: `/** @deprecated in 3.2. Use [[methodB]] instead */` },
    ],
    invalid: [
      {
        code: `/**
        * @beta
        * @deprecated
        */`,
        errors: messageIds([rule.messageIds.noDescription]),
      },
      {
        code: `/**
        * @deprecated Use [[A]] instead
        * @deprecated Use [[B]] instead
        */`,
        errors: messageIds([rule.messageIds.doubleDeprecation]),
      },
      {
        code: `// @deprecated in 3.x.x.x. Use [[A]]`,
        // The error can be a bit misleading. Since versions can only have 3 parts, the rule assumes that the last `.x` is part of the description.
        // However, it does give the developer a hint about what exactly is going wrong by splitting the version and inserting a space.
        errors: messageIds([rule.messageIds.noSeparator]),
        output: "// @deprecated in 3.x.x. .x. Use [[A]]",
        // This test is there only to illustrate some quirky edge cases the rule might run into and what we should expect from its behavior.
        // There's no need to guarantee the exact same behavior when updating the rule.
        skip: true,
      },
      {
        code: `/** @deprecated. Use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.noSeparator]),
        output: `/** @deprecated Use [[methodB]] instead */`,
      },
      {
        code: `/** @deprecated in 3.2 use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.noSeparator]),
        output: `/** @deprecated in 3.2. Use [[methodB]] instead */`,
      },
      {
        code: `/** @deprecated in 3.2 - use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.noSeparator]),
        output: `/** @deprecated in 3.2. - use [[methodB]] instead */`,
      },
      {
        // testing output from the above test case...
        code: `/** @deprecated in 3.2. - use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.badDescription]),
        output: `/** @deprecated in 3.2. Use [[methodB]] instead */`,
      },
      {
        code: `/** @deprecated - will not be removed until 2022-01-01. Use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.noVersion]),
      },
    ],
  }),
);

ruleTester.run(
  "require-version-in-deprecation with removeOldDates",
  rule,
  supportSkippedAndOnlyInTests({
    valid: [
      { code: `/** @deprecated in 2.1 - will not be removed until 3022-01-01. Use [[methodB]] instead */` },
      { code: `/** @deprecated Use [[methodB]] instead */` },
      { code: `/** @deprecated in 3.2. Use [[methodB]] instead */` },
      { code: `/** @deprecated in 2.1 - might be removed in next major version. Use [[methodB]] instead */` },
    ].map((testCase) => ({
      ...testCase,
      options: [{ removeOldDates: true }],
    })),
    invalid: [
      {
        code: `/**
        * @beta
        * @deprecated
        */`,
        errors: messageIds([rule.messageIds.noDescription]),
      },
      {
        code: `/**
        * @deprecated Use [[A]] instead
        * @deprecated Use [[B]] instead
        */`,
        errors: messageIds([rule.messageIds.doubleDeprecation]),
      },
      {
        code: `/** @deprecated. Use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.noSeparator]),
        output: `/** @deprecated Use [[methodB]] instead */`,
      },
      {
        code: `/** @deprecated in 3.2 use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.noSeparator]),
        output: `/** @deprecated in 3.2. Use [[methodB]] instead */`,
      },
      {
        code: `/** @deprecated in 3.2 - use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.noSeparator]),
        output: `/** @deprecated in 3.2. - use [[methodB]] instead */`,
      },
      {
        // testing output from the above test case...
        code: `/** @deprecated in 3.2. - use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.badDescription]),
        output: `/** @deprecated in 3.2. Use [[methodB]] instead */`,
      },
      {
        code: `/** @deprecated in 2.1 - will not be removed until 2022-01-01. Use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.oldDate]),
        output: `/** @deprecated in 2.1 - might be removed in next major version. Use [[methodB]] instead */`,
      },
      {
        code: `/** @deprecated - will not be removed until 2022-01-01. Use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.noVersion, rule.messageIds.oldDate]),
        output: `/** @deprecated - might be removed in next major version. Use [[methodB]] instead */`,
      },
      {
        code: `/** @deprecated - might be removed in next major version. Use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.noVersion]),
      },
      {
        code: `/** @deprecated - will not be removed until 3022-01-01. Use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.noVersion]),
      },
    ].map((testCase) => ({ ...testCase, options: [{ removeOldDates: true }] })),
  }),
);

const targetDate = DateTime.now().plus({ year: 1 }).toFormat("yyyy-MM-dd");

ruleTester.run(
  "require-version-in-deprecation with addVersion",
  rule,
  supportSkippedAndOnlyInTests({
    valid: [
      { code: `/** @deprecated in 2.1 - will not be removed until 3022-01-01. Use [[methodB]] instead */` },
      { code: `/** @deprecated in 10.0 - will not be removed until ${targetDate}. Use [[methodB]] instead */` },
      { code: `/** @deprecated in 3.2 - will not be removed until ${targetDate}. Use [[methodB]] instead */` },
      {
        code: `/** 
                * @deprecated in 3.0 - will not be removed until ${targetDate}. Use [[B]]
                * @public
                */`,
      },
    ].map((testCase) => ({
      ...testCase,
      options: [{ addVersion: "10.0" }],
    })),
    invalid: [
      {
        code: `/**
        * @beta
        * @deprecated
        */`,
        errors: messageIds([rule.messageIds.noDescription]),
      },
      // added inner array for collapsing - these are all part of one chain (will be fixed in one `eslint --fix` run)
      ...[
        {
          code: `/**
        * @deprecated Use [[A]] instead
        * @deprecated Use [[B]] instead
        */`,
          errors: messageIds([
            rule.messageIds.noVersion,
            rule.messageIds.noDate,
            rule.messageIds.doubleDeprecation,
            rule.messageIds.noVersion,
            rule.messageIds.noDate,
          ]),
          output: `/**
        * @deprecated in 10.0 Use [[A]] instead
        * @deprecated Use [[B]] instead
        */`,
        },
        {
          code: `/**
        * @deprecated in 10.0 Use [[A]] instead
        * @deprecated Use [[B]] instead
        */`,
          errors: messageIds([
            rule.messageIds.noDate,
            rule.messageIds.noSeparator,
            rule.messageIds.doubleDeprecation,
            rule.messageIds.noVersion,
            rule.messageIds.noDate,
          ]),
          output: `/**
        * @deprecated in 10.0 - will not be removed until ${targetDate} Use [[A]] instead
        * @deprecated Use [[B]] instead
        */`,
        },
        {
          code: `/**
        * @deprecated in 10.0 - will not be removed until ${targetDate} Use [[A]] instead
        * @deprecated Use [[B]] instead
        */`,
          errors: messageIds([rule.messageIds.noSeparator, rule.messageIds.doubleDeprecation, rule.messageIds.noVersion, rule.messageIds.noDate]),
          output: `/**
        * @deprecated in 10.0 - will not be removed until ${targetDate}. Use [[A]] instead
        * @deprecated Use [[B]] instead
        */`,
        },
        {
          code: `/**
        * @deprecated in 10.0 - will not be removed until ${targetDate}. Use [[A]] instead
        * @deprecated Use [[B]] instead
        */`,
          errors: messageIds([rule.messageIds.doubleDeprecation, rule.messageIds.noVersion, rule.messageIds.noDate]),
          output: `/**
        * @deprecated in 10.0 - will not be removed until ${targetDate}. Use [[A]] instead
        * @deprecated in 10.0 Use [[B]] instead
        */`,
        },
        {
          code: `/**
        * @deprecated in 10.0 - will not be removed until ${targetDate}. Use [[A]] instead
        * @deprecated in 10.0 Use [[B]] instead
        */`,
          errors: messageIds([rule.messageIds.doubleDeprecation, rule.messageIds.noDate, rule.messageIds.noSeparator]),
          output: `/**
        * @deprecated in 10.0 - will not be removed until ${targetDate}. Use [[A]] instead
        * @deprecated in 10.0 - will not be removed until ${targetDate} Use [[B]] instead
        */`,
        },
        {
          code: `/**
        * @deprecated in 10.0 - will not be removed until ${targetDate}. Use [[A]] instead
        * @deprecated in 10.0 - will not be removed until ${targetDate} Use [[B]] instead
        */`,
          errors: messageIds([rule.messageIds.doubleDeprecation, rule.messageIds.noSeparator]),
          output: `/**
        * @deprecated in 10.0 - will not be removed until ${targetDate}. Use [[A]] instead
        * @deprecated in 10.0 - will not be removed until ${targetDate}. Use [[B]] instead
        */`, // CORRECT
        },
      ],
      {
        code: `/**
        * @deprecated in 10.0 - will not be removed until ${targetDate}. Use [[A]] instead
        * @deprecated in 10.0 - will not be removed until ${targetDate}. Use [[B]] instead
        */`,
        errors: messageIds([rule.messageIds.doubleDeprecation]),
      },
      {
        code: `/** @deprecated. Use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.noVersion, rule.messageIds.noDate, rule.messageIds.noSeparator]),
        output: `/** @deprecated in 10.0. Use [[methodB]] instead */`,
      },
      {
        code: `/** @deprecated in 10.0. Use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.noDate]),
        output: `/** @deprecated in 10.0 - will not be removed until ${targetDate}. Use [[methodB]] instead */`, // CORRECT
      },
      {
        code: `/** @deprecated in 10.0 use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.noDate, rule.messageIds.noSeparator]),
        output: `/** @deprecated in 10.0 - will not be removed until ${targetDate} use [[methodB]] instead */`,
      },
      {
        code: `/** @deprecated in 10.0 - will not be removed until ${targetDate} use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.noSeparator]),
        output: `/** @deprecated in 10.0 - will not be removed until ${targetDate}. Use [[methodB]] instead */`, // CORRECT
      },
      {
        code: `/** @deprecated in 10.0 - use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.noDate, rule.messageIds.noSeparator]),
        output: `/** @deprecated in 10.0 - will not be removed until ${targetDate} - use [[methodB]] instead */`,
      },
      {
        code: `/** @deprecated in 10.0 - will not be removed until ${targetDate} - use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.noSeparator]),
        output: `/** @deprecated in 10.0 - will not be removed until ${targetDate}. - use [[methodB]] instead */`,
      },
      {
        code: `/** @deprecated in 10.0 - will not be removed until ${targetDate}. - use [[methodB]] instead */`,
        errors: messageIds([rule.messageIds.badDescription]),
        output: `/** @deprecated in 10.0 - will not be removed until ${targetDate}. Use [[methodB]] instead */`, // CORRECT
      },
      {
        code: `/** 
                * @deprecated in 3.0 - use [[B]]
                * @public
                */`,
        errors: messageIds([rule.messageIds.noDate, rule.messageIds.noSeparator]),
        output: `/** 
                * @deprecated in 3.0 - will not be removed until ${targetDate} - use [[B]]
                * @public
                */`,
      },
      {
        code: `/** 
                * @deprecated in 3.0 - will not be removed until ${targetDate} - use [[B]]
                * @public
                */`,
        errors: messageIds([rule.messageIds.noSeparator]),
        output: `/** 
                * @deprecated in 3.0 - will not be removed until ${targetDate}. - use [[B]]
                * @public
                */`,
      },
      {
        code: `/** 
                * @deprecated in 3.0 - will not be removed until ${targetDate}. - use [[B]]
                * @public
                */`,
        errors: messageIds([rule.messageIds.badDescription]),
        output: `/** 
                * @deprecated in 3.0 - will not be removed until ${targetDate}. Use [[B]]
                * @public
                */`, // CORRECT
      },
    ].map((testCase) => ({ ...testCase, options: [{ addVersion: "10.0" }] })),
  }),
);
