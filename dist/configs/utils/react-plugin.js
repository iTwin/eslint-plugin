/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

const reactPlugin = require("eslint-plugin-react");

// eslint-plugin-react 7.37.5 calls `context.getFilename()` to detect the React version. ESLint 10 removed
// that method (use `context.filename`). Until a release of eslint-plugin-react supports ESLint 10
// (https://github.com/jsx-eslint/eslint-plugin-react/pull/4022), give its rules a `getFilename` that forwards to `filename`.
// This file can be deleted, and ui.js can require "eslint-plugin-react" directly, once that release is out.
function withGetFilename(context) {
  if (typeof context.getFilename === "function")
    return context;
  return Object.create(context, { getFilename: { value: () => context.filename } });
}

const rules = {};
for (const [name, rule] of Object.entries(reactPlugin.rules)) {
  rules[name] = { ...rule, create: (context) => rule.create(withGetFilename(context)) };
}

module.exports = { ...reactPlugin, rules };
