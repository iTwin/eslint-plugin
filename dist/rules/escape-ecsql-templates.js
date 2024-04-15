/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

// Writing all of these eslint rules in javascript so we can run them before the build step

"use strict";

const { getParserServices } = require("./utils/parser");
const ts = require("typescript");
const path = require("path");
const WasmTreeSitter = require("web-tree-sitter");

const treeSitterSqlWasmModulePath = path.join(__dirname, "./tree-sitter-sql.wasm");

const treeSitterSqlPromise = (async () => {
  await WasmTreeSitter.init();
  const language = await WasmTreeSitter.Language.load(treeSitterSqlWasmModulePath);
  return language;
})();

const parserPromise = treeSitterSqlPromise.then((treeSitterSql) => {
  const parser = new WasmTreeSitter();
  parser.setLanguage(treeSitterSql);
  return parser;
});

const queriedPropsQueryPromise = treeSitterSqlPromise.then((treeSitterSql) =>
  treeSitterSql.query(
    '(select_clause_body [(identifier) (alias (identifier) . "AS" . (identifier))] @col)'
  )
);

/**
 * This rule prevents the use of APIs with specific release tags.
 */
module.exports = {
  meta: {
    /** @type {'problem' | 'suggestion' | 'layout' | undefined} */
    type: "problem",
    docs: {
      description: "Expressions in ECSQL format strings should be escaped",
      category: "ECSQL",
    },
    messages: {
      forbidden: `expressions in ECSQL format strings should be escaped`,
    },
  },

  create(context) {
    const parserServices = getParserServices(context);
    const typeChecker = parserServices.program.getTypeChecker();

    return {
      TaggedTemplateExpression(node) {
        const tsCall = parserServices.esTreeNodeToTSNodeMap.get(node);
      },

      TSTypeReference(node) {
        const tsCall = parserServices.esTreeNodeToTSNodeMap.get(node);
        if (!tsCall)
          return;

        const resolved = typeChecker.getTypeAtLocation(tsCall);
        if (resolved)
          checkWithParent(resolved.declaration, node);
      },
    };
  }
}
