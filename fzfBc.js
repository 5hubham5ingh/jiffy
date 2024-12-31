import { ProcessSync } from "../qjs-ext-lib/src/process.js";

export default function FzfBc() {
  const fzfArgs = [
    "fzf",
    `--info-command="echo {fzf:query} | bc "`, // print results
    "--query=' '",
    "--layout=reverse",
    `--bind='change:transform-header(echo {fzf:query} | bc 2>&1 >/dev/null)'`, // print bc stderr
    `--preview="echo {fzf:query} | tr ';' '\n';"`,
    "--info=right",
    "--prompt=''",
    "--separator=' '",
    "--bind='enter:clear-query'",
    "--border=rounded", // Set a rounded border for the fzf window
    "--preview-label=' Basic calculator(bc) '",
    "--color=bg+:-1,border:cyan", // Set colors for background and border
    "--bind='ctrl-a:become(jiffy -m Apps)'",
  ];

  switch (USER_ARGUMENTS.preset) {
    case "1":
      fzfArgs.push("--preview-window=bottom,90%,wrap,border-top");
      break;
    case "2":
      fzfArgs.push("--preview-window=top,90%,wrap,border-bottom");
      break;
    case "3":
      fzfArgs.push("--preview-window=right,50%,wrap,border-left");
      break;
    case "4":
      fzfArgs.push("--preview-window=left,50%,wrap,border-right");
      break;
  }

  const fzfBc = new ProcessSync(
    fzfArgs, // Arguments for the fzf command
    {
      input: "", // Pass the formatted options as input to fzf
      useShell: true, // Allow the use of shell commands in the fzf command
    },
  );

  fzfBc.run();
}
