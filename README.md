
# Jiffy

Jiffy is an application launcher and command palette. By default, it helps you quickly launch apps, but it also supports custom commands and menus. It provides a command palette interface where you can easily execute system commands or launch specific applications.

<br>

![pic1](https://github.com/user-attachments/assets/fb58cd8a-eecb-415b-b60d-d5f6121ff3d2)
![pic2](https://github.com/user-attachments/assets/5860b98b-a35c-492f-aa33-7c0e95501e5c)

<br>

![pic3](https://github.com/user-attachments/assets/924722ab-d423-4f21-b59a-1a9ba6d9ce63)
![pic5](https://github.com/user-attachments/assets/801d6bee-7f2f-4b57-83a4-a7196115cf4c)

<br>

![pic4](https://github.com/user-attachments/assets/e5dda50a-74f9-4794-874f-3c7dd708c50f)
![pic6](https://github.com/user-attachments/assets/765cbf90-f7b8-479f-8688-ef904c98e7e4)

<br>

## Features

- **Application Launcher**: Quickly launch apps by filtering by name and keywords.
- **Command Palette**: Execute system commands or scripts easily from a customizable menu.
- **Custom Menus**: Create a personalized `menu.jsonc` configuration to define custom actions like shutdown, reboot, or sleep.
- **Customizable UI**: Adjust icon sizes, UI presets, and inject custom JavaScript for personalized behavior.
- **fzf Integration**: Built on the fzf tool for fast, fuzzy searching and selection.

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

### System Requirements

- **Kitty Terminal**
- **fzf** (for fuzzy searching)

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
