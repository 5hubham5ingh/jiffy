import { ProcessSync } from "../qjs-ext-lib/src/process.js";
import { getFzfCommonArgs, handleFzfExec } from "./utils.js";

export default async function fzfBc() {
  const fzfArgs = [
    "fzf",
    `--info-command="echo {fzf:query} | bc "`, // print results
    "--query=' '",
    `--bind='change:transform-header(echo {fzf:query} | bc 2>&1 >/dev/null)'`, // print bc stderr
    `--preview="echo {fzf:query} | tr ';' '\n';"`,
    "--info=right",
    "--prompt=''",
    "--separator=' '",
    "--bind='enter:clear-query'",
    "--preview-label=' Basic calculator(bc) '",
    ...getFzfCommonArgs(),
  ];

  switch (USER_ARGUMENTS.preset) {
    case "1":
      fzfArgs.push("--preview-window=bottom,90%,wrap,border-top");
      break;
    case "2":
      fzfArgs.push("--preview-window=top,90%,wrap,border-bottom");
      break;
    case "3":
    default:
      fzfArgs.push("--preview-window=right,50%,wrap,border-left");
      break;
  }

  const fzfBc = new ProcessSync(
    fzfArgs,
    {
      input: "",
      useShell: true,
    },
  );
  await handleFzfExec(fzfBc);
}
