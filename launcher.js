import { ansi } from "../justjs/ansiStyle.js";
import { ProcessSync } from "../qjs-ext-lib/src/process.js";
import { getAppMenu } from "./applicationMenu.js";
import Fzf from "../justjs/fzf.js";
import { getWindowSize, handleFzfExec, setCommonFzfArgs } from "./utils.js";

/**
 * @param {Array} list - The list of options to present to the user for selection.
 */
export default async function Launcher() {
  const appMenu = getAppMenu();
  const list = appMenu.Apps;
  const listName = "Apps";

  // Get the terminal window size (width and height) for formatting purposes
  const [width, height] = getWindowSize();

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

  // Calculate the maximum name length among the options in the list to properly align the display
  const maxNameLength = list.reduce(
    (length, option) =>
      option.name.length > length ? option.name.length : length,
    0,
  );

  const fzfArgs = new Fzf().ansi().header("''").read0().delimiter("'#'")
    .withNth(-1).info("right").padding(padding)
    .infoCommand(
      `'kitty icat --clear --transfer-mode=memory --unicode-placeholder --stdin=no --scale-up --place=${iconPlacement}` +
        ` "$(echo {} | head -n 1 | cut -d'#' -f1)" >>/dev/tty ${
          USER_ARGUMENTS.printCategory
            ? `&& echo {} | head -n 4 | tail -n 1'`
            : `'`
        }`,
    )
    .preview('"echo {} | head -n 2 | tail -n 1 | column -c 1"').previewWindow(
      "down,1,wrap,border-top",
    )
    .prompt(`"${listName}: "`).marker("''").pointer("''").highlightLine()
    .bind(
      "'enter:execute(`echo {} | head -n 3 | tail -n 1` > /dev/null 2>&1 &)+abort'",
    )
    .headerFirst().bind(
      `"${USER_ARGUMENTS.modKey}-space:become(jiffy -m a -r)"`,
    );

  setCommonFzfArgs(fzfArgs);

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
  const launcher = new ProcessSync(
    fzfArgs.toArray(),
    {
      input: optionNames,
      useShell: true,
    },
  );

  await handleFzfExec(launcher);
}
