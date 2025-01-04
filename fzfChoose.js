import { ProcessSync } from "../qjs-ext-lib/src/process.js";
import { app, predefinedModes } from "./main.js";
import { getUserMenu } from "./userMenu.js";
import { addBorder, alignCenter, getFzfCommonArgs, removeBorder } from "./utils.js";

export default function fzfChoose() {

  const header = `┏┳  •  ┏  ┏    
 ┃  ┓  ╋  ╋  ┓┏
┗┛  ┗  ┛  ┛  ┗┫
              ┛`

  const fzfArgs = [
    'fzf',
    "--color=16,current-fg:cyan",
    "--separator=''",
    "--read0",
    "--no-info",
    "--prompt=",
    "--marker=",
    "--pointer=",
    "--layout=reverse",
    `--header="${alignCenter(header)}"`,
    "--header-first",
    "--bind='enter:accept'",
    ...getFzfCommonArgs(),
  ]

  const fzfInput = [...predefinedModes.map(mode => mode[0]), ...Object.keys(getUserMenu())].map(choice => addBorder(choice)).join('\0');
  const fzfBc = new ProcessSync(
    fzfArgs,
    {
      input: fzfInput,
      useShell: true,
    },
  );

  if (fzfBc.run() && fzfBc.success && fzfBc.stdout) {
    const choice = removeBorder(fzfBc.stdout)
    USER_ARGUMENTS.mode = choice;
    app();
  }
}
