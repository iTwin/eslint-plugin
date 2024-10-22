const rules = require("./rules");
const version = require("../package.json").version;

module.exports = {
  meta: {
    name: "@itwin/eslint-plugin",
    version,
  },
  rules,
};