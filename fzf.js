import { ProcessSync } from "../qjs-ext-lib/src/process.js";

// fzf.js
export function fzf(
  list,
) {
  const [width, height] = OS.ttyGetWinSize();
  const iconSize = 5; // WxH
  const icons = [];

  const fzfArgs = [ // TODO: these will be injectable.
    "fzf",
    "--ansi",
    "--border=rounded",
    "--color=bg+:-1,border:cyan",
    `--header=""`,
    "--read0",
    "--delimiter=#",
    ...["--with-nth", "-1"],
    "--no-separator",
    '--separator="═"',
    "--info",
    "right",
    `--padding=${parseInt(iconSize / 2)},0,0,0`,
    `--info-command='kitty icat --clear --transfer-mode=memory --unicode-placeholder --stdin=no --scale-up --place=${iconSize}x${iconSize}@${
      parseInt(width / 2 - 4).toString()
    }` +
    `x1 "$(echo {} | head -n 1 | cut -d'#' -f1)" >>/dev/tty && echo {} | head -n 3 | tail -n 1'`,
    '--preview="echo {} | head -n 2 | tail -n 1 | column -c 1"',
    "--preview-window=down,1%,border-none",
    // "--no-scrollbar",
    // `--scrollbar=""`,
    `--prompt=" "`,
    `--marker=""`,
    `--pointer=""`,
    "--highlight-line",
    "--layout=reverse",
    "--header-first", // Maintains one line gap between icon and query line.
  ];

  const maxNameLength = list.reduce(
    (length, option) =>
      option.name.length > length ? option.name.length : length,
    0,
  );
  const styledOptions = list.map((option) => ({
    displayName: `${option?.icon ?? ""}\n` // App Icon
      .concat(
        (option?.category &&
          " ".repeat(
            Math.abs(
              parseInt(width / 2) - parseInt(option.category.length / 2) - 4,
            ),
          )
            .concat(option.category)) ?? "",
        "\n",
      ) // App Categories
      .concat(option?.keywords ?? "", "\n") // App Keywords
      .concat( // App name and description
        "#\n",
        option.name + " ".repeat(maxNameLength - option.name.length),
        option?.description
          ? ` : ${
            width - maxNameLength - 10 < option.description.length
              ? option.description.substring(0, width - maxNameLength - 10)
                .concat("...")
              : option.description
          }`
          : "",
      ),
    ...option,
  }));

  const optionNames = styledOptions.map((option) =>
    option.displayName.concat("\0")
  ).join("");

  const filter = new ProcessSync(
    fzfArgs,
    {
      input: optionNames,
      useShell: true,
    },
  );

  if (filter.run() && filter.success) {
    return (styledOptions.find((item) =>
      item.displayName.trim() === filter.stdout.trim() &&
      delete item.displayName
    ));
  }
}
