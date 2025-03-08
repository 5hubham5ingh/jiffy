import { ProcessSync } from "../qjs-ext-lib/src/process.js";
import Fzf from "../justjs/fzf.js";
import { modes } from "./main.js";
import {
  addBorder,
  alignCenter,
  handleFzfExec,
  setCommonFzfArgs,
} from "./utils.js";

export default async function JiffyMenu() {
  const header = `    ┏┳  •  ┏  ┏    
     ┃  ┓  ╋  ╋  ┓┏
    ┗┛  ┗  ┛  ┛  ┗┫
                  ┛`;

  const fzfArgs = new Fzf().color("16,current-fg:cyan")
    .separator("''").read0().noInfo()
    .prompt("''").marker("''").pointer("''")
    .header(`"${alignCenter(header)}"`)
    .bind("enter:accept").border("none")
    .noScrollbar();

  setCommonFzfArgs(fzfArgs);

  fzfArgs.border("none");

  const fzfInput = modes.map((mode, i) => i !== 3 ? mode[0] : null).filter(
    Boolean,
  ).map((choice) => addBorder(choice)).join("\0");

  const JiffyMenu = new ProcessSync(
    fzfArgs.toArray(),
    {
      input: fzfInput,
      useShell: true,
    },
  );

  await handleFzfExec(JiffyMenu);
}
