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

export function prepareAppsMenu() {
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
        currApp.name = "• " + line.split("=")[1];
      } else if (line.startsWith("Comment=")) {
        currApp.description = line.split("=")[1];
      } else if (line.startsWith("Exec=")) {
        currApp.exec = line.split("=")[1].split("/").reduce(
          (_, execCmd) => execCmd.split(" ")[0],
          null,
        );
      } else if (line.startsWith("Icon=")) {
        const iconName = line.split("=")[1];
        currApp.icon = findIconPath(iconName);
      } else if (line.startsWith("Terminal=")) {
        currApp.terminal = line.split("=")[1].toLowerCase() === "true";
      } else if (line.startsWith("NoDisplay=")) {
        noDisplay = line.split("=")[1].toLowerCase() === "true";
      } else if (line.startsWith("Categories")) {
        currApp.category = line.split("=")[1]?.split(";").filter((entry) =>
          entry
        ).join(" │ ")
          .trim();
      } else if (line.startsWith("Keywords")) {
        currApp.keywords = line.split("=")[1]?.split(";").filter((entry) =>
          entry?.charCodeAt(0) >= 32 && entry?.charCodeAt(0) <= 126
        ).join(", ").trim();
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

  return { Apps: appMenu };
}
