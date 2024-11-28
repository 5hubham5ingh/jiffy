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
