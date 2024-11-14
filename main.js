import * as _ from "../justjs/globalConstants.js";
import arg from "../qjs-ext-lib/src/arg.js";
import { notify } from "../justjs/utils.js";
import { fzf } from "./fzf.js";
import { getMenu, getUserMenu } from "./menu.js";
import { ansi } from "../justjs/ansiStyle.js";
import { wait } from "../qjs-ext-lib/src/timers.js";

await main();

/**
 * Main function that sets up global arguments, parses user inputs, and calls the app function.
 * @returns {Promise<void>} A promise that resolves when the main process is complete.
 */
async function main() {
  try {
    /**
     * Define and initialize the global `USER_ARGUMENTS` object. This object will hold user-provided arguments
     * for various configuration options, such as mode, icon size, and custom scripts.
     * The `parseUserArguments()` function is called to populate this object with parsed arguments.
     */
    globalThis.USER_ARGUMENTS = {
      pLimit: 4, // Default limit for parallel execution
      disableNotification: false, // Default flag to enable notifications
      ...parseUserArguments(), // Merge parsed user arguments into this object
    };

    // Call the `app` function to start the application logic
    await app(USER_ARGUMENTS.mode);
  } catch (error) {
    if (error instanceof SystemError) error.log(true);
    else throw error;
  }
}

/**
 * Parses command-line arguments passed to the script.
 * Defines accepted argument types and provides default values.
 * @returns {import("./types.d.ts").UserArguments} An object containing the parsed user arguments.
 */
function parseUserArguments() {
  // Define the argument names and their corresponding flags
  const args = {
    mode: "--mode", // Defines the mode of operation
    iconSize: "--icon-size", // Defines the icon size
    preset: "--preset", // Defines the UI preset number
    printCategory: "--print-category",
    fzfArgs: "--fzf-args", // Defines custom arguments for the fuzzy finder (fzf)
    cache: "--cache", // Flag to enable caching of the application list
    terminal: "--terminal", // Wait specified miliseconds before exiting.
    inject: "--inject", // Allows injecting custom JS code at startup
  };

  // Parse the user input arguments using `arg.parser`
  const userArguments = arg.parser({
    [args.mode]: arg.str("Apps").enum(["Apps", ...Object.keys(getUserMenu())])
      .desc(
        "Set the mode of commands from modes predefined in the config file.",
      ),
    [args.iconSize]: arg.num(5).min(0).desc("App's icon cell size."),
    [args.preset]: arg.str("1").enum(["1", "2", "3"]).desc(
      "Start with UI preset.",
    ),
    [args.printCategory]: arg.flag(false).desc("Print app's category."),
    [args.fzfArgs]: [
      arg.str().desc(
        "Custom arguments for fzf.",
      ),
    ],
    [args.cache]: arg.flag(true).desc("Cache the application list."),
    [args.terminal]: arg.str().env("TERMINAL").desc(
      "Default terminal to launch terminal apps.",
    ),
    [args.inject]: arg.str().val("JS").cust(STD.evalScript).desc(
      "Inject JS code to run at startup.",
    ),
    "-m": args.mode, // Short form for --mode
    "-s": args.iconSize, // Short form for --icon-size
    "-p": args.preset, // Short form for --preset
    "-c": args.printCategory, // Short form for --print-category
    "-f": args.fzfArgs, // Short form for --fzf-args
    "-r": args.cache, // short form for --cache
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
    .ver("0.0.0-alpha.1")
    .parse();

  // Convert the parsed arguments into an object and return it
  return Object.fromEntries(
    Object.entries(args).map(([key, value]) => [key, userArguments[value]]),
  );
}

/**
 * Starts the application based on the provided menu name.
 * This function selects an app from the app menu, checks if it should be run in a terminal,
 * and executes the app. If the app execution fails, it sends a notification.
 *
 * @param {string} [menuName] - The name of the menu to select the application from (optional).
 * @returns {Promise<void>} A promise that resolves once the app is launched or failed.
 */
async function app(menuName) {
  // Retrieve the menu (e.g., list of apps) using the `getMenu()` function
  const appMenu = getMenu();

  // Use fuzzy finder (fzf) to select the desired app from the menu
  const selectedApp = fzf(appMenu[menuName], menuName);
  if (!selectedApp) return;

  // Initialize an array to hold the command that will be executed
  const execCmd = [];

  // If the selected app requires a terminal to run, get the terminal executable from the environment variables
  if (selectedApp?.terminal) {
    // Fetch the terminal name from the environment variable `TERMINAL`
    const terminalExec = STD.getenv("TERMINAL");

    // If no terminal executable is found, notify the user and stop execution
    if (!terminalExec) {
      await notify(
        `Failed to launch '${selectedApp.name}'.`, // Notification title
        "No TERMINAL found in env var", // Notification message
        "critical", // Notification type
      );
      return;
    }

    // Add the terminal executable to the command array
    execCmd.push(terminalExec);
  }

  // Add the application execution command to the array (the actual app command)
  execCmd.push(selectedApp.exec);

  OS.exec(execCmd, { block: false });
  // ensure app launched
  while (true) {
    print("start", execCmd);
    const appName = (await execAsync(["ps", "-e", "-o", "comm="])).split("\n")
      .find((appName) => appName.trim() === execCmd.join(" ").trim());
    print("here", appName);

    if (appName) break;
  }
}
