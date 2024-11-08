import * as _ from "../justjs/globalConstants.js";
import arg from "../qjs-ext-lib/src/arg.js";
import { notify } from "../justjs/utils.js";
import { fzf } from "./fzf.js";
import { getMenu, getUserMenu } from "./menu.js";

//TODO: remove this from code and make it injection that runs on start
// OS.exec(["kitty", "@", "set-spacing", "margin=0"]);

try {
  await main();
} catch (error) {
  if (error instanceof SystemError) error.log(true);
  else throw error;
}

/**
 * Main function that sets up global arguments, parses user inputs, and calls the app function.
 * @returns {Promise<void>} A promise that resolves when the main process is complete.
 */
async function main() {
  const parsedArgs = parseUserArguments();
  /**
   * Define and initialize the global `USER_ARGUMENTS` object. This object will hold user-provided arguments
   * for various configuration options, such as mode, icon size, and custom scripts.
   * The `parseUserArguments()` function is called to populate this object with parsed arguments.
   */
  globalThis.USER_ARGUMENTS = {
    pLimit: 4, // Default limit for parallel execution
    disableNotification: false, // Default flag to enable notifications
    ...parsedArgs, // Merge parsed user arguments into this object
  };

  // Call the `app` function to start the application logic
  await app(USER_ARGUMENTS.mode);
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
    fzfArgs: "--fzf-args", // Defines custom arguments for the fuzzy finder (fzf)
    cache: "--cache", // Flag to enable caching of the application list
    inject: "--inject", // Allows injecting custom JS code at startup
  };

  // Parse the user input arguments using `arg.parser`
  const userArguments = arg.parser({
    [args.mode]: arg.str("Apps").enum(["Apps", ...Object.keys(getUserMenu())])
      .desc(
        "Set the mode of commands from modes predefined in the config file.",
      ),
    [args.iconSize]: arg.num(5).min(0).desc("App's icon cell size."),
    [args.preset]: arg.str().enum(["1", "2", "3", "4"]).desc(
      "Start with UI preset.",
    ),
    [args.fzfArgs]: [
      arg.str().desc(
        "Custom arguments for fzf.",
      ),
    ],
    [args.cache]: arg.flag(true).desc("Cache the application list."),
    [args.inject]: arg.str().val("JS").cust(STD.evalScript).desc(
      "Inject JS code to run at startup.",
    ),
    "-s": args.iconSize, // Short form for --icon-size
    "-p": args.preset, // Short form for --preset
    "-i": args.inject, // Short form for --inject
  })
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
  const selectedApp = fzf(appMenu[menuName]);
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

  // Execute the command asynchronously and handle any errors
  execAsync(execCmd.join(" "), { newSession: true })
    .catch(async (error) => {
      // If the execution fails, notify the user about the failure
      await notify(
        `Failed to launch "${execCmd.join(" ")}"`, // Notification title
        JSON.stringify(`Error code: ${error.state.exitCode}`), // Notification message with error code
        "critical", // Notification type
      );
    });

  // Exit the script after attempting to launch the app
  STD.exit(0);
}
