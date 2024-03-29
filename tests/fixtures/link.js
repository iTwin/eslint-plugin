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

  fs.mkdirSync(path.join(
    __dirname,
    "no-internal/workspace-pkg-1/node_modules/@bentley"
  ));

  fs.symlinkSync(
    path.normalize("../../../workspace-pkg-3"),
    path.join(
      __dirname,
      "no-internal/workspace-pkg-1/node_modules/@bentley/workspace-pkg-3"
    ),
    "junction"
  );
}
try {
  linkFixtureNoInternal();
} catch (err) {
  if (err.code === "EEXIST")
    console.log("[INFO] Symlink already exists, no additional work required.");
}
