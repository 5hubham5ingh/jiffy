import { ensureDir } from "./utils.js";

/**
 * Retrieves the application menu, potentially from a cache file.
 * If the cache is not available, it will generate the menu, save it to the cache, and return it.
 * @returns {Object} The application menu as an object.
 */
export function getAppMenu() {
  const cachedApplicationMenuDirPath = HOME_DIR + "/.cache/jiffy/";

  const cachedApplicationMenuFilePath = cachedApplicationMenuDirPath +
    "appsMenu.json";

  if (!USER_ARGUMENTS.refresh) {
    const cacheFile = STD.loadFile(cachedApplicationMenuFilePath);
    if (cacheFile) {
      return JSON.parse(cacheFile);
    }
  }

  const appMenu = prepareAppsMenu();

  const error = {};

  let fd = STD.open(cachedApplicationMenuFilePath, "w+", error);

  if (!fd) {
    if (error.errno === 2) ensureDir(cachedApplicationMenuDirPath);
    fd = STD.open(cachedApplicationMenuFilePath, "w+", error);
    if (!fd) {
      throw Error(
        `Failed to open file "${cachedApplicationMenuFilePath}".\nError code: ${error.errno}`,
      );
    }
  }

  const appMenuCache = { Apps: appMenu };
  fd.puts(JSON.stringify(appMenuCache));

  fd.close();

  return appMenuCache;
}

/**
 * Prepares application menu by parsing desktop entry files
 * @returns {Array} Array of application objects with metadata
 */
function prepareAppsMenu() {
  const DESKTOP_DIRS = [
    "/usr/share/applications",
    `${HOME_DIR}/.local/share/applications`,
  ];

  // Collect and deduplicate desktop files
  const desktopFilePaths = collectDesktopFiles(DESKTOP_DIRS);

  // Parse desktop files and create application entries
  return parseDesktopFiles(desktopFilePaths);
}

/**
 * Collects desktop files from specified directories, removing duplicates
 * @param {Array<string>} directories - Directories to search for desktop files
 * @returns {Array<string>} Deduplicated list of desktop file paths
 */
function collectDesktopFiles(directories) {
  const fileNames = new Set();
  const filePaths = [];

  for (const dir of directories) {
    const [files, err] = OS.readdir(dir);
    if (err !== 0) continue;

    for (const file of files) {
      if (!file.endsWith(".desktop") || fileNames.has(file)) continue;

      fileNames.add(file);
      filePaths.push(`${dir}/${file}`);
    }
  }

  return filePaths;
}

/**
 * Parses desktop files and extracts application metadata
 * @param {Array<string>} filePaths - Paths to desktop files
 * @returns {Array<Object>} Array of application objects
 */
function parseDesktopFiles(filePaths) {
  const appMenu = [];

  for (const filePath of filePaths) {
    const appEntry = parseDesktopFile(filePath);
    if (appEntry) {
      appMenu.push(appEntry);
    }
  }

  return appMenu;
}

/**
 * Parses a single desktop file
 * @param {string} filePath - Path to desktop file
 * @returns {Object|null} Application metadata object or null if invalid
 */
function parseDesktopFile(filePath) {
  const fd = STD.open(filePath, "r");
  if (!fd) return null;

  try {
    const appData = extractDesktopEntryData(fd);
    fd.close();

    // Validate and return application data
    if (Object.keys(appData).length > 0 && !appData.noDisplay && appData.exec) {
      delete appData.noDisplay; // Clean up internal property
      return { ...appData, path: filePath };
    }

    return null;
  } catch (_) {
    print(`Failed to parse: ${filePath}.`);
    fd.close();
    return null;
  }
}

/**
 * Extracts data from desktop entry section
 * @param {Object} fileDescriptor - Open file descriptor
 * @returns {Object} Application metadata
 */
function extractDesktopEntryData(fileDescriptor) {
  const appData = { noDisplay: false };
  let inDesktopEntry = false;

  const FIELD_PARSERS = {
    "Name": (value) => appData.name = `• ${value}`,
    "Comment": (value) => appData.description = value,
    "Exec": (value) => appData.exec = parseExecField(value),
    "Icon": (value) => appData.icon = findIconPath(value),
    "Terminal": (value) => appData.terminal = value.toLowerCase() === "true",
    "NoDisplay": (value) => appData.noDisplay = value.toLowerCase() === "true",
    "Categories": (value) => appData.category = parseCategoriesField(value),
    "Keywords": (value) => appData.keywords = parseKeywordsField(value),
  };

  const REQUIRED_FIELDS = 7; // All fields except noDisplay

  while (true) {
    const line = fileDescriptor.getline();
    if (line === null) break;

    // Handle section markers
    if (line.startsWith("[Desktop Entry]")) {
      inDesktopEntry = true;
      continue;
    }

    if (line.startsWith("[") && inDesktopEntry) break; // New section after Desktop Entry
    if (!inDesktopEntry) continue;

    // Parse field
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const fieldName = line.substring(0, separatorIndex);
    const fieldValue = line.substring(separatorIndex + 1);

    if (FIELD_PARSERS[fieldName]) {
      FIELD_PARSERS[fieldName](fieldValue);
    }

    // Break early if we have all required fields
    if (Object.keys(appData).length >= REQUIRED_FIELDS + 1) break; // +1 for noDisplay
  }

  return appData;
}

/**
 * Parses the Exec field to extract the executable name
 * @param {string} execValue - Value of Exec field
 * @returns {string} Executable name
 */
function parseExecField(execValue) {
  return execValue.split("/").pop().split(" ")[0];
}

/**
 * Parses Categories field into formatted string
 * @param {string} categoriesValue - Value of Categories field
 * @returns {string} Formatted categories string
 */
function parseCategoriesField(categoriesValue) {
  return categoriesValue?.split(";")
    .filter(Boolean)
    .join(" │ ")
    .trim() || "";
}

/**
 * Parses Keywords field into formatted string
 * @param {string} keywordsValue - Value of Keywords field
 * @returns {string} Formatted keywords string
 */
function parseKeywordsField(keywordsValue) {
  return keywordsValue?.split(";")
    .filter((entry) => isAsciiPrintable(entry))
    .join(", ")
    .trim() || "";
}

/**
 * Checks if a string contains only printable ASCII characters
 * @param {string} str - String to check
 * @returns {boolean} True if string contains only printable ASCII
 */
function isAsciiPrintable(str) {
  if (!str) return false;
  return str.charCodeAt(0) >= 32 && str.charCodeAt(0) <= 126;
}

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
