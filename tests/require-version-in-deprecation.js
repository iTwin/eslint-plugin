/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

"use strict";

const ESLintTester = require("eslint").RuleTester;
const BentleyESLintPlugin = require("../dist");
const rule = BentleyESLintPlugin.rules["require-version-in-deprecation"];
const { supportSkippedAndOnlyInTests } = require("./test-utils");

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
      { code: `/** @deprecated - will not be removed until 2022-01-01. Use [[methodB]] instead */` },
      { code: `/** @deprecated Use [[methodB]] instead */` },
    ],
    invalid: [
      {
        code: `/**
        * @beta
        * @deprecated
        */`,
        errors: [{ messageId: rule.messageIds.noDescription }],
      },
      {
        code: `/**
        * @deprecated Use [[A]] instead
        * @deprecated Use [[B]] instead
        */`,
        errors: [{ messageId: rule.messageIds.doubleDeprecation }],
      },
      {
        code: `// @deprecated in 3.x.x.x. Use [[A]]`,
        // The error can be a bit misleading. Since versions can only have 3 parts, the rule assumes that the last `.x` is part of the description.
        // However, it does give the developer a hint about what exactly is going wrong by splitting the version and inserting a space.
        errors: [{ messageId: rule.messageIds.noSeparator }],
        output: "// @deprecated in 3.x.x. .x. Use [[A]]",
        // this test is only for illustration. There's no need to guarantee the exact same behavior when updating the rule.
        skip: true,
      },
      {
        code: `/** @deprecated. Use [[methodB]] instead */`,
        errors: [{ messageId: rule.messageIds.noSeparator }],
        output: `/** @deprecated Use [[methodB]] instead */`,
      },
      {
        code: `/** @deprecated in 3.2 use [[methodB]] instead */`,
        errors: [{ messageId: rule.messageIds.noSeparator }],
        output: `/** @deprecated in 3.2. Use [[methodB]] instead */`,
      },
      {
        code: `/** @deprecated in 3.2 - use [[methodB]] instead */`,
        errors: [{ messageId: rule.messageIds.noSeparator }],
        output: `/** @deprecated in 3.2. - use [[methodB]] instead */`,
      },
      {
        // testing output from the above test case...
        code: `/** @deprecated in 3.2. - use [[methodB]] instead */`,
        errors: [{ messageId: rule.messageIds.badDescription }],
      },
    ],
  })
);
