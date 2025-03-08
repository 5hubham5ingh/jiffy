import { ProcessSync } from "../qjs-ext-lib/src/process.js";
import Fzf from "../justjs/fzf.js";
import { getFzfCommonArgs, handleFzfExec } from "./utils.js";

export default async function fzfBc() {
  const fzfArgs = new Fzf().infoCommand('"echo {fzf:query} | bc "')
    .query("' '")
    .bind("'change:transform-header(echo {fzf:query} | bc 2>&1 >/dev/null)'")
    .preview(`"echo {fzf:query} | tr ';' '\n';"`)
    .info("right").prompt("''").separator("' '")
    .bind("enter:clear-query")
    .previewLabel("' Basic calculator (bc) '");

  switch (USER_ARGUMENTS.preset) {
    case "1":
      fzfArgs.previewWindow("bottom,90%,wrap,border-top");
      break;
    case "2":
      fzfArgs.previewWindow("top,90%,wrap,border-bottom");
      break;
    case "3":
    default:
      fzfArgs.previewWindow("right,50%,wrap,border-left");
      break;
  }

  const fzfArgsArr = fzfArgs.toArray();
  fzfArgsArr.push(...getFzfCommonArgs());

  const fzfBc = new ProcessSync(
    fzfArgsArr,
    {
      input: "",
      useShell: true,
    },
  );
  await handleFzfExec(fzfBc);
}
