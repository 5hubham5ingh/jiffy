import { ansi } from "../justjs/ansiStyle.js";
import { ProcessSync } from "../qjs-ext-lib/src/process.js";
import getUserMenu from "./userMenu.js";
import {
  getFzfCommonArgs,
  getKeyBinds,
  getWindowSize,
  handleFzfExec,
} from "./utils.js";

/**
 * @param {Array} list - The list of options to present to the user for selection.
 */
export default async function fzfRun() {
  const userMenu = await getUserMenu();
  const keyBinds = getKeyBinds();
  const [listName] = keyBinds.find(([mode, shortcut]) =>
    mode === USER_ARGUMENTS.mode || shortcut === USER_ARGUMENTS.mode
  );
  const list = userMenu[listName];

  // Get the terminal window size (width and height) for formatting purposes
  const [width] = getWindowSize();

  // Define the arguments that will be passed to the `fzf` command
  const fzfArgs = [
    "fzf", // Launch fzf command
    "--ansi", // Enable ANSI color sequences
    "--read0", // Use null-terminated strings for input
    "--delimiter=#", // Set delimiter for separating data
    ...["--with-nth", "-1"], // Configure last columns to display in the fuzzy search
    '--separator="═"', // Use a specific separator for the output
    ...["--info", "right"], // Display information on the right side
    `--info-command="echo ${listName}"`, // Custom info command for displaying icons (using `kitty icat`)
    '--preview="echo {} | head -n 2 | tail -n 1 | column -c 1"', // Preview command to show App's description
    "--preview-window=down,1,wrap,border-top", // Preview window settings
    `--prompt="> "`, // Set the prompt to list name
    `--marker=""`, // Remove the marker character
    `--pointer=""`, // Remove the pointer symbol
    "--highlight-line", // Highlight the selected line
    "--bind='enter:execute(`echo {} | head -n 3 | tail -n 1` > /dev/null 2>&1 &)+abort'",
    ...getFzfCommonArgs(),
  ];

  // Calculate the maximum name length among the options in the list to properly align the display
  const maxNameLength = list.reduce(
    (length, option) =>
      option.name.length > length ? option.name.length : length,
    0,
  );

  // Format each option in the list with the app icon, category, keywords, name, and description
  const styledOptions = list.map((option) => ({
    displayName: `\n` // Display the app's icon (if any)
      .concat( // Display the description, if available
        option.exec,
        "\n",
      ).concat( // Command to execute
        option.terminal ? `${USER_ARGUMENTS.terminal} ` : "",
        option.exec,
        "\n",
      )
      .concat(option?.category ?? "", "\n") // Display the app's category
      .concat( // Display the app's name and keywords, with proper formatting
        "#\n",
        ansi.style.green + option.name + ansi.style.reset +
          " ".repeat(maxNameLength - option.name?.length), // Align names by padding with spaces
        width - maxNameLength - 10 < option.keywords?.length
          ? ansi.style.gray +
            (option?.description ?? "" + "|" + option?.description).substring(
              0,
              width - maxNameLength - 13,
            )
              .concat("...") +
            ansi.style.reset // Truncate keywords line if it exceeds available space
          : " : " +
            ansi.style.gray +
            (option?.description ?? "") +
            (option?.keywords ? " ( " + option?.keywords + " )" : ""),
        ansi.style.reset,
      ),
    ...option, // Include all other properties of the option
  }));

  // Create a single string containing all the display names for use in the fzf input
  const optionNames = styledOptions.map((option) =>
    option.displayName.concat("\0") // Use null-terminated strings for fzf input
  ).join("");

  // Create a new `ProcessSync` to run the `fzf` command synchronously with the formatted options
  const fzfRun = new ProcessSync(
    fzfArgs, // Arguments for the fzf command
    {
      input: optionNames, // Pass the formatted options as input to fzf
      useShell: true, // Allow the use of shell commands in the fzf command
    },
  );

  await handleFzfExec(fzfRun);
}
