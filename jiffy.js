import * as _ from "../justjs/globalConstants.js";
import { ensureDir, notify } from "../justjs/utils.js";
import {fzf} from "./fzf.js"
import { prepareAppsMenu } from "./launcher.js";

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

