/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

const rules = require("./rules/index.js");
const configs = require("./configs/index.js");

module.exports = {
  ...configs,
  ...rules
};