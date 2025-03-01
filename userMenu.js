import { ensureDir } from "../justjs/utils.js";

/**
 * Retrieves the user-specific menu from a JSON file located in the user's config directory.
 * @returns {Object} The user menu as an object, or an empty object if no menu is found or there is an error.
 */
let userMenu;
export default async function getUserMenu() {
  if (userMenu) return userMenu;
  const userMenuFromJson = getUserMenuFromJson();
  const userMenuFromJs = await getUserMenuFromJs();
  userMenu = userMenuFromJson;

  for (const key in userMenuFromJs) {
    if (userMenu.hasOwnProperty(key)) {
      userMenu[key] = [...userMenu[key], ...userMenuFromJs[key]];
    } else {
      userMenu[key] = userMenuFromJs[key];
    }
  }
  return userMenu;
}

let userMenu1;
async function getUserMenuFromJs() {
  const userMenuJsFilePath = HOME_DIR + "/.config/jiffy/menu.js";
  const [_, err] = OS.stat(userMenuJsFilePath);
  if (err) {
    print(
      "Failed to read Js menu file at " + userMenuJsFilePath +
        ". Error code: " + err,
    );
    return {};
  }

  try {
    userMenu1 = await import(userMenuJsFilePath);
    return userMenu1.default ?? {};
  } catch (status) {
    STD.err.puts(
      `${status.constructor.name}: ${status.message}\n${status.stack}`,
    );
    STD.exit(1);
  }
}

let userMenu2;
function getUserMenuFromJson() {
  if (userMenu2) return userMenu2;
  const userMenuDirPath = HOME_DIR + "/.config/jiffy/";

  ensureDir(userMenuDirPath);

  const userMenuFilePath = userMenuDirPath + "menu.jsonc";

  const userMenuFile = STD.loadFile(userMenuFilePath);

  if (userMenuFile) {
    try {
      userMenu2 = STD.parseExtJSON(userMenuFile);
      return userMenu2;
    } catch (_) {
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
  } else print("No custom menu found at ", userMenuFilePath);

  return {};
}
