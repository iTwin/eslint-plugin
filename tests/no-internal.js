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
  "no-internal"
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
      { code: `import { internal, public, Internal, Public } from "test-pkg-1";` },
      { code: `import * as Local from "./local-internal"; Local.internal(); new Local.Internal();` },
      {
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
    ],
    invalid: [
      {
        code: dedent`
          import { internal, public, Internal, Public } from "@itwin/test-pkg-2";
          public();
          internal();
          new Internal();
          new Internal().publicMethod();
          new Public();
          new Public().internalMethod();
        `,
        errors: [
          { message: 'function "internal" is internal.' },
          { message: 'class "Internal" is internal.' },
          { message: 'class "Internal" is internal.' },
          { message: 'method "Public.internalMethod" is internal.' }
        ]
      },
      {
        code: dedent`
          import { internal, public, Internal, Public } from "test-pkg-1";
          public();
          internal();
          new Internal();
          new Internal().publicMethod();
          new Public();
          new Public().internalMethod();
        `,
        options: [{ "checkedPackagePatterns": ["test-pkg-1"] }],
        errors: [
          { message: 'function "internal" is internal.' },
          { message: 'class "Internal" is internal.' },
          { message: 'class "Internal" is internal.' },
          { message: 'method "Public.internalMethod" is internal.' },
        ]
      },
    ],
  })
);
