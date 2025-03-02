import { app, modes } from "./main.js";

export function ensureDir(dir) {
  if (typeof dir !== "string") {
    throw new TypeError("Invalid directory type.");
  }
  let directory;
  switch (dir[0]) {
    case "~":
      directory = HOME_DIR.concat(dir.slice(1));
      break;
    case "/":
      directory = dir;
      break;
    default: {
      const path = OS.realpath(dir);
      if (path[1] !== 0) throw new Error("Failed to read directory");
      directory = path[0];
    }
  }

  directory.split("/").forEach((dir, i, path) => {
    if (!dir) return;
    const currPath = path.filter((_, j) => j <= i).join("/");
    const dirStat = OS.stat(currPath)[0];
    if (!dirStat) OS.mkdir(currPath);
  });
}

let windowSize;
export const getWindowSize = () =>
  windowSize ?? (windowSize = OS.ttyGetWinSize());
const [width, _] = getWindowSize();

export function addBorder(string) {
  const horizontalBorder = "─".repeat(width - 3);

  const leftPadding = " ".repeat(Math.floor((width - 3 - string.length) / 2));
  const rightPadding = " ".repeat(Math.ceil((width - 3 - string.length) / 2));

  const topBorder = "╭" + horizontalBorder + "╮\n";
  const bottomBorder = "╰" + horizontalBorder + "╯";

  return topBorder + "│" + leftPadding + string + rightPadding + "│\n" +
    bottomBorder;
}

export function alignCenter(string) {
  return string.split("\n").map((line) => {
    const leftPadding = " ".repeat(Math.floor((width - 5 - line.length) / 2));
    const rightPadding = " ".repeat(Math.ceil((width - 5 - line.length) / 2));

    return leftPadding + line + rightPadding;
  })
    .join("\n");
}

export function removeBorder(borderedString) {
  const lines = borderedString.split("\n"); // remove horizontalBorder
  if (lines.length === 1) return borderedString; // means there is no border and padding
  const contentLine = lines[1];
  const originalString = contentLine.slice(1, -1).trim(); // remove verticle border and padding from text.
  return originalString;
}

export const handleFzfExec = async (fzf) => {
  if (fzf.run() && fzf.success) {
    const stdout = removeBorder(fzf.stdout.trim()).split("###");
    if (stdout[0] === "change-preset") {
      const currUiPreset = parseInt(USER_ARGUMENTS.preset);
      USER_ARGUMENTS.preset = `${currUiPreset >= 3 ? 1 : currUiPreset + 1}`;
      fzfCommonArgs.push(`--query="${stdout[1]}"`);
    } else if (stdout[0] === "change-mode") {
      let selectNext = false;
      const oldMode = USER_ARGUMENTS.mode;
      for (const [mode, key] of modes) {
        if (selectNext) {
          USER_ARGUMENTS.mode = key ?? mode;
          break;
        }
        if (mode === USER_ARGUMENTS.mode || key === USER_ARGUMENTS.mode) {
          selectNext = true;
        }
      }
      if (oldMode === USER_ARGUMENTS.mode) {
        USER_ARGUMENTS.mode = modes[0][1];
      }
    } else if (modes.flat().includes(stdout[0])) {
      USER_ARGUMENTS.mode = stdout[0];
    }
    await app();
  }
};

export function createShortcutNames(menuNames) {
  let i = 0;
  const shortcutMemo = new Set();
  const result = [];

  const addShortcuts = (isLower = true) => {
    let count = 26;
    while (count--) {
      const currentMenuName = menuNames[i++];
      if (!currentMenuName) break;
      for (let j = 0; j < currentMenuName.length; j++) {
        const currentLetter = isLower
          ? currentMenuName[j].toLowerCase()
          : currentMenuName[j].toUpperCase();
        if (!shortcutMemo.has(currentLetter)) {
          result.push([currentMenuName, currentLetter]);
          shortcutMemo.add(currentLetter);
          break;
        }
      }
    }
  };

  // first create shortcuts using lower case letters
  addShortcuts();
  // then create shotcuts using capital letters
  addShortcuts(false);

  if (result.length < menuNames.length) {
    // add the remaining names without shortcuts
    let i = result.length;
    while (i < menuNames.length) result.push(menuNames[i++]);
  }
  return result;
}

const keyBinds = [];
export const getKeyBinds = () => {
  if (keyBinds.length) return keyBinds;
  switch (USER_ARGUMENTS.modKey) {
    case "alt":
      {
        for (const [mode, key] of modes) {
          if (!key) break;
          keyBinds.push([mode, key, `alt-${key}`]);
        }
      }
      break;
    case "ctrl": {
      for (const [mode, key] of modes) {
        if (!key) break;
        if (key === key.toLowerCase()) {
          keyBinds.push([mode, key, `ctrl-${key}`]);
        } else keyBinds.push([mode, key, `ctrl-alt-${key.toLowerCase()}`]);
      }
    }
  }
  return keyBinds;
};

const fzfCommonArgs = [];

export const getFzfCommonArgs = () => {
  return fzfCommonArgs;
};

export const setCommonFzfArgs = () => {
  const keyBinds = getKeyBinds();
  for (const [_, key, keyBind] of keyBinds) {
    fzfCommonArgs.push(`--bind='${keyBind}:become(echo ${key})'`);
  }
  fzfCommonArgs.push(
    "--border=rounded", // Set a rounded border for the fzf window
    "--color=bg+:-1,border:cyan", // Set colors for background and border
    "--layout=reverse", // Reverse layout (display results from bottom to top)
    "--bind='shift-tab:become(echo change-preset###${FZF_QUERY})'",
    "--bind='tab:become(echo change-mode###)'",
    ...(USER_ARGUMENTS?.fzfArgs ?? []),
  );
};
