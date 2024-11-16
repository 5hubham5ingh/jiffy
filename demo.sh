#!/usr/bin/env bash

list=("firefox" "kitty -1 btop" "nautilus" "obs")

selected_command=$(printf "%s\n" "${list[@]}" | fzf)

$selected_command &
disown
