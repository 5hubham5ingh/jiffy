import { ProcessSync } from "../qjs-ext-lib/src/process.js";
import { Emojies } from "./ASCIINulSeperatedString.js";
import Fzf from "../justjs/fzf.js";
import { handleFzfExec, setCommonFzfArgs } from "./utils.js";

export default async function Emojis() {
  const fzfArgs = new Fzf().read0()
    .infoCommand('"echo {} | head -n 2 | tail -n 1"')
    .preview('"echo {} | head -n 3 | tail -n 1"').withNth(1)
    .delimiter('"\n"').previewWindow("down,1,wrap,border-top")
    .info("right").color("16,border:cyan").query("' '").prompt("''")
    .bind(
      `"enter:execute-silent(echo {} | head -n 1 | cut -d ' ' -f 1 | ${USER_ARGUMENTS.clipboard})"`,
    );

  setCommonFzfArgs(fzfArgs);

  const emojiesFzf = new ProcessSync(
    fzfArgs.toArray(),
    {
      input: Emojies,
      useShell: true,
    },
  );

  await handleFzfExec(emojiesFzf);
}
