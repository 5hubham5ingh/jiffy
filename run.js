import { ansi } from "../justjs/ansiStyle.js";
import { ProcessSync } from "../qjs-ext-lib/src/process.js";
import Fzf from "../justjs/fzf.js";
import getUserMenu from "./userMenu.js";
import {
  getKeyBinds,
  getWindowSize,
  handleFzfExec,
  setCommonFzfArgs,
} from "./utils.js";

/**
 * @param {Array} list - The list of options to present to the user for selection.
 */
export default async function Run() {
  const userMenu = await getUserMenu();
  const keyBinds = getKeyBinds();
  const [listName] = keyBinds.find(([mode, shortcut]) =>
    mode === USER_ARGUMENTS.mode || shortcut === USER_ARGUMENTS.mode
  );
  const list = userMenu[listName];

  // Get the terminal window size (width and height) for formatting purposes
  const [width] = getWindowSize();

  const fzfArgs = new Fzf().ansi().read0().delimiter("'#'").withNth(-1)
    .info("right").infoCommand(`"echo ${listName}"`)
    .preview('"echo {} | head -n 2 | tail -n 1 | column -c 1"')
    .previewWindow("down,1,wrap,border-top")
    .prompt('"> "').marker('""').pointer('""')
    .highlightLine()
    .bind("'enter:execute(`echo {} | head -n 3 | tail -n 1` &)+abort'");

  setCommonFzfArgs(fzfArgs);

  // Calculate the maximum name length among the options in the list to properly align the display
  const maxNameLength = list.reduce(
    (length, option) =>
      option.name.length > length ? option.name.length : length,
    0,
  );

  // Format each option in the menu
  const styledOptions = list.map((option) => ({
    displayName: `\n`
      .concat( // Display the command to be executed
        option.exec,
        "\n",
      ).concat( // Command to execute
        "setsid ", // for double fork
        option.terminal ? `${USER_ARGUMENTS.terminal} ` : "",
        option.exec,
        "\n",
      )
      .concat(option?.category ?? "", "\n") // Display the command's category
      .concat( // Display the command's name and keywords, with proper formatting
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

  const fzfRun = new ProcessSync(
    fzfArgs.toArray(),
    {
      input: optionNames,
      useShell: true,
    },
  );

  await handleFzfExec(fzfRun);
}
