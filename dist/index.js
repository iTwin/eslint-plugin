/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
const plugin = require("./plugin");
const configs = require("./configs");

module.exports = {
  configs,
  ...plugin
};