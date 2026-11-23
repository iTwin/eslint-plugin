import * as React from "react";
import * as fs from "fs";

/** A component that trips one rule from each plugin the configs register. */
export class Component extends React.Component<{}, { count: number }> {
  public override state = { count: 0 };

  public override render() {
    this.state.count = fs.readFileSync("a").length;
    return <img src="a.png" />;
  }
}
