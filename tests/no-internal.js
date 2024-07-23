/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

"use strict";

const path = require("path");
const ESLintTester = require("eslint").RuleTester;
const BentleyESLintPlugin = require("../dist");
const NoInternalESLintRule =
  BentleyESLintPlugin.rules["no-internal"];
const { supportSkippedAndOnlyInTests, dedent } = require("./test-utils");

const fixtureDir = path.join(
  __dirname,
  "fixtures",
  "no-internal",
  "workspace-pkg-1"
);

const ruleTester = new ESLintTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module",
    tsconfigRootDir: fixtureDir,
    shouldCreateDefaultProgram: true,
    project: path.join(fixtureDir, "tsconfig.test.json"),
  },
});

ruleTester.run(
  "no-internal",
  NoInternalESLintRule,
  supportSkippedAndOnlyInTests({
    valid: [
      {
        name: "Internal API from a local file",
        code: `import * as Local from "./local-internal"; Local.internal(); new Local.Internal();`
      },
      {
        name: "Internal API from a local file, and the package name is specified in options",
        code: `import * as Local from "./local-internal"; Local.internal(); new Local.Internal();`,
        options: [{ "checkedPackagePatterns": ["workspace-pkg-1"] }],
      },
      {
        name: "Internal API from an installed dependency that isn't in the @bentley/@itwin scope",
        code: dedent`
          import { internal, public, Internal, Public } from "test-pkg-1";
          public();
          internal();
          new Internal();
          new Internal().publicMethod();
          new Public();
          new Public().internalMethod();
        `
      },
      {
        name: "Internal API from another package in the same workspace",
        code: dedent`
          import { internal, Public } from "workspace-pkg-2";
          internal();
          new Public().internalMethod();
        `
      },
      {
        name: "Internal API from another package in the same workspace, but the package name is not specified",
        code: dedent`
          import { internal, Public } from "workspace-pkg-2";
          internal();
          new Public().internalMethod();
        `,
        options: [{
          "dontAllowWorkspaceInternal": true,
        }],
      },
      {
        name: "Internal API in an itwinjs-core repository package from another itwinjs-core repository package",
        code: dedent`
          import { internal, public, Internal, Public } from "@itwin/test-pkg-2";
          internal();
          public();
          new Internal();
          new Internal().publicMethod();
          new Public();
          new Public().internalMethod();
        `,
        filename: path.join(fixtureDir, "node_modules", "@itwin", "test-pkg-3", "index.d.ts"),
      },
    ],
    invalid: [
      {
        name: "Internal API from an installed dependency in the @bentley/@itwin scope",
        code: dedent`
          import { internal, public, Internal, Public, alpha, beta } from "@itwin/test-pkg-2";
          public();
          internal();
          internal();
          internal();
          alpha();
          beta();
          new Internal();
          new Internal().publicMethod();
          new Public();
          new Public().internalMethod();
        `,
        errors: [
          { message: 'function "internal" is internal.' },
          { message: 'function "internal" is internal.' },
          { message: 'function "internal" is internal.' },
          { message: 'function "alpha" is alpha.'},
          { message: 'class "Internal" is internal.' },
          { message: 'class "Internal" is internal.' },
          { message: 'method "Public.internalMethod" is internal.' },
        ],
      },
      {
        name: "Internal API from an installed dependency, and the package name is specified in options",
        code: dedent`
          import { internal, public, Internal, Public } from "test-pkg-1";
          public();
          internal();
          internal();
          internal();
          new Internal();
          new Internal().publicMethod();
          new Public();
          new Public().internalMethod();
        `,
        options: [{ "checkedPackagePatterns": ["test-pkg-1"] }],
        errors: [
          { message: 'function "internal" is internal.' },
          { message: 'function "internal" is internal.' },
          { message: 'function "internal" is internal.' },
          { message: 'class "Internal" is internal.' },
          { message: 'class "Internal" is internal.' },
          { message: 'method "Public.internalMethod" is internal.' },
        ],
      },
      {
        name: "Alpha and beta APIs, and those tags are specified in options",
        code: dedent`
          import { internal, alpha, beta } from "@itwin/test-pkg-2";
          internal();
          alpha();
          beta();
        `,
        options: [{ "tag": ["alpha", "beta"] }],
        errors: [
          { message: 'function "alpha" is alpha.'},
          { message: 'function "beta" is beta.'},
        ],
      },
      {
        name: "Internal API from another package in the same workspace, and the package name is specified in options",
        code: dedent`
          import { internal, Public } from "workspace-pkg-2";
          internal();
          new Public().internalMethod();
          new Public().internalMethod();
        `,
        options: [{
          "dontAllowWorkspaceInternal": true,
          "checkedPackagePatterns": ["workspace-pkg-2"]
        }],
        errors: [
          { message: 'function "internal" is internal.' },
          { message: 'method "Public.internalMethod" is internal.' },
          { message: 'method "Public.internalMethod" is internal.' }
        ]
      },
      {
        name: "Internal API from another package in the same workspace in the @itwin/@bentley scope",
        code: dedent`
          import { internal, Public } from "@bentley/workspace-pkg-3";
          internal();
          new Public().internalMethod();
        `,
        options: [{ "dontAllowWorkspaceInternal": true }],
        errors: [
          { message: 'function "internal" is internal.' },
          { message: 'method "Public.internalMethod" is internal.' }
        ]
      },
    ],
  })
);
