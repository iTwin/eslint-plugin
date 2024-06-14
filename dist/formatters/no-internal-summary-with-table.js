/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
"use strict";

const tableCreator = require('./no-internal-summary-table-creator');

module.exports = function (results) {
  const noInternalRuleId = '@itwin/no-internal';
  const filteredMessages = results.flatMap(result =>
    result.messages
      .filter(message => message.ruleId === noInternalRuleId)
      .map(message => ({ ...message, filePath: result.filePath }))
  );
  return tableCreator(filteredMessages, noInternalRuleId);
};
