/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
function getParserServices(context) {
  const errorMessage = "Could not find type information";
  if (
    !context.sourceCode.parserServices ||
    !context.sourceCode.parserServices.program ||
    !context.sourceCode.parserServices.esTreeNodeToTSNodeMap ||
    !context.sourceCode.parserServices.tsNodeToESTreeNodeMap
  ) {
    throw new Error(errorMessage);
  }
  const hasFullTypeInformation = context.sourceCode.parserServices.hasFullTypeInformation;
  if (hasFullTypeInformation === false) { // consider undefined == true for backwards compatibility
    throw new Error(errorMessage);
  }

  return context.sourceCode.parserServices;
}

module.exports = { getParserServices };