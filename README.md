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

## Dependencies
- **fzf** for fuzzy search.
- **kitty terminal**(optional) for displaying app icons.
  
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

Jiffy allows you to define custom menus in `menu.jsonc` and `menu.js` files. These file should be
in your `~/.config/jiffy/` directory. The menu follows the JSON format.

### Example 


**1. `menu.jsonc`**

```jsonc
{
  "Power Menu": [
    {
      "name": "Shutdown",
      "exec": "shutdown -P now",
      "description": "System shutdown.",
    },
    {
      "name": "Sleep",
      "exec": "shutdown -H now",
      "description": "System sleep.",
    },
    {
      "name": "Reboot",
      "exec": "shutdown -r now",
      "description": "System reboot.",
    },
    {
      "name": "List scheduled shutdown.",
      "exec": "shutdown --show",
      "description": "List scheduled shutdown.",
      "terminal": true
    }
  ]
}
```

This example defines a "Power Menu" with shutdown, reboot, and sleep options.
The `exec` field specifies the command to run, and the `description` gives a
brief explanation of each option.

**2. `menu.js`**

```javascript
function getMenu() {
  return {
    "Hypr Windows": focusWindows(),
    "Hypr keybinds": hyprKeyBinds(),
  };
}

const hyprState = JSON.parse(await execAsync("hyprctl -j clients"));

function focusWindows() {
  return hyprState.map((window) => ({
    name: window.class,
    description: window.title.replace("#", "_"), // replacing # as it is the internal delimeter for fzf
    exec: `hyprctl dispatch focuswindow address:${window.address}`,
  }));
}

const hyprBinds = JSON.parse(await execAsync("hyprctl -j binds"));

function hyprKeyBinds() {
  const mods = generateModMaskMap();
  return hyprBinds.map((keyBind) => ({
    name: `${
      (mods[keyBind.modmask] ?? [])?.join(" + ").concat(" ")
    }${keyBind.key}`,
    description: `${keyBind.description}`,
    exec: `${keyBind.dispatcher} ${keyBind.arg}`,
  }));

  function generateModMaskMap() {
    const modMaskMap = {};

    function parseModMask(modmask) {
      const modifiers = [];
      if (modmask & 1) modifiers.push("SHIFT");
      if (modmask & 4) modifiers.push("CTRL");
      if (modmask & 8) modifiers.push("ALT");
      if (modmask & 64) modifiers.push("SUPER");
      return modifiers;
    }

    const validModifiers = [1, 4, 8, 64]; // Individual modifiers

    let validMasks = [0];

    for (const mod of validModifiers) {
      const newMasks = [];
      for (const mask of validMasks) {
        newMasks.push(mask | mod); // Combine with existing masks
      }
      validMasks = [...validMasks, ...newMasks];
    }

    validMasks = validMasks.filter((mask) => mask !== 0);

    for (const mask of validMasks) {
      modMaskMap[mask] = parseModMask(mask).reverse();
    }

    return modMaskMap;
  }
}

export default getMenu();
```

This example defines a dynamically generated menu for switching focus to another opened window and browse all key bind of `Hyprland`.

## Usage

You can launch Jiffy by running the following command:

```bash
jiffy [ARG] ...
```

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

Run `jiffy --help` to see more options.

### Keyboard Shortcuts

You can switch between any modes or UI presets using following
shotcut keys-

| Shortcut   | Action                                              |
| ---------- | --------------------------------------------------- |
| shift+tab  | Change UI preset                                    |
| tab        | Change mode                                         |
| mainMod+space     | Refresh application list for launcher        |
| mainMod+k  | Show all keybinds                                   |


## Todo

- icons for custom command, UI should adjust if there is no icons in the menu

---

Feel free to contribute or open issues if you encounter any problems or have
suggestions for new features.
