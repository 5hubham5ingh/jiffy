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

  return topBorder + "│" + leftPadding + string + rightPadding + "│\n" + bottomBorder;
}

export function alignCenter(string) {
  return string.split('\n').map(line => {
    const leftPadding = " ".repeat(Math.floor((width - 5 - line.length) / 2));
    const rightPadding = " ".repeat(Math.ceil((width - 5 - line.length) / 2));

    return leftPadding + line + rightPadding;
  })
    .join("\n")
}


export function removeBorder(borderedString) {
  const lines = borderedString.split("\n"); // remove horizontalBorder
  const contentLine = lines[1];
  const originalString = contentLine.slice(1, -1).trim(); // remove verticle border and padding from text.
  return originalString;
}

export const fzfCommenArgs = [
  "--bind='ctrl-e:become(jiffy -m e)'",
  "--bind='ctrl-b:become(jiffy -m bc)'", //TODO: bug: failed to bind bc to ctrl+c
  "--bind='ctrl-r:become(jiffy -m a -r)'",
  "--bind='ctrl-a:become(jiffy -m a)'",
  "--bind='ctrl-j:become(jiffy -m j)'", // TODO: bug: failed to bind menu to ctrl+m
]

