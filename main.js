import arg from "../qjs-ext-lib/src/arg.js";
import * as _ from "../justjs/globalConstants.js";

function main() {
  const args = {
    mode: "--mode",
    iconSize: "--icon-size",
    preset: "--preset",
    fzfArgs: "--fzf-args",
    inject: "--inject",
  };

  const userArguments = arg.parser({
    [args.mode]: arg.str().enum(["Launcher"]).desc(
      "Set the mode of commands from modes predifined in the config file.",
    ),
    [args.iconSize]: arg.num().min(0).desc("App's icon cell size."),
    [args.preset]: arg.num().enum([1, 2, 3, 4]).desc("Start with UI preset."),
    [args.fzfArgs]: arg.str().desc("Custome arguments for fzf."),
    [args.inject]: arg.str().val("JS").cust(STD.evalScript).desc(
      "Inject js code to run at startup.",
    ),
    "-s": args.iconSize,
    "-p": args.preset,
    "-i": args.inject,
  });
}
