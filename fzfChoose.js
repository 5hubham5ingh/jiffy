import { ProcessSync } from "../qjs-ext-lib/src/process.js";
import { app, predefinedModes } from "./main.js";
import { getUserMenu } from "./userMenu.js";
import {
  addBorder,
  alignCenter,
  getFzfCommonArgs,
  removeBorder,
} from "./utils.js";

export default function fzfChoose() {
  const header = `┏┳  •  ┏  ┏    
 ┃  ┓  ╋  ╋  ┓┏
┗┛  ┗  ┛  ┛  ┗┫
              ┛`;

  const fzfArgs = [
    "fzf",
    "--color=16,current-fg:cyan",
    "--separator=''",
    "--read0",
    "--no-info",
    "--prompt=",
    "--marker=",
    "--pointer=",
    `--header="${alignCenter(header)}"`,
    "--header-first",
    "--bind='enter:accept'",
    ...getFzfCommonArgs(),
    "--border=none",
  ];

  const fzfInput = [
    ...predefinedModes.map((mode, i) =>
      i !== predefinedModes.length - 1 ? mode[0] : null
    ).filter(Boolean),
    ...Object.keys(getUserMenu()),
  ].map((choice) => addBorder(choice)).join("\0");
  const fzf = new ProcessSync(
    fzfArgs,
    {
      input: fzfInput,
      useShell: true,
    },
  );

  if (fzf.run() && fzf.success && fzf.stdout) {
    const choice = removeBorder(fzf.stdout);
    USER_ARGUMENTS.mode = choice;
    app();
  }
}
