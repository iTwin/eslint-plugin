/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

"use strict";

const path = require("path");
const ESLintTester = require("eslint").RuleTester;
const BentleyESLintPlugin = require("../dist");

const packageDir = path.join(__dirname, "fixtures", "no-internal", "workspace-pkg-1");

const ruleTester = new ESLintTester({
  languageOptions: {
    ecmaVersion: 6,
    sourceType: "module",
  },
});

ruleTester.run("import-within-package", BentleyESLintPlugin.rules["import-within-package"], {
  valid: [
    { code: `import { a } from "../b";`, filename: path.join(packageDir, "src", "file.ts") },
    { code: `import { a } from "./b";`, filename: path.join(packageDir, "src", "file.ts") },
    { code: `import { a } from "some-package";`, filename: path.join(packageDir, "src", "file.ts") },
  ],
  invalid: [
    {
      code: `import { a } from "../../other-package/src/b";`,
      filename: path.join(packageDir, "src", "file.ts"),
      errors: [{ message: "Imports beyond package boundary are not allowed" }],
    },
  ],
});
