import { ProcessSync } from "../qjs-ext-lib/src/process.js";
import { Emojies } from "./ASCIINulSeperatedString.js"
import { fzfCommenArgs } from "./utils.js";

export function fzfEmojies() {
  const fzfArgs = [
    "fzf",
    "--read0",
    '--info-command="echo {} | head -n 2 | tail -n 1"',
    '--preview="echo {} | head -n 3 | tail -n 1"',
    "--with-nth 1",
    '--delimiter="\n"',
    "--preview-window=down,1,wrap,border-top",
    "--layout=reverse",
    "--info=right",
    "--color=16,border:cyan",
    "--query=' '",
    "--prompt=''",
    ...fzfCommenArgs,
    ...(USER_ARGUMENTS?.fzfArgs ?? [])
  ];

  const fzfBc = new ProcessSync(
    fzfArgs, // Arguments for the fzf command
    {
      input: Emojies, // Pass the formatted options as input to fzf
      useShell: true, // Allow the use of shell commands in the fzf command
    },
  );

  fzfBc.run();
}

