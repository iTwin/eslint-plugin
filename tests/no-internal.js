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
  languageOptions: {
    parser: require("@typescript-eslint/parser"),
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts*'],
        defaultProject: path.join(fixtureDir, "tsconfig.test.json"),
      },
      ecmaVersion: 6,
      sourceType: "module",
      tsconfigRootDir: fixtureDir,
    },
  },
});

ruleTester.run(
  "no-internal",
  NoInternalESLintRule,
  supportSkippedAndOnlyInTests({
    valid: [
      {
        // local import
        code: `import * as Local from "./local-internal"; Local.internal(); new Local.Internal();`
      },
      {
        // local import and package name is specified
        code: `import * as Local from "./local-internal"; Local.internal(); new Local.Internal();`,
        options: [{ "checkedPackagePatterns": ["workspace-pkg-1"] }],
      },
      {
        // not a bentley/itwin scope
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
        // other package in workspace allowed
        code: dedent`
          import { internal, Public } from "workspace-pkg-2";
          internal();
          new Public().internalMethod();
        `
      },
      {
        // other package in workspace not allowed, but name not specified
        code: dedent`
          import { internal, Public } from "workspace-pkg-2";
          internal();
          new Public().internalMethod();
        `,
        options: [{
          "dontAllowWorkspaceInternal": true,
        }],
      },
    ],
    invalid: [
      {
        // itwin scope
        code: dedent`
          import { internal, public, Internal, Public } from "@itwin/test-pkg-2";
          public();
          internal();
          internal();
          internal();
          new Internal();
          new Internal().publicMethod();
          new Public();
          new Public().internalMethod();
        `,
        errors: [
          { message: 'function "internal" is internal.' },
          { message: 'function "internal" is internal.' },
          { message: 'function "internal" is internal.' },
          { message: 'class "Internal" is internal.' },
          { message: 'class "Internal" is internal.' },
          { message: 'method "Public.internalMethod" is internal.' }
        ]
      },
      {
        // package name is specified to disallow @internal
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
        ]
      },
      {
        // other package in workspace & package name is specified to disallow @internal
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
        // other package in workspace & itwin/bentley scope
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
