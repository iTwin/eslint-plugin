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
        code: `
        /**
        * @beta
        * @deprecated in 3.0. Use XYZ instead, see https://www.google.com/ for more details.
        */
        enum ModelType {}`,
      },
      {
        code: `
        /**
        * @deprecated in 3.0. Use XYZ instead
        * @beta
        */
        interface ModelType {}`,
      },
      {
        code: `
        class A {
          // @deprecated in 3.6. Use XYZ instead.
          public B: int;
        }`,
      },
      {
        code: `
        export enum ModelTypes {
          /* @deprecated in 12.0. Use xyz instead. */
          Test = 1,
        }`,
      },
      {
        code: `
        // @deprecated in 2.19.  Use xyz instead
        function canWeUseFunctions() {}`,
      },
      {
        code: `
        // @deprecated in 3.6. Use xyz instead.
        class canWeUseAClass {};`,
      },
      {
        code: `
        /* @deprecated in 2.0. Use XYZ instead */
        let canWeUseArrowFunction = () => {};`,
      },
      {
        code: `
        /**
        * @deprecated in 3.0. Please use XYZ.
        */
        export interface canWeUseInterface {}`,
      },
      {
        code: `
        /* @deprecated in 2.0. Use xyz instead. */
        namespace canWeUseNamespaces {}`,
      },
      {
        code: `
        // @deprecated in 3.6. Use XYZ instead.
        export enum canWeUseEnum {}`,
      },
      {
        code: `
        interface BackendHubAccess {
        /**
         * download a v1 checkpoint
         * @deprecated in 3.0. Here's a description.
         * @internal
         */
        downloadV1Checkpoint: (arg: CheckpointArg) => Promise<ChangesetIndexAndId>;
        }
        `,
      },
      {
        code: `
        // @deprecated in 2.0. Use [[InternalDocRef]] instead
        export function TestFunc(){}`,
      },
      {
        code: `
        /** @deprecated in 3.0. Use [ExternalDocRef]($package) instead */
        export type testType = () => {};`,
      },
      {
        code: `
        class ConnectionHandler {
          /** @deprecated in 2.1 - will not be removed until after 2022-01-01. Use [[methodB]] instead */
          constructor() {};
        }`,
      },
      {
        code: `
        /** @deprecated Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `
        /** @deprecated in 3.2. Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `
        /** @deprecated in 3.2. use [[methodB]] instead */
        enum TestEnum {}`,
      },
    ],
    invalid: [
      {
        code: `/**
        * @beta
        * @deprecated
        */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.noDescription]),
      },
      {
        code: `/**
        * @deprecated Use [[A]] instead
        * @deprecated Use [[B]] instead
        */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.doubleDeprecation]),
      },
      {
        code: `// @deprecated in 3.x.x.x. Use [[A]]
        enum TestEnum {}`,
        // The error can be a bit misleading. Since versions can only have 3 parts, the rule assumes that the last `.x` is part of the description.
        // However, it does give the developer a hint about what exactly is going wrong by splitting the version and inserting a space.
        errors: messageIds([rule.messageIds.noSeparator, rule.messageIds.badDescription]),
        output: "// @deprecated in 3.x.x. .x. Use [[A]]",
        // This test is there only to illustrate some quirky edge cases the rule might run into and what we should expect from its behavior.
        // There's no need to guarantee the exact same behavior when updating the rule.
        skip: true,
      },
      {
        code: `/** @deprecated. Use [[methodB]] instead */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.noSeparator]),
        output: `/** @deprecated Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `/** @deprecated in 3.2 use [[methodB]] instead */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.noSeparator]),
        output: `/** @deprecated in 3.2. Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `/** @deprecated in 3.2 - use [[methodB]] instead */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.noSeparator, rule.messageIds.badDescription]),
        output: `/** @deprecated in 3.2. Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `/** @deprecated - will not be removed until after 2022-01-01. Use [[methodB]] instead */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.noVersion]),
      },
      {
        code: `/**
        * @beta
        * @deprecated in 3.x. Use XYZ instead, see https://www.google.com/ for more details.
        */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.badVersion]),
      },
      {
        code: `/**
        * @deprecated in 3.x. Use XYZ instead
        * @beta
        */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.badVersion]),
      },
      {
        code: `/* @deprecated in 12.x. Use xyz instead. */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.badVersion]),
      },
      {
        code: `/* @deprecated in 2.x. Use XYZ instead */
        let canWeUseArrowFunction = () => {};`,
        errors: messageIds([rule.messageIds.badVersion]),
      },
      {
        code: `/**
        * @deprecated in 3.x. Please use XYZ.
        */
        export interface canWeUseInterface {}`,
        errors: messageIds([rule.messageIds.badVersion]),
      },
      {
        code: `/* @deprecated in 2.x. Use xyz instead. */
        namespace canWeUseNamespaces {}`,
        errors: messageIds([rule.messageIds.badVersion]),
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
        errors: messageIds([rule.messageIds.badVersion]),
      },
    ],
  }),
);

ruleTester.run(
  "require-version-in-deprecation with removeOldDates",
  rule,
  supportSkippedAndOnlyInTests({
    valid: [
      {
        code: `/** @deprecated in 2.1 - will not be removed until after 3022-01-01. Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `/** @deprecated Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `/** @deprecated in 3.2. Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `/** @deprecated in 2.1 - might be removed in next major version. Use [[methodB]] instead */
        enum TestEnum {}`,
      },
    ].map((testCase) => ({
      ...testCase,
      options: [{ removeOldDates: true }],
    })),
    invalid: [
      {
        code: `/**
        * @beta
        * @deprecated
        */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.noDescription]),
      },
      {
        code: `/**
        * @deprecated Use [[A]] instead
        * @deprecated Use [[B]] instead
        */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.doubleDeprecation]),
      },
      {
        code: `/** @deprecated. Use [[methodB]] instead */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.noSeparator]),
        output: `/** @deprecated Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `/** @deprecated in 3.2 use [[methodB]] instead */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.noSeparator]),
        output: `/** @deprecated in 3.2. Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `/** @deprecated in 3.2 - use [[methodB]] instead */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.noSeparator, rule.messageIds.badDescription]),
        output: `/** @deprecated in 3.2. Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `/** @deprecated in 2.1 - will not be removed until after 2022-01-01. Use [[methodB]] instead */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.oldDate]),
        output: `/** @deprecated in 2.1 - might be removed in next major version. Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `/** @deprecated - will not be removed until after 2022-01-01. Use [[methodB]] instead */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.noVersion, rule.messageIds.oldDate]),
        output: `/** @deprecated - might be removed in next major version. Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `/** @deprecated - might be removed in next major version. Use [[methodB]] instead */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.noVersion]),
      },
      {
        code: `/** @deprecated - will not be removed until after 3022-01-01. Use [[methodB]] instead */
        enum TestEnum {}`,
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
      {
        code: `/** @deprecated in 2.1 - will not be removed until after 3022-01-01. Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `/** @deprecated in 10.0 - will not be removed until after ${targetDate}. Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `/** @deprecated in 3.2 - will not be removed until after ${targetDate}. Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `
        /** 
        * @deprecated in 3.0 - will not be removed until after ${targetDate}. Use [[B]]
        * @public
        */
        enum TestEnum {}`,
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
        */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.noDescription]),
      },
      {
        code: `/**
        * @deprecated Use [[A]] instead
        * @deprecated Use [[B]] instead
        */
        enum TestEnum {}`,
        errors: messageIds([
          rule.messageIds.noVersion,
          rule.messageIds.noDate,
          rule.messageIds.doubleDeprecation,
          rule.messageIds.noVersion,
          rule.messageIds.noDate,
        ]),
        output: `/**
        * @deprecated in 10.0 - will not be removed until after ${targetDate}. Use [[A]] instead
        * @deprecated Use [[B]] instead
        */
        enum TestEnum {}`,
      },
      {
        code: `/**
        * @deprecated in 10.0 - will not be removed until after ${targetDate}. Use [[A]] instead
        * @deprecated Use [[B]] instead
        */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.doubleDeprecation, rule.messageIds.noVersion, rule.messageIds.noDate]),
        output: `/**
        * @deprecated in 10.0 - will not be removed until after ${targetDate}. Use [[A]] instead
        * @deprecated in 10.0 - will not be removed until after ${targetDate}. Use [[B]] instead
        */
        enum TestEnum {}`,
      },
      {
        code: `/**
        * @deprecated in 10.0 - will not be removed until after ${targetDate}. Use [[A]] instead
        * @deprecated in 10.0 - will not be removed until after ${targetDate}. Use [[B]] instead
        */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.doubleDeprecation]),
      },
      {
        code: `/** @deprecated. Use [[methodB]] instead */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.noVersion, rule.messageIds.noDate, rule.messageIds.noSeparator]),
        output: `/** @deprecated in 10.0 - will not be removed until after ${targetDate}. Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `/** @deprecated in 10.0 use [[methodB]] instead */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.noDate, rule.messageIds.noSeparator]),
        output: `/** @deprecated in 10.0 - will not be removed until after ${targetDate}. Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `/** @deprecated in 10.0 - use [[methodB]] instead */
        enum TestEnum {}`,
        errors: messageIds([rule.messageIds.noDate, rule.messageIds.noSeparator, rule.messageIds.badDescription]),
        output: `/** @deprecated in 10.0 - will not be removed until after ${targetDate}. Use [[methodB]] instead */
        enum TestEnum {}`,
      },
      {
        code: `/** 
                * @deprecated in 3.0 - use [[B]]
                * @public
                */
                enum TestEnum {}`,
        errors: messageIds([rule.messageIds.noDate, rule.messageIds.noSeparator, rule.messageIds.badDescription]),
        output: `/** 
                * @deprecated in 3.0 - will not be removed until after ${targetDate}. Use [[B]]
                * @public
                */
                enum TestEnum {}`,
      },
    ].map((testCase) => ({ ...testCase, options: [{ addVersion: "10.0" }] })),
  }),
);

const previewTargetDate = DateTime.now().plus({ month: 3 }).toFormat("yyyy-MM-dd");

ruleTester.run(
  "require-version-in-deprecation test @preview tag",
  rule,
  supportSkippedAndOnlyInTests({
    valid: [
      {
        code: `
        /* @preview */
        class ConnectionHandler {
          /*
          * Start a connection with the server
          * @deprecated in 7.3.2 - will not be removed until after ${previewTargetDate}. Use [[B]]
          */
          public static start(): void {};
        }`,
      },
      {
        code: `
        // @preview
        class A {
          // @deprecated in 10.0 - will not be removed until after ${previewTargetDate}. Use [[B]]
          public B: int;
        }`,
      },
      {
        code: `
        // @preview
        export enum ModelTypes {
          // @deprecated in 10.0 - will not be removed until after ${previewTargetDate}. Use [[B]]
          Test = 1,
        }`,
      },
      {
        code: `
        // @preview
        interface ModelType {
          // @deprecated in 10.0 - will not be removed until after ${previewTargetDate}. Use [[B]]
          test: string;
        }`,
      },
      {
        code: `
        // @deprecated in 10.0 - will not be removed until after ${previewTargetDate}. Use [[B]]
        // @preview
        export type testType = () => {};`,
      },
      {
        code: `
        /**
         * @deprecated in 10.0 - will not be removed until after ${previewTargetDate}. Use [[B]]
         * @preview
         */
        type testType = () => {};`,
      },
    ].map((testCase) => ({
      ...testCase,
      options: [{ addVersion: "10.0" }],
    })),
    invalid: [
      {
        code: `
        // @preview
        class A {
          // @deprecated in 10.0.0. Use [[B]]
          public B: int;
        }`,
        errors: messageIds([rule.messageIds.noDate]),
        output: `
        // @preview
        class A {
          // @deprecated in 10.0.0 - will not be removed until after ${previewTargetDate}. Use [[B]]
          public B: int;
        }`,
      },
      {
        code: `
        // @preview
        export enum ModelTypes {
          // @deprecated in 10.0. Use [[B]]
          Test = 1,
        }`,
        errors: messageIds([rule.messageIds.noDate]),
        output: `
        // @preview
        export enum ModelTypes {
          // @deprecated in 10.0 - will not be removed until after ${previewTargetDate}. Use [[B]]
          Test = 1,
        }`,
      },
      {
        code: `
        // @preview
        interface ModelType {
          // @deprecated in 10.0. Use [[B]]
          test: string;
        }`,
        errors: messageIds([rule.messageIds.noDate]),
        output: `
        // @preview
        interface ModelType {
          // @deprecated in 10.0 - will not be removed until after ${previewTargetDate}. Use [[B]]
          test: string;
        }`,
      },
      {
        code: `
        // @deprecated in 10.0. Use [[B]]
        // @preview
        export type testType = () => {};`,
        errors: messageIds([rule.messageIds.noDate]),
        output: `
        // @deprecated in 10.0 - will not be removed until after ${previewTargetDate}. Use [[B]]
        // @preview
        export type testType = () => {};`,
      },
      {
        code: `
        /**
         * @deprecated in 10.0. Use [[B]]
         * @preview
         */
        type testType = () => {};`,
        errors: messageIds([rule.messageIds.noDate]),
        output: `
        /**
         * @deprecated in 10.0 - will not be removed until after ${previewTargetDate}. Use [[B]]
         * @preview
         */
        type testType = () => {};`,
      },
    ].map((testCase) => ({ ...testCase, options: [{ addVersion: "10.0" }] })),
  }),
);
