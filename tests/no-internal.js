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

const commonErrorMessages = {
  functionInternal: 'function "internal" is internal.',
  classInternal: 'class "Internal" is internal.',
  methodInternal: 'method "Public.internalMethod" is internal.',
  variableInternal: 'variable "internalVariable" is internal.',
};

const getInternalInvalidTestCode = (importFrom) => dedent`
  import { internal, public, Internal, Public, internalVariable } from "${importFrom}";
  import * as Internals from "${importFrom}";
  import { internal as publicFunction } from "${importFrom}";
  Internals.internal();
  Internals.Internal();
  Internals.internalVariable;
  public();
  internal();
  internal();
  internal();
  new Internal();
  new Internal().publicMethod();
  new Public();
  new Public().internalMethod();
  class ExtendedInternal extends Internal {};
  class ImplementsInternal implements Internal {};
  if (variable instanceof Internal) {}
  function doSomething(construct: new () => Internal) {}
  doSomething(Internal);
  let someVariable: Internal;
  const _x = internalVariable;
`;

const internalInvalidErrorMessages = [
  { message: commonErrorMessages.functionInternal },
  { message: commonErrorMessages.classInternal },
  { message: commonErrorMessages.variableInternal},
  { message: commonErrorMessages.functionInternal},
  { message: commonErrorMessages.functionInternal },
  { message: commonErrorMessages.classInternal },
  { message: commonErrorMessages.variableInternal},
  { message: commonErrorMessages.functionInternal },
  { message: commonErrorMessages.functionInternal },
  { message: commonErrorMessages.functionInternal },
  { message: commonErrorMessages.classInternal },
  { message: commonErrorMessages.classInternal },
  { message: commonErrorMessages.methodInternal },
  { message: commonErrorMessages.classInternal },
  { message: commonErrorMessages.classInternal },
  { message: commonErrorMessages.classInternal },
  { message: commonErrorMessages.classInternal },
  { message: commonErrorMessages.classInternal },
  { message: commonErrorMessages.classInternal },
];

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
        code: getInternalInvalidTestCode("@itwin/test-pkg-2"),
        errors: internalInvalidErrorMessages,
      },
      {
        // package name is specified to disallow @internal
        code: getInternalInvalidTestCode("test-pkg-1"),
        options: [{ "checkedPackagePatterns": ["test-pkg-1"] }],
        errors: internalInvalidErrorMessages,
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
          { message: commonErrorMessages.functionInternal },
          { message: commonErrorMessages.functionInternal },
          { message: commonErrorMessages.methodInternal },
          { message: commonErrorMessages.methodInternal }
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
          { message: commonErrorMessages.functionInternal },
          { message: commonErrorMessages.functionInternal },
          { message: commonErrorMessages.methodInternal }
        ]
      },
    ],
  })
);
