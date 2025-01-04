import { ProcessSync } from "../qjs-ext-lib/src/process.js";
import { Emojies } from "./ASCIINulSeperatedString.js";
import { getFzfCommonArgs, handleFzfExec } from "./utils.js";

export function fzfEmojies() {
  const fzfArgs = [
    "fzf",
    "--read0",
    '--info-command="echo {} | head -n 2 | tail -n 1"',
    '--preview="echo {} | head -n 3 | tail -n 1"',
    "--with-nth 1",
    '--delimiter="\n"',
    "--preview-window=down,1,wrap,border-top",
    "--info=right",
    "--color=16,border:cyan",
    "--query=' '",
    "--prompt=''",
    `--bind="enter:execute-silent(echo {} | head -n 1 | cut -d ' ' -f 1 | ${USER_ARGUMENTS.clipboard})"`,
    ...getFzfCommonArgs(),
  ];

  const fzfEmojies = new ProcessSync(
    fzfArgs, // Arguments for the fzf command
    {
      input: Emojies, // Pass the formatted options as input to fzf
      useShell: true, // Allow the use of shell commands in the fzf command
    },
  );

  handleFzfExec(fzfEmojies);
}
