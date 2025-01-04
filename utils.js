import { app } from "./main.js";

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

const [width, _] = OS.ttyGetWinSize();

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
  const contentLine = lines[1];
  const originalString = contentLine.slice(1, -1).trim(); // remove verticle border and padding from text.
  return originalString;
}

export const handleFzfExec = (fzf) => {
  if (fzf.run() && fzf.success) {
    if (fzf.stdout.trim() === "change-preset") {
      const currUiPreset = parseInt(USER_ARGUMENTS.preset);
      USER_ARGUMENTS.preset = `${currUiPreset >= 4 ? 1 : currUiPreset + 1}`;
    } else {
      USER_ARGUMENTS.mode = fzf.stdout.trim();
    }
    app();
  }
};

let fzfCommonArgs;

export const getFzfCommonArgs = () => {
  return fzfCommonArgs;
};

export const setCommonFzfArgs = (userArgs) => {
  fzfCommonArgs = [
    "--border=rounded", // Set a rounded border for the fzf window
    "--color=bg+:-1,border:cyan", // Set colors for background and border
    "--layout=reverse", // Reverse layout (display results from bottom to top)
    "--bind='ctrl-e:become(echo e)'",
    "--bind='ctrl-b:become(echo bc)'",
    "--bind='ctrl-a:become(echo a)'",
    "--bind='ctrl-j:become(echo j)'",
    `--bind='ctrl-space:become(echo change-preset)'`,
    ...(userArgs?.fzfArgs ?? []),
  ];
};
