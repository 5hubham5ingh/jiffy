import { ProcessSync } from "../qjs-ext-lib/src/process.js";
import { modes } from "./main.js";
import {
  addBorder,
  alignCenter,
  getFzfCommonArgs,
  handleFzfExec,
} from "./utils.js";

export default async function fzfChoose() {
  const header = `    ┏┳  •  ┏  ┏    
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
    "--bind='enter:accept'",
    ...getFzfCommonArgs(),
    "--border=none",
    "--no-scrollbar",
  ];

  const fzfInput = modes.map((mode, i) => i !== 3 ? mode[0] : null).filter(
    Boolean,
  ).map((choice) => addBorder(choice)).join("\0");

  const fzf = new ProcessSync(
    fzfArgs,
    {
      input: fzfInput,
      useShell: true,
    },
  );

  await handleFzfExec(fzf);
}
