<div align = center>
<h1 > Jiffy </h1>
𝐴𝑝𝑝 𝑙𝑎𝑢𝑛𝑐ℎ𝑒𝑟 | 𝐵𝑎𝑠𝑖𝑐 𝑐𝑎𝑙𝑐𝑢𝑙𝑎𝑡𝑜𝑟 | 𝐸𝑚𝑜𝑗𝑖 𝑝𝑖𝑐𝑘𝑒𝑟
   <br> 𝐶𝑢𝑠𝑡𝑜𝑚 𝑐𝑜𝑚𝑚𝑎𝑛𝑑 𝑝𝑎𝑙𝑙𝑒𝑡𝑡𝑒
</div>

---

**Launcher**
<br>
![jiffyApp](https://github.com/user-attachments/assets/870417da-0ad7-456d-97d0-571884f3ca00)
<br>

**Emojies**
<br>
![emoji](https://github.com/user-attachments/assets/049beca9-5769-42d4-892c-ac498dacafa1)
<br>

**Calculator**
<br>
![bc](https://github.com/user-attachments/assets/99d67870-8378-4988-8cef-38f3e16bc139)
<br>

### Dependencies

#### External

- **Kitty Terminal**(optional) : For displaying app icon images.
- **fzf** : For fuzzy searching.

#### GNU core utils

- **bc** : Basic calculator.
- **head** : Used in fzf's commands.
- **tail** : Same as above.
- **echo** : Same as above.
- **cut** : Same as above.
- **column** : Same as above.

## Installation

- You can download the precompiled binary of Jiffy from the
  [GitHub Releases page](https://github.com/5hubham5ingh/jiffy/releases).

- Move the binary to a directory included in your system's `PATH` (e.g.,
  `/usr/local/bin` or `~/bin`).

- After installing the binary, you can run jiffy from your terminal.

  ### Build from source
  - Install QuickJs compiler
    ```bash
    git clone --depth 1 https://github.com/bellard/quickjs.git &&
    cd quickjs &&
    make &&
    sudo make install &&
    ```
  - Get the Jiffy's source code and compile.
    ```bash
    git clone --depth 1 https://github.com/5hubham5ingh/jiffy.git &&
    git clone --depth 1 https://github.com/5hubham5ingh/justjs.git &&
    git clone --depth 1 https://github.com/ctn-malone/qjs-ext-lib.git &&
    cd jiffy &&
    qjsc -flto main.js -o jiffy &&
    sudo mv jiffy /usr/bin/
    ```

## Configuration

Jiffy allows you to define custom menus in a `menu.jsonc` file. This file can be
placed in your `~/.config/jiffy/` directory. The menu follows the JSONC format,
where you can specify different system actions like shutdown, reboot, sleep, and
other commands.

### Example `menu.jsonc`

```jsonc
{
  "Power Menu": [
    {
      "name": "Shutdown",
      "exec": "shutdown -P now",
      "description": "System shutdown.",
      "icon": "/home/ss/.config/jiffy/icons/shutdown.png"
    },
    {
      "name": "Sleep",
      "exec": "shutdown -H now",
      "description": "System sleep.",
      "icon": "/home/ss/.config/jiffy/icons/sleep.png"
    },
    {
      "name": "Reboot",
      "exec": "shutdown -r now",
      "description": "System reboot.",
      "icon": "/home/ss/.config/jiffy/icons/reboot.png"
    },
    {
      "name": "List scheduled shutdown.",
      "exec": "shutdown --show",
      "description": "List scheduled shutdown.",
      "icon": "/home/ss/.config/jiffy/icons/list.png",
      "terminal": true
    }
  ]
}
```

This example defines a "Power Menu" with shutdown, reboot, and sleep options.
The `exec` field specifies the command to run, and the `description` gives a
brief explanation of each option.

## Usage

You can launch Jiffy by running the following command:

```bash
jiffy [ARG] ...
```

### Options

| Option                    | Description                                                        | Possible Values                                                                  | Default            |
| ------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------ |
| -m, --mode VAL            | Set the mode of commands from modes predefined in the config file. | Apps, a, Basic calculator, bc, Emojies, e, Jiffy menu, j, +menus from menu.jsonc | Jiffy menu         |
| -s, --icon-size NUM       | App's icon cell size.                                              | Any integer                                                                      | 5                  |
| -p, --preset VAL          | Start with UI preset.                                              | 1, 2, 3                                                                          | 1                  |
| -x, --clipboard VAL       | Clipboard used for pasting the selected emoji.                     | Any valid clipboard command (e.g., `xsel`, `xclip`)                              | wl-copy            |
| -c, --(no-)print-category | Print app's category.                                              | `--print-category`, `--no-print-category`                                        | `--print-category` |
| --fzf-args VAL (+)        | Custom arguments for fzf.                                          | Any valid fzf argument                                                           |                    |
| -r, --(no-)refresh        | Cache the application list.                                        | `--refresh`, `--no-refresh`                                                      | `--no-refresh`     |
| -t, --terminal VAL        | Default terminal to launch terminal apps.                          | Any valid terminal command                                                       | kitty -1 --hold    |
| -i, --inject JS           | Inject JS code to run at startup.                                  | Any valid JavaScript code                                                        |                    |
| -h, --help                | print help                                                         |                                                                                  |                    |
| --version                 | print version                                                      |                                                                                  |                    |

#### Examples

1. **Hide prompt and app's category**:

   ```bash
   jiffy --fzf-args='--prompt=" "' -c
   ```

2. **Hide app description and refresh app's list**:

   ```bash
   jiffy --fzf-args="--preview-window=0" --no-cache
   ```

3. **Change UI preset and inject custom JS**:

   ```bash
   jiffy -p 2 -i 'OS.exec(["kitty", "@", "set-spacing", "margin=0"])'
   ```

   This example changes the UI preset and removes the window margin by injecting
   JavaScript.

### Keyboard Shortcuts

You can switch between any predefined modes or UI presets using following
shotcut keys-

| Shortcut   | Action                                              |
| ---------- | --------------------------------------------------- |
| ctrl+space | Change UI preset                                    |
| ctrl+e     | Emoji mode                                          |
| ctrl+j     | Jiffy menu                                          |
| ctrl+b     | Basic calculator                                    |
| ctrl+a     | App launcher                                        |
| ctrl+r     | Refresh system applications list (for app launcher) |

## Todo

- Clipboard manager.
- Keymap for showing keymap: MainMod + ?
- Custom command.js for window switching: Create a Window switching mode with list of all opened hyprland client window.
  Selecting one window will put focus on it using hyprctl
- refactor .dasktop file parsing.
- create fzf.js for fzf command creation

---

Feel free to contribute or open issues if you encounter any problems or have
suggestions for new features.
