// Can't reliably have symlinks via git on windows .
// so create them in this script called before running tests

const path = require("path");
const fs = require("fs");

function tryLink(src, dest, type) {
  try {
    fs.symlinkSync(src, dest, type);
  } catch (err) {
    if (err.code !== "EEXIST")
      throw err;
    console.warn("Ignoring link already exists error", err.message);
  }
}

function linkFixtureNoInternal() {
  tryLink(
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
  ), { recursive: true });

  tryLink(
    path.normalize("../../../workspace-pkg-3"),
    path.join(
      __dirname,
      "no-internal/workspace-pkg-1/node_modules/@bentley/workspace-pkg-3"
    ),
    "junction"
  );
}

linkFixtureNoInternal();
