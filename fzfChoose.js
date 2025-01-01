import { ProcessSync } from "../qjs-ext-lib/src/process.js";
import { app } from "./main.js";
import { getUserMenu } from "./userMenu.js";
import { addBorder, removeBorder } from "./utils.js";

export default function fzfChoose() {

  const fzfArgs = [
    'fzf',
    "--color=bg+:-1,border:cyan",
    "--separator=''",
    "--read0",
    "--no-info",
    "--prompt=",
    "--marker=",
    "--pointer=",
    "--layout=reverse",
  ]

  const fzfInput = ["Apps", "bc", ...Object.keys(getUserMenu())].map(choice => addBorder(choice)).join('\0');
  const fzfBc = new ProcessSync(
    fzfArgs,
    {
      input: fzfInput,
      useShell: true,
    },
  );

  if (fzfBc.run() && fzfBc.success) {
    const choice = removeBorder(fzfBc.stdout)
    USER_ARGUMENTS.mode = choice;
    app();
  }
}