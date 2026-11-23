/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

"use strict";

const assert = require("assert");
const path = require("path");
const { ESLint } = require("eslint");
const { configs } = require("../dist");

const fixtureDir = path.join(__dirname, "fixtures", "configs");

async function lintComponent(config) {
  const eslint = new ESLint({
    cwd: fixtureDir,
    overrideConfigFile: true,
    overrideConfig: [
      { files: ["**/*.tsx"] },
      config,
      { languageOptions: { parserOptions: { tsconfigRootDir: fixtureDir } } },
    ],
  });
  const [result] = await eslint.lintFiles(["component.tsx"]);
  assert.deepStrictEqual(
    result.messages.filter((message) => message.fatal),
    [],
  );
  return result.messages.map((message) => message.ruleId);
}

describe("configs", function () {
  this.timeout(60000);

  it("noNodeTypes reports node built-ins with the import/ rule id", async function () {
    assert.ok((await lintComponent(configs.noNodeTypes)).includes("import/no-nodejs-modules"));
  });

  it("iTwinjsRecommendedConfig runs", async function () {
    await lintComponent(configs.iTwinjsRecommendedConfig);
  });

  it("jsdocConfig runs", async function () {
    await lintComponent(configs.jsdocConfig);
  });

  it("uiConfig runs the react and jsx-a11y rules", async function () {
    const ruleIds = await lintComponent(configs.uiConfig);
    assert.ok(ruleIds.includes("react/no-direct-mutation-state"));
    assert.ok(ruleIds.includes("jsx-a11y/alt-text"));
  });
});
