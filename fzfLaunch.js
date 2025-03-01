import { ansi } from "../justjs/ansiStyle.js";
import { ProcessSync } from "../qjs-ext-lib/src/process.js";
import { getFzfCommonArgs, handleFzfExec } from "./utils.js";

/**
 * @param {Array} list - The list of options to present to the user for selection.
 */
export default async function fzfLaunch(list, listName) {
  if (!list) throw list;
  // Get the terminal window size (width and height) for formatting purposes
  const [width, height] = OS.ttyGetWinSize();

  // Retrieve the icon size from the global user arguments (this will influence the display format)
  const iconSize = USER_ARGUMENTS.iconSize; // WxH

  const [padding, iconPlacement] = (() => {
    switch (USER_ARGUMENTS.preset) {
      case "1":
        return [
          `${parseInt(iconSize / 2)},0,0,0`,
          `${iconSize}x${iconSize}@${
            Math.abs(parseInt(width / 2 - (iconSize / 2)))
          }x1`,
        ];
      case "2":
        return [
          `0,0,0,${parseInt(iconSize)}`,
          `${iconSize}x${iconSize}@${1}x${
            Math.abs(parseInt((height / 2) - (iconSize / 2)))
          }`,
        ];
      case "3":
      default:
        return [
          `0,${parseInt(iconSize)},0,0`,
          `${iconSize}x${iconSize}@${width - iconSize - 1}x${
            Math.abs(parseInt(height / 2 - (iconSize / 2)))
          }`,
        ];
    }
  })();

  // Define the arguments that will be passed to the `fzf` command
  const fzfArgs = [
    "fzf", // Launch fzf command
    "--ansi", // Enable ANSI color sequences
    `--header=""`, // Remove any header
    "--read0", // Use null-terminated strings for input
    "--delimiter=#", // Set delimiter for separating data
    ...["--with-nth", "-1"], // Configure last columns to display in the fuzzy search
    '--separator="═"', // Use a specific separator for the output
    ...["--info", "right"], // Display information on the right side
    `--padding=${padding}`, // Adjust padding for display based on icon size
    `--info-command='kitty icat --clear --transfer-mode=memory --unicode-placeholder --stdin=no --scale-up --place=${iconPlacement}` +
    ` "$(echo {} | head -n 1 | cut -d'#' -f1)" >>/dev/tty ` +
    (USER_ARGUMENTS.printCategory
      ? `&& echo {} | head -n 4 | tail -n 1'`
      : `'`), // Custom info command for displaying icons (using `kitty icat`)
    '--preview="echo {} | head -n 2 | tail -n 1 | column -c 1"', // Preview command to show App's description
    "--preview-window=down,1,wrap,border-top", // Preview window settings
    `--prompt="${listName}: "`, // Set the prompt to list name
    `--marker=""`, // Remove the marker character
    `--pointer=""`, // Remove the pointer symbol
    "--highlight-line", // Highlight the selected line
    "--bind='enter:execute(`echo {} | head -n 3 | tail -n 1` > /dev/null 2>&1 &)+abort'",
    "--header-first", // Display the header first (maintains gap between icon and query line)
    "--bind='ctrl-r:become(jiffy -m a -r)'",
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
    displayName: `${option?.icon ?? ""}\n` // Display the app's icon (if any)
      .concat( // Display the description, if available
        option?.description ?? "",
        "\n",
      ).concat( // Command to execute
        "setsid ", // run the command as seperate process
        option.terminal ? `${USER_ARGUMENTS.terminal} ` : "",
        option.exec,
        "\n",
      )
      .concat(option?.category ?? "", "\n") // Display the app's category
      .concat( // Display the app's name and keywords, with proper formatting
        "#\n",
        ansi.style.green + option.name + ansi.style.reset +
          " ".repeat(maxNameLength - option.name.length), // Align names by padding with spaces
        option?.keywords
          ? ` : ${
            width - maxNameLength - 10 < option.keywords.length
              ? ansi.style.gray +
                option.keywords.substring(0, width - maxNameLength - 13)
                  .concat("...") +
                ansi.style.reset // Truncate keywords line if it exceeds available space
              : ansi.style.gray + option.keywords + ansi.style.reset
          }`
          : "",
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
