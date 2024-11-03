import * as _ from "../justjs/globalConstants.js";
import { ensureDir, notify } from "../justjs/utils.js";
import { ProcessSync } from "../qjs-ext-lib/src/process.js";

globalThis.USER_ARGUMENTS = {
  pLimit: 4,
  disableNotification: false,
};
//TODO: remove this from code and make it injection that runs on start
OS.exec(["kitty", "@", "set-spacing", "margin=0"]);

await app();

async function app() {
  const appMenu = getMenu();
  const selectedApp = fzf(appMenu);
  const execCmd = [];
  if (selectedApp?.terminal) {
    // look for terminal name in th env var then fetch it's exec from the menuJson and exec it.
    const terminalExec = STD.getenv("TERMINAL");
    if (!terminalExec) {
      await notify(
        `Failed to launch '${selectedApp.name}'.`,
        "No TERMINAL found in env var.",
        "critical",
      );
      return;
    }

    execCmd.push(terminalExec);
  }

  execCmd.push(selectedApp.exec);
  await execAsync(execCmd.join(" "), { newSession: true })
    .catch(async (error) =>
      await notify(
        `Failed to launch "${execCmd.join(" ")}"`,
        JSON.stringify(`Error code: ${error.state.exitCode}`),
        "critical",
      )
    );

  STD.exit(0);
}

function getMenu(menuName = "Apps") {
  const cachedMenuFileDirPath = HOME_DIR + "/.config/jiffy/";
  const cachedMenuFilePath = cachedMenuFileDirPath + "config.jsonc";
  const cachedMenu = STD.loadFile(cachedMenuFilePath);

  if (cachedMenu) {
    const cache = STD.parseExtJSON(cachedMenu);
    if (cache?.[menuName]) return cache[menuName];
  }

  if (menuName === "Apps") {
    const appMenu = prepareAppsMenu();
    const error = {};
    let fd = STD.open(cachedMenuFilePath, "w+", error);
    if (!fd) {
      if (error.errno === 2) ensureDir(cachedMenuFileDirPath);
      fd = STD.open(cachedMenuFilePath, "w+", error);
      if (!fd) {
        throw Error(
          `Failed to open file "${cachedMenuFilePath}".\nError code: ${error.errno}`,
        );
      }
    }
    fd.puts(JSON.stringify({ Apps: appMenu }));
    fd.close();
    return appMenu;
  }

  throw new SystemError(
    `No menu named "${menuName}" found in "${cachedMenuFilePath}".`,
    `Make sure that a property named "${menuName}" exits in the "${cachedMenuFilePath}".`,
  );
}

// launcher.js
function findIconPath(iconName) {
  // Icon theme search paths
  const ICON_PATHS = [
    HOME_DIR + "/.local/share/icons",
    "/usr/share/icons",
    "/usr/share/pixmaps",
  ];

  // Common icon sizes to search for
  const ICON_SIZES = ["48x48", "32x32", "24x24", "16x16", "scalable"];
  const ICON_CATEGORIES = ["apps", "applications"];
  const ICON_EXTENSIONS = [".svg", ".png", ".xpm"];

  // If iconName is an absolute path, verify it exists and return it
  if (iconName.startsWith("/")) {
    const [_stat, err] = OS.stat(iconName);
    if (err === 0) return iconName;
    // Continue with theme-based search if absolute path fails
  }

  // Remove file extension if present
  iconName = iconName.replace(/\.[^/.]+$/, "");

  // Search in all icon directories
  for (const basePath of ICON_PATHS) {
    // First check if icon exists directly in pixmaps
    if (basePath === "/usr/share/pixmaps") {
      for (const ext of ICON_EXTENSIONS) {
        const directPath = `${basePath}/${iconName}${ext}`;
        const [_stat, err] = OS.stat(directPath);
        if (err === 0) return directPath;
      }
      continue;
    }

    // Get list of theme directories
    let themes;
    const [dirs, err] = OS.readdir(basePath);
    if (err === 0) themes = dirs;
    else continue;

    // Search through themes (including hicolor)
    for (const theme of ["hicolor", ...themes]) {
      for (const size of ICON_SIZES) {
        for (const category of ICON_CATEGORIES) {
          for (const ext of ICON_EXTENSIONS) {
            const iconPath =
              `${basePath}/${theme}/${size}/${category}/${iconName}${ext}`;
            const [_stat, err] = OS.stat(iconPath);
            if (err === 0) return iconPath;
          }
        }
      }
    }
  }

  // Return original icon name if no path found
  return iconName;
}

function prepareAppsMenu() {
  const desktopDirs = [
    "/usr/share/applications",
    HOME_DIR + "/.local/share/applications",
  ];
  const desktopFilePaths = [];
  const fileNames = [];

  // Collect desktop files
  for (const dir of desktopDirs) {
    const [files, err] = OS.readdir(dir);
    if (err === 0) {
      for (const file of files) {
        if (file.endsWith(".desktop") && !fileNames.includes(file)) {
          desktopFilePaths.push(dir + "/" + file);
          fileNames.push(file);
        }
      }
    }
  }

  const appMenu = [];
  for (const filePath of desktopFilePaths) {
    const fd = STD.open(filePath, "r");
    const currApp = {};
    let noDisplay = false;
    let inDesktopEntry = false;

    // Read file line by line
    while (true) {
      const line = fd.getline();
      if (line === null) break;

      // Skip until [Desktop Entry] is found
      if (line.startsWith("[Desktop Entry]")) {
        inDesktopEntry = true;
        continue;
      }
      if (!inDesktopEntry) continue;
      if (line.startsWith("[")) break; // New section started

      // Parse desktop entry fields
      if (line.startsWith("Name=")) {
        currApp.name = line.split("=")[1];
      } else if (line.startsWith("Comment=")) {
        currApp.description = line.split("=")[1];
      } else if (line.startsWith("Exec=")) {
        currApp.exec = line.split("=")[1].split("/").reduce(
          (_, execCmd) => execCmd.split(" ")[0],
          _,
        );
      } else if (line.startsWith("Icon=")) {
        const iconName = line.split("=")[1];
        currApp.icon = findIconPath(iconName);
      } else if (line.startsWith("Terminal=")) {
        currApp.terminal = line.split("=")[1].toLowerCase() === "true";
      } else if (line.startsWith("NoDisplay=")) {
        noDisplay = line.split("=")[1].toLowerCase() === "true";
      } else if (line.startsWith("Categories")) {
        currApp.category = "◉ " +
          line.split("=")[1]?.split(";").filter((entry) => entry).join(" ◉ ")
            .trim();
      } else if (line.startsWith("Keywords")) {
        currApp.keywords = line.split("=")[1]?.split(";").filter((entry) =>
          entry?.charCodeAt(0) >= 32 && entry?.charCodeAt(0) <= 126
        ).join(" │ ").trim();
      }

      // Break when all required fields have been acquired.
      if (Object.keys(currApp).length === 8) break;
    }
    fd.close();

    // Add valid entries to menu
    if (Object.keys(currApp).length && !noDisplay && currApp?.exec) {
      appMenu.push({ ...currApp, path: filePath });
    }
  }

  return appMenu;
}

// fzf.js
function fzf(
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
