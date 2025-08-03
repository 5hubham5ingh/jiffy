import "../justjs/globalConstants.js";
import arg from "../qjs-ext-lib/src/arg.js";
import launcher from "./launcher.js";
import run from "./run.js";
import getUserMenu from "./userMenu.js";
import { ansi } from "../justjs/ansiStyle.js";
import basicCalculator from "./basicCalculator.js";
import jiffyMenu from "./jiffyMenu.js";
import emojis from "./emojis.js";
import { createShortcutNames } from "./utils.js";
import keymaps from "./keymaps.js";
import { colorPicker } from "./colours.js";

// Application modes
export const modes = [];
let exitStatus = 0;
const lockFile = "/tmp/jiffy.lock";
let lockFileFd = null;

export const predefinedMenuItem = [
  "Apps",
  "Basic calculator",
  "Emojis",
  "Jiffy menu",
  "Colors",
  "Key maps",
];
await main();

async function main() {
  try {
    globalThis.USER_ARGUMENTS = await parseUserArguments();
    if (USER_ARGUMENTS.singleInstance) {
      lockFileFd = OS.open(
        lockFile,
        OS.O_CREAT | OS.O_EXCL | OS.O_WRONLY,
        0o600,
      );
      if (lockFileFd < 0) {
        throw new SystemError("Failed to start", "Already running.");
      }
    }
    OS.ttySetRaw();
    await app();
  } catch (error) {
    if (error instanceof SystemError) error.log(true);
    else {
      STD.err.puts(
        `${error?.constructor?.name}: ${error?.message}\n${error?.stack}`,
      );
      STD.err.puts(USER_ARGUMENTS);
    }
    exitStatus = 1;
  } finally {
    if (lockFileFd && lockFileFd > 0) {
      OS.close(lockFileFd);
      OS.remove(lockFile);
    }
    print(ansi.style.reset);
    STD.exit(exitStatus);
  }
}

async function parseUserArguments() {
  // Define the argument names and their corresponding flags
  const args = {
    mode: "--mode", // Defines the mode of operation
    singleInstance: "--single-instance",
    iconSize: "--icon-size", // Defines the icon size
    preset: "--preset", // Defines the UI preset number
    clipboard: "--clipboard",
    printCategory: "--print-category",
    fzfArgs: "--fzf-args", // Defines custom arguments for the fuzzy finder (fzf)
    refresh: "--refresh", // Flag to enable caching of the application list
    terminal: "--terminal",
    modKey: "--mod-key",
    inject: "--inject", // Allows injecting custom JS code at startup
  };

  const userMenu = await getUserMenu();

  predefinedMenuItem.push(...Object.keys(userMenu));
  modes.push(...createShortcutNames(
    predefinedMenuItem,
  ));

  // Parse the user input arguments using `arg.parser`
  const userArguments = arg.parser({
    [args.mode]: arg.str(modes[3][0]).enum(
      modes.flat(),
    )
      .desc(
        "Set the mode of commands from modes predefined in the config file.",
      ),
    [args.singleInstance]: arg.flag().desc("Ensure single instance."),
    [args.iconSize]: arg.num(5).min(0).desc("App's icon cell size."),
    [args.preset]: arg.str("1").enum(["1", "2", "3"]).desc(
      "Start with UI preset.",
    ),
    [args.clipboard]: arg.str("wl-copy").env("COPY_TO_CLIPBOARD").desc(
      "Clipboard used for pasting the selected emoji.",
    ),
    [args.printCategory]: arg.flag(true).desc("Print app's category."),
    [args.fzfArgs]: [
      arg.str().desc(
        "Custom arguments for fzf.",
      ),
    ],
    [args.refresh]: arg.flag().desc("Cache the application list."),
    [args.terminal]: arg.str("kitty -1 --hold").env("TERMINAL").desc(
      "Default terminal to launch terminal apps.",
    ),
    [args.modKey]: arg.str("ctrl").enum([
      "ctrl",
      "alt",
    ])
      .desc(
        "Mod key for shortcut key-binds.",
      ),
    [args.inject]: arg.str().val("JS").cust(STD.evalScript).desc(
      "Inject JS code to run at startup.",
    ),
    "-m": args.mode, // Short form for --mode
    "-1": args.singleInstance, // Ensures single instance of the app
    "-s": args.iconSize, // Short form for --icon-size
    "-p": args.preset, // Short form for --preset
    "-x": args.clipboard, // Short form for --clipboard
    "-c": args.printCategory, // Short form for --print-category
    "-r": args.refresh, // short form for --cache
    "-t": args.terminal,
    "-k": args.modKey,
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
    .ver("1.6.0")
    .parse();

  // Convert the parsed arguments into an object and return it
  return Object.fromEntries(
    Object.entries(args).map(([key, value]) => [key, userArguments[value]]),
  );
}

export async function app() {
  switch (USER_ARGUMENTS.mode) {
    /* Launcher */
    case modes[0][0]:
    case modes[0][1]:
      await launcher();
      break;

    /* Basic Calculator */
    case modes[1][0]:
    case modes[1][1]:
      await basicCalculator();
      break;

    /* Emojies picker */
    case modes[2][0]:
    case modes[2][1]:
      await emojis();
      break;

    /* Jiffy Menu */
    case modes[3][0]:
    case modes[3][1]:
      await jiffyMenu();
      break;

    /* Color picker */
    case modes[4][0]:
    case modes[4][1]:
      await colorPicker();
      break;

    /* Key maps */
    case modes[5][0]:
    case modes[5][1]:
      await keymaps();
      break;

    /* User defined menu */
    default:
      await run();
  }
}
