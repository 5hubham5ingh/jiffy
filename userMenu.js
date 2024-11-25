import { ensureDir } from "../justjs/utils.js";
import { getAppMenu } from "./applicationMenu.js";

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
