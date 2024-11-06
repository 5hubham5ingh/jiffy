import { ProcessSync } from "../qjs-ext-lib/src/process.js";

/**
 * Function to invoke `fzf` (fuzzy finder) and filter a list of options interactively.
 * This function customizes the display of app icons, categories, and descriptions,
 * and allows the user to select an app from the list.
 *
 * @param {Array} list - The list of options (e.g., applications) to present to the user for selection.
 * @returns {Object | undefined} The selected item from the list or undefined if no selection was made.
 */
export function fzf(list) {
  // Get the terminal window size (width and height) for formatting purposes
  const [width, height] = OS.ttyGetWinSize();

  // Retrieve the icon size from the global user arguments (this will influence the display format)
  const iconSize = USER_ARGUMENTS.iconSize; // WxH

  // Define the arguments that will be passed to the `fzf` command
  const fzfArgs = [
    "fzf", // Launch fzf command
    "--ansi", // Enable ANSI color sequences
    "--border=rounded", // Set a rounded border for the fzf window
    "--color=bg+:-1,border:cyan", // Set colors for background and border
    `--header=""`, // Remove any header
    "--read0", // Use null-terminated strings for input
    "--delimiter=#", // Set delimiter for separating data
    ...["--with-nth", "-1"], // Configure last columns to display in the fuzzy search
    "--no-separator", // Do not show any separator between items
    '--separator="═"', // Use a specific separator for the output
    "--info",
    "right", // Display information on the right side
    `--padding=${parseInt(iconSize / 2)},0,0,0`, // Adjust padding for display based on icon size
    `--info-command='kitty icat --clear --transfer-mode=memory --unicode-placeholder --stdin=no --scale-up --place=${iconSize}x${iconSize}@${
      parseInt(width / 2 - 4).toString()
    }` +
    `x1 "$(echo {} | head -n 1 | cut -d'#' -f1)" >>/dev/tty && echo {} | head -n 3 | tail -n 1'`, // Custom info command for displaying icons (using `kitty icat`)
    '--preview="echo {} | head -n 2 | tail -n 1 | column -c 1"', // Preview command to show more details about the selection
    "--preview-window=down,1%,border-none", // Preview window settings
    `--prompt=" "`, // Set the prompt to a space (empty)
    `--marker=""`, // Remove the marker character
    `--pointer=""`, // Remove the pointer symbol
    "--highlight-line", // Highlight the selected line
    "--layout=reverse", // Reverse layout (display results from bottom to top)
    "--header-first", // Display the header first (maintains gap between icon and query line)
    USER_ARGUMENTS?.fzfArgs, // Custom arguments passed by the user
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
      .concat(
        (option?.category &&
          " ".repeat(
            Math.abs(
              parseInt(width / 2) - parseInt(option.category.length / 2) - 4,
            ),
          )
            .concat(option.category)) ?? "", // Display the category, centered if available
        "\n",
      )
      .concat(option?.keywords ?? "", "\n") // Display the app's keywords
      .concat( // Display the app's name and description, with proper formatting
        "#\n",
        option.name + " ".repeat(maxNameLength - option.name.length), // Align names by padding with spaces
        option?.description
          ? ` : ${
            width - maxNameLength - 10 < option.description.length
              ? option.description.substring(0, width - maxNameLength - 10)
                .concat("...") // Truncate description if it exceeds available space
              : option.description
          }`
          : "",
      ),
    ...option, // Include all other properties of the option (e.g., exec commands)
  }));

  // Create a single string containing all the display names for use in the fzf input
  const optionNames = styledOptions.map((option) =>
    option.displayName.concat("\0") // Use null-terminated strings for fzf input
  ).join("");

  // Create a new `ProcessSync` to run the `fzf` command synchronously with the formatted options
  const filter = new ProcessSync(
    fzfArgs, // Arguments for the fzf command
    {
      input: optionNames, // Pass the formatted options as input to fzf
      useShell: true, // Allow the use of shell commands in the fzf command
    },
  );

  // Run the fzf process and check for success
  if (filter.run() && filter.success) {
    // If a selection is made, find the corresponding option from the list and return it
    return (styledOptions.find((item) =>
      item.displayName.trim() === filter.stdout.trim() && // Match the selected option's name
      delete item.displayName // Remove the temporary displayName property before returning
    ));
  }
}
