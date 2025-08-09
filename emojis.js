import { ProcessSync } from "../qjs-ext-lib/src/process.js";
import { Emojies } from "./ASCIINulSeperatedString.js";
import Fzf from "../justjs/fzf.js";
import { getWindowSize, handleFzfExec, setCommonFzfArgs } from "./utils.js";


export default async function Emojis() {

  // Retrieve the icon size from the global user arguments (this will influence the display format)
  const iconSize = USER_ARGUMENTS.iconSize; // WxH
  const [width, height] = getWindowSize();
  const topMargin = parseInt(height / 2 - (iconSize / 2))
  const iconPlacement = `${iconSize}x${iconSize}@${width - iconSize * 2}x${topMargin > 4 ? topMargin : 5}`
  const fzfArgs = new Fzf()
    .read0()
    .infoCommand('"echo {} | head -n 2 | tail -n 1"')
    .preview('"echo {} | head -n 3 | tail -n 1"')
    .withNth(1)
    .delimiter('"\n"')
    .previewWindow("down,1,wrap,border-top")
    .info("right")
    .color("16,border:cyan")
    .query("' '")
    // .query(iconPlacement)
    .prompt("''")
    .bind(
      `"enter:execute-silent(echo {} | head -n 1 | cut -d ' ' -f 1 | ${USER_ARGUMENTS.clipboard})+abort"`,
    )
  // .bind(
  //   `'focus:execute-silent(kitty icat --clear --transfer-mode=memory --unicode-placeholder --stdin=no --scale-up --place=${iconPlacement}` +
  //   ` $(echo {} | tail -n 1 | cut -d" " -f1) >>/dev/tty && echo {} | head -n 2 | tail -n 1)'`
  // )

  setCommonFzfArgs(fzfArgs);

  const emojiesFzf = new ProcessSync(
    fzfArgs.toArray(),
    {
      input: Emojies.split('\0').map(e => {
        const codepoint = [...e.split(' ')[0]].map(c => c.codePointAt(0).toString(16)).join('-');
        const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${codepoint}.svg`;
        return e.concat('\n', url)
      }).join('\0'),
      useShell: true,
    },
  );

  await handleFzfExec(emojiesFzf);
}
