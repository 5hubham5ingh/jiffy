import { ProcessSync } from "../qjs-ext-lib/src/process.js";
import { getFzfCommonArgs, getKeyBinds, handleFzfExec } from "./utils.js";

export default async function fzfKeymaps() {
  const keyMaps = getKeyBinds()
    .map(([mode, _, keyBind]) => [keyBind, mode]);
  keyMaps.push(
    ["tab", "Switch to next mode"],
    ["shift-tab", "Switch to next UI preset"],
    [
      `${USER_ARGUMENTS.modKey}-space`,
      "Refresh application list for launcher.",
    ],
  );

  const maxKeymapLength = keyMaps.reduce(
    (length, [keyMap]) => length > keyMap.length ? length : keyMap.length,
    0,
  );

  const keyMapsStr = keyMaps.map(([keyBind, mode]) =>
    `${keyBind.padEnd(maxKeymapLength)} : ${mode}`
  ).join("\0");

  const fzfArgs = [
    "fzf",
    "--prompt='Keybinds: '",
    "--read0",
    "--info=hidden",
    `--marker=""`,
    `--pointer=""`,
    ...getFzfCommonArgs(),
  ];

  const fzfRun = new ProcessSync(
    fzfArgs,
    {
      input: keyMapsStr,
      useShell: true,
    },
  );

  await handleFzfExec(fzfRun);
}
