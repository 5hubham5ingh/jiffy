import * as _ from "../justjs/globalConstants.js";
import arg from "../qjs-ext-lib/src/arg.js";
import { FzfRun } from "./fzfRun.js";
import { getMenu, getUserMenu } from "./userMenu.js";
import { ansi } from "../justjs/ansiStyle.js";
import FzfBc from "./fzfBc.js";
import fzfChoose from "./fzfChoose.js";
import { fzfEmojies } from "./fzfEmojis.js";
import { setCommonFzfArgs } from "./utils.js";

// Pre-defined modes
export const predefinedModes = [
  ["Apps", "a"],
  ["Basic calculator", "bc"],
  ["Emojies", "e"],
  ["Jiffy menu", "j"],
];

main();

function main() {
  try {
    OS.ttySetRaw();
    globalThis.USER_ARGUMENTS = parseUserArguments();
    setCommonFzfArgs(USER_ARGUMENTS);
    app();
  } catch (error) {
    if (error instanceof SystemError) error.log(true);
    else {STD.err.puts(
        `State:\n${
          JSON.stringify(USER_ARGUMENTS, null, 2)
        }\n${error.constructor.name}: ${error.message}\n${error.stack}`,
      );}
    STD.exit(1);
  } finally {
    STD.exit(0);
  }
}

function parseUserArguments() {
  // Define the argument names and their corresponding flags
  const args = {
    mode: "--mode", // Defines the mode of operation
    iconSize: "--icon-size", // Defines the icon size
    preset: "--preset", // Defines the UI preset number
    clipboard: "--clipboard",
    printCategory: "--print-category",
    fzfArgs: "--fzf-args", // Defines custom arguments for the fuzzy finder (fzf)
    refresh: "--refresh", // Flag to enable caching of the application list
    terminal: "--terminal", // Wait specified milliseconds before exiting.
    inject: "--inject", // Allows injecting custom JS code at startup
  };

  // Parse the user input arguments using `arg.parser`
  const userArguments = arg.parser({
    [args.mode]: arg.str(predefinedModes[predefinedModes.length - 1][0]).enum([
      ...predefinedModes.flat(),
      ...Object.keys(getUserMenu()),
    ])
      .desc(
        "Set the mode of commands from modes predefined in the config file.",
      ),
    [args.iconSize]: arg.num(5).min(0).desc("App's icon cell size."),
    [args.preset]: arg.str("1").enum(["1", "2", "3", "4"]).desc(
      "Start with UI preset.",
    ),
    [args.clipboard]: arg.str().env("COPY_TO_CLIPBOARD").desc(
      "Clipboard used for pasting the selected emoji.",
    ),
    [args.printCategory]: arg.flag().desc("Print app's category."),
    [args.fzfArgs]: [
      arg.str().desc(
        "Custom arguments for fzf.",
      ),
    ],
    [args.refresh]: arg.flag().desc("Cache the application list."),
    [args.terminal]: arg.str().env("TERMINAL").desc(
      "Default terminal to launch terminal apps.",
    ),
    [args.inject]: arg.str().val("JS").cust(STD.evalScript).desc(
      "Inject JS code to run at startup.",
    ),
    "-m": args.mode, // Short form for --mode
    "-s": args.iconSize, // Short form for --icon-size
    "-p": args.preset, // Short form for --preset
    "-x": args.clipboard, // Short form for --clipboard
    "-c": args.printCategory, // Short form for --print-category
    "-r": args.refresh, // short form for --cache
    "-t": args.terminal,
    "-i": args.inject, // Short form for --inject
  })
    .ex([
      [
        `--fzf-args='--prompt=" "' -c`,
        "Hide prompt and app's category.",
      ],
      [
        '--fzf-args="--preview-window=0" --no-cache',
        "Hide app description and refresh app's list.",
      ],
      [
        `-p 2 -i 'OS.exec(["kitty", "@", "set-spacing", "margin=0"])'`,
        "Change UI preset and inject JS to remove window margin.",
      ],
    ].map(
      ([command, description]) =>
        command.concat(
          "\n",
          ansi.style.grey,
          ansi.style.italic,
          `- ${description}`,
          ansi.style.reset,
        ),
    ))
    .ver("1.0.0")
    .parse();

  // Convert the parsed arguments into an object and return it
  return Object.fromEntries(
    Object.entries(args).map(([key, value]) => [key, userArguments[value]]),
  );
}

export function app() {
  const appMenu = getMenu();

  switch (USER_ARGUMENTS.mode) {
    /* Apps */
    case predefinedModes[0][0]:
    case predefinedModes[0][1]:
      FzfRun(appMenu[predefinedModes[0][0]], predefinedModes[0][0]);
      break;

    /* Basic Calculator */
    case predefinedModes[1][0]:
    case predefinedModes[1][1]:
      FzfBc();
      break;

    /* Emojies picker */
    case predefinedModes[2][0]:
    case predefinedModes[2][1]:
      fzfEmojies();
      break;

    /* Jiffy Menu */
    case predefinedModes[predefinedModes.length - 1][0]:
    case predefinedModes[predefinedModes.length - 1][1]:
      fzfChoose();
      break;

    /* User defined menu */
    default:
      FzfRun(appMenu[USER_ARGUMENTS.mode], USER_ARGUMENTS.mode);
  }
}
