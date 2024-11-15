import { ensureDir } from "../justjs/utils.js";
import { prepareAppsMenu } from "./applicationMenu.js";

/**
 * Retrieves the combined user and application menus.
 * @returns {Object} The merged menu object, including user-specific and application menus.
 */
export function getMenu() {
  // Merge the user menu and app menu to create the final menu.
  const menu = { ...getUserMenu(), ...getAppMenu() };

  // Return the merged menu.
  return menu;
}

let userMenu;
/**
 * Retrieves the user-specific menu from a JSON file located in the user's config directory.
 * @returns {Object} The user menu as an object, or an empty object if no menu is found or there is an error.
 */
export function getUserMenu() {
  if (userMenu) return userMenu;
  // Define the path to the user's menu directory.
  const userMenuDirPath = HOME_DIR + "/.config/jiffy/";

  // Ensure the user's menu directory exists (create it if necessary).
  ensureDir(userMenuDirPath);

  // Define the full path to the user menu file.
  const userMenuFilePath = userMenuDirPath + "menu.jsonc";

  // Load the user menu file content.
  const userMenuFile = STD.loadFile(userMenuFilePath);

  // If the user menu file exists, try to parse it.
  if (userMenuFile) {
    try {
      // Parse the user menu JSON content and return it.
      userMenu = STD.parseExtJSON(userMenuFile);
      return userMenu;
    } catch (_) {
      // If there is an error parsing the menu file, throw a custom error.
      throw new SystemError(
        "Error while parsing menu.jsonc",
        `The following extensions to JSON standard are accepted:-
    - Single line and multiline comments
    - unquoted properties (ASCII-only Javascript identifiers)
    - trailing comma in array and object definitions
    - single quoted strings
    - \\f and \\v are accepted as space characters
    - leading plus in numbers
    - octal (0o prefix) and hexadecimal (0x prefix) numbers `,
      );
    }
  } else print("No custom menu found.", userMenuFilePath);

  // Return an empty object if no user menu file is found.
  return {};
}

/**
 * Retrieves the application menu, potentially from a cache file.
 * If the cache is not available, it will generate the menu, save it to the cache, and return it.
 * @returns {Object} The application menu as an object.
 */
function getAppMenu() {
  // Define the path to the cached application menu directory.
  const cachedApplicationMenuDirPath = HOME_DIR + "/.cache/jiffy/";

  // Define the full path to the cached application menu file.
  const cachedApplicationMenuFilePath = cachedApplicationMenuDirPath +
    "appsMenu.json";

  // If cache is enabled, check if the cached application menu is available.
  if (USER_ARGUMENTS.cache) {
    // Load the cached file content.
    const cacheFile = STD.loadFile(cachedApplicationMenuFilePath);
    // Parse the cached file and check if it contains the "Apps" data.
    const cache = cacheFile && JSON.parse(cacheFile);
    if (cache?.Apps) return cache.Apps;
  }

  // If no valid cache is found, prepare a new application menu.
  const appMenu = prepareAppsMenu();

  // Create an error object to capture potential issues with file handling.
  const error = {};

  // Attempt to open the cached application menu file in write mode.
  let fd = STD.open(cachedApplicationMenuFilePath, "w+", error);

  // If file opening failed (e.g., directory does not exist), ensure the directory exists.
  if (!fd) {
    if (error.errno === 2) ensureDir(cachedApplicationMenuDirPath);
    // Try to open the file again after ensuring the directory exists.
    fd = STD.open(cachedApplicationMenuFilePath, "w+", error);
    if (!fd) {
      // If opening the file still fails, throw an error with details.
      throw Error(
        `Failed to open file "${cachedApplicationMenuFilePath}".\nError code: ${error.errno}`,
      );
    }
  }

  // Write the application menu data to the cache file in JSON format.
  fd.puts(JSON.stringify({ Apps: appMenu }));

  fd.close();

  return appMenu;
}
