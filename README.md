<div align = center>
<h1> Jiffy </h1>
| App launcher | Basic calculator | Emoji picker | Custom command palette and launcher |
</div>

**Launcher**
<br>
![jiffyApp](https://github.com/user-attachments/assets/870417da-0ad7-456d-97d0-571884f3ca00)
<br>

### System Requirements

- **Kitty Terminal**(optional) : For displaying app icon images.
- **fzf** : For fuzzy searching.
- **bc** : Basic calculator, present in GNU core utils, for calculator.
  
## Installation

- You can download the precompiled binary of Jiffy from the [GitHub Releases page](https://github.com/5hubham5ingh/jiffy/releases).

- Move the binary to a directory included in your system's `PATH` (e.g., `/usr/local/bin` or `~/bin`).

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
    cd jiffy &&
    qjsc -flto main.js -o jiffy
    ```

## Configuration

Jiffy allows you to define custom menus in a `menu.jsonc` file. This file can be placed in your `~/.config/jiffy/` directory. The menu follows the JSONC format, where you can specify different system actions like shutdown, reboot, sleep, and other commands.

### Example `menu.jsonc`

```jsonc
{
  "Power Menu": [
    {
      "name": "Shutdown",
      "exec": "shutdown -P now",
      "description": "System shutdown."
    },
    {
      "name": "Sleep",
      "exec": "shutdown -H now",
      "description": "System sleep."
    },
    {
      "name": "Reboot",
      "exec": "shutdown -r now",
      "description": "System reboot."
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

This example defines a "Power Menu" with shutdown, reboot, and sleep options. The `exec` field specifies the command to run, and the `description` gives a brief explanation of each option.

## Usage

You can launch Jiffy by running the following command:

```bash
jiffy [ARG] ...
```

### Options

|   Shortcut          |  Option      | Default                                                   | Description                                                |
| ------------------------- | -------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| `-m`| `--mode VAL`                  | `Apps`                                                    | Set the mode of commands from predefined modes (e.g., Apps, Power Menu). |
| `-s`| `--icon-size NUM`            | `5`                                                        | Set the app's icon cell size.                              |
| `-p`| `--preset VAL`               | `1`                                                        | Start with UI preset. Available presets: `1`, `2`, `3`.     |
| `-c`| `--(no-)print-category`        | -                                                         | Print app's category when listing apps.                    |
| `-f`| `--fzf-args VAL (+)`         | -                                                         | Custom arguments for fzf. Can be set multiple times.       |
| `-r`| `--(no-)cache`              | Enabled (default)                                         | Cache the application list. Set to `--no-cache` to disable.|
| `-i`| `--inject JS`                | -                                                         | Inject JavaScript code to run at startup.                  |
| `-h`             | `--help` | -                                                         | Print help text.                                           |
| `--version`                | `--version` | -                                                      | Print the current version.                                 |

### Examples

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

   This example changes the UI preset and removes the window margin by injecting JavaScript.

## Todo
- Emoji picker.
- Calculator.
- Window switcher.

## FAQ

### Can I customize the menu options?

Yes, you can modify the `menu.jsonc` file to define your custom menus and actions. This file can be created or edited in `~/.config/jiffy/menu.jsonc`.

### What happens if I don't specify a menu?

By default, Jiffy starts in "Apps" mode, which will list all applications available on your system for launching.

### How do I use the command palette?

Once Jiffy is running, you can quickly search and run commands defined in your `menu.jsonc` or use fzf to find and launch apps. You can switch between predefined modes like "Apps" and "Power Menu" with the `-m` option.

## License

Jiffy is licensed under the MIT License. See `LICENSE` for more information.

---

Feel free to contribute or open issues if you encounter any problems or have suggestions for new features.
