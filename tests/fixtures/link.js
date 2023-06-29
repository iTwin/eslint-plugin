// Can't reliably have symlinks via git on windows .
// so create them in this script called before running tests

const path = require("path");
const fs = require("fs");

function linkFixtureNoInternal() {
  fs.symlinkSync(
    path.normalize("../../workspace-pkg-2"),
    path.join(
      __dirname,
      "no-internal/workspace-pkg-1/node_modules/workspace-pkg-2"
    ),
    "junction"
  );
}

linkFixtureNoInternal();

// console.log("TARGET RELATIVE: " + path.normalize("./no-internal/workspace-pkg-test"));
// console.log("TARGET ABSOLUTE: " + path.join(
//   __dirname,
//   path.normalize("./no-internal/workspace-pkg-test")
// ));
// console.log("PATH ABSOLUTE: " + path.join(
//   __dirname,
//   "no-internal/node_modules/workspace-pkg-test"
// ));
console.log("before tests link.js ran");