import { ansi } from "../justjs/ansiStyle.js"
import { hsvToRgb, rgbToHex, rgbToHsl } from "../justjs/color.js"
import { printf } from "std"
import { ttyGetWinSize } from "../qjs-ext-lib/src/os.js"
import { Border, style } from "../justjs/style.js"
import { handleKeysPress, keySequences } from "../justjs/terminal.js"
import { clearTerminal, cursorHide, cursorShow, cursorTo } from "../justjs/cursor.js"
import { app, predefinedMenuItem } from "./main.js"
import { ProcessSync } from "../qjs-ext-lib/src/process.js"

const SELECTED_MODE = { rgb: 'rgb', hsv: 'hsv', hex: 'hex', hsl: 'hsl' }
const SELECTED_SECTION = { hues: 'hues', saturations: 'saturations', values: 'values', result: 'result' }
const BORDER_CHARS = {
  double: { x: "═", y: "║", tl: "╔", tr: "╗", bl: "╚", br: "╝" },
  rounded: { x: "─", y: "│", tl: "╭", tr: "╮", bl: "╰", br: "╯" },
}

const state = {
  selectedHue: 0,
  selectedSaturation: 0,
  selectedValue: 0,
  selectedMode: SELECTED_MODE.rgb,
  currentFocus: SELECTED_SECTION.hues,
  selectedColor: {
    h: 50,
    s: 50,
    v: 50
  },
  showKeybinds: true
}

const [terminalWidth, _terminalHeight] = ttyGetWinSize()

export async function colorPicker() {
  const focusNextSection = () => {
    switch (state.currentFocus) {
      case SELECTED_SECTION.hues: state.currentFocus = SELECTED_SECTION.saturations; break;
      case SELECTED_SECTION.saturations: state.currentFocus = SELECTED_SECTION.values; break;
      case SELECTED_SECTION.values: state.currentFocus = SELECTED_SECTION.result; break;
      case SELECTED_SECTION.result: state.currentFocus = SELECTED_SECTION.hues; break;
    }
    renderUI()
  }

  const focusPrevSection = () => {
    switch (state.currentFocus) {
      case SELECTED_SECTION.hues: state.currentFocus = SELECTED_SECTION.result; break;
      case SELECTED_SECTION.saturations: state.currentFocus = SELECTED_SECTION.hues; break;
      case SELECTED_SECTION.values: state.currentFocus = SELECTED_SECTION.saturations; break;
      case SELECTED_SECTION.result: state.currentFocus = SELECTED_SECTION.values; break;
    }
    renderUI()
  }

  const focusNextHueValue = () => state.selectedColor.h = (state.selectedColor.h + 1) % 360;
  const focusPrevHueValue = () => state.selectedColor.h = (state.selectedColor.h + 359) % 360;

  const focusNextSaturationValue = () => state.selectedColor.s = (state.selectedColor.s + 1) % 101;
  const focusPrevSaturationValue = () => state.selectedColor.s = (state.selectedColor.s + 100) % 101;

  const focusNextValueValue = () => state.selectedColor.v = (state.selectedColor.v + 1) % 101;
  const focusPrevValueValue = () => state.selectedColor.v = (state.selectedColor.v + 100) % 101;

  const focusNextResultValue = () => {
    const index = Object.values(SELECTED_MODE).indexOf(state.selectedMode);
    state.selectedMode = Object.values(SELECTED_MODE)[(index + 1) % Object.keys(SELECTED_MODE).length];
  }

  const focusPrevResultValue = () => {
    const modes = Object.values(SELECTED_MODE);
    const index = modes.indexOf(state.selectedMode);
    state.selectedMode = modes[(index - 1 + modes.length) % modes.length];
  }

  const focusNextColorValue = () => {
    switch (state.currentFocus) {
      case SELECTED_SECTION.hues: focusNextHueValue(); break;
      case SELECTED_SECTION.saturations: focusNextSaturationValue(); break;
      case SELECTED_SECTION.values: focusNextValueValue(); break;
      case SELECTED_SECTION.result: focusNextResultValue(); break;
    }
    renderUI()
  }

  const focusPrevColorValue = () => {
    switch (state.currentFocus) {
      case SELECTED_SECTION.hues: focusPrevHueValue(); break;
      case SELECTED_SECTION.saturations: focusPrevSaturationValue(); break;
      case SELECTED_SECTION.values: focusPrevValueValue(); break;
      case SELECTED_SECTION.result: focusPrevResultValue(); break;
    }
    renderUI()
  }

  const focusSection = (sectionNumber) => {
    switch (sectionNumber) {
      case '1': state.currentFocus = SELECTED_SECTION.hues; break;
      case '2': state.currentFocus = SELECTED_SECTION.saturations; break;
      case '3': state.currentFocus = SELECTED_SECTION.values; break;
      case '4': state.currentFocus = SELECTED_SECTION.result; break;
    }
    renderUI()
  }

  const toggleKeybindView = () => {
    if (state.showKeybinds) {
      showKeybinds()
    } else {
      printf(clearTerminal)
      renderUI()
    }
    state.showKeybinds = !state.showKeybinds
  }

  const chooseSelected = async (_, quit) => {
    const { h, s, v } = state.selectedColor
    let result;
    switch (state.selectedMode) {
      case SELECTED_MODE.hex: {
        const { r, g, b } = hsvToRgb(h, s, v)
        result = rgbToHex(parseInt(r), parseInt(g), parseInt(b))
        break;
      }
      case SELECTED_MODE.hsv: {
        result = `${h},${s},${v}`
        break;
      }
      case SELECTED_MODE.rgb: {
        const { r, g, b } = hsvToRgb(h, s, v)
        result = `${parseInt(r)},${parseInt(g)},${parseInt(b)}`
      }
      case SELECTED_MODE.hsl: {
        const { r, g, b } = hsvToRgb(h, s, v)
        const hsl = rgbToHsl(parseInt(r), parseInt(g), parseInt(b))
        result = `${Math.round(hsl.h * 360)},${Math.round(hsl.s * 100)},${Math.round(hsl.l * 100)}`
      }
    }

    const clipboard = new ProcessSync(USER_ARGUMENTS.clipboard, {
      input: result
    })
    clipboard.run()
    quit()
  }

  print(cursorHide, clearTerminal)
  renderUI()

  let changeMode;
  await handleKeysPress({
    'j': focusNextSection,
    [keySequences.ArrowDown]: focusNextSection,
    'k': focusPrevSection,
    [keySequences.ArrowUp]: focusPrevSection,
    'h': focusPrevColorValue,
    [keySequences.ArrowLeft]: focusPrevColorValue,
    'l': focusNextColorValue,
    [keySequences.ArrowRight]: focusNextColorValue,
    [keySequences.numbers]: focusSection,
    [keySequences.Enter]: chooseSelected,
    'H': () => { focusNextHueValue(); renderUI() },
    'S': () => { focusNextSaturationValue(); renderUI() },
    'V': () => { focusNextValueValue(); renderUI() },
    'R': () => { focusNextResultValue(); renderUI() },
    '?': toggleKeybindView,
    [keySequences.Tab]: (_, q) => { changeMode = predefinedMenuItem[predefinedMenuItem.findIndex(m => m === "Colors") + 1]; q() },
    [keySequences["Ctrl+J"]]: (_, q) => { changeMode = "Jiffy menu"; q() },
    'q': (_, q) => q(),
  })

  print(ansi.style.reset, cursorShow, clearTerminal)
  if (changeMode) {
    USER_ARGUMENTS.mode = changeMode;
    await app()
  }
}

function renderUI() {
  printf(cursorTo(0, 0))
  // const topBorder = BORDER_CHARS.rounded.tl + BORDER_CHARS.rounded.x.repeat(terminalWidth - 2) + BORDER_CHARS.rounded.tr
  // printf(topBorder)
  generateHues().forEach(printf)
  displayColorSections().forEach(printf)
  printf(generateResultsView())
}


const showKeybinds = () => {
  const keyDescriptions = [
    "j / ↓ │ Focus next section",
    "k / ↑ │ Focus previous section",
    "h / ← │ Decrease current value",
    "l / → │ Increase current value",
    "1 │ Focus hues section",
    "2 │ Focus saturation section",
    "3 │ Focus value section",
    "4 │ Focus result section",
    "H │ Increment hue manually",
    "S │ Increment saturation",
    "V │ Increment value",
    "R │ Cycle result mode (RGB/HEX)",
    "Enter │ Confirm selection & quit",
    "q │ Quit"
  ]

  const { [0]: terminalWidth } = ttyGetWinSize()
  const view = []
  let currentLine = []

  const renderCurrentLine = () => {
    const styledChunks = currentLine.map(item =>
      ` ${ansi.bgHex('#b3b3b3')}${ansi.hex('#000000')}${ansi.style.bold}${item}${ansi.style.reset} `
    )
    const lineStr = styledChunks.join('')
    const visibleLength = lineStr.replace(/\x1b\[[0-9;]*m/g, '').length
    const padding = " ".repeat(Math.max(0, Math.floor((terminalWidth - visibleLength) / 2)))
    view.push(padding + lineStr + '\n')
    currentLine = []
  }

  for (const keyBind of keyDescriptions) {
    const testLine = [...currentLine, keyBind]
    const testStyled = testLine.map(item =>
      ` ${ansi.bgHex('#b3b3b3')}${ansi.hex('#000000')}${ansi.style.bold}${item}${ansi.style.reset} `
    ).join('')
    const testVisibleLength = testStyled.replace(/\x1b\[[0-9;]*m/g, '').length

    if (testVisibleLength > terminalWidth && currentLine.length > 0) {
      renderCurrentLine()
    }

    currentLine.push(keyBind)
  }

  if (currentLine.length > 0) renderCurrentLine()

  print("\n")
  view.forEach(printf)
  print("\n")
}
function createBorderLine(borderChar, length) {
  return borderChar.x.repeat(length)
}

function createBorders(borderStyle, contentWidth) {
  const horizontalBorder = createBorderLine(borderStyle, contentWidth)
  const topBorder = borderStyle.tl + horizontalBorder + borderStyle.tr + '\n'
  const bottomBorder = ansi.style.reset + borderStyle.bl + horizontalBorder + borderStyle.br + '\n'
  return { topBorder, bottomBorder }
}

function addCenterPadding(content, totalWidth) {
  const contentLength = content.replace(/\x1b\[[0-9;]*m/g, '').length
  return ' '.repeat(Math.max(0, (totalWidth - contentLength) / 2))
}

function generateHues() {
  const currentBorder = SELECTED_SECTION.hues === state.currentFocus ? BORDER_CHARS.double : BORDER_CHARS.rounded
  const uniqueHues = new Set()
  const output = []
  let hueCount = 0
  let startOffset = 0
  let maxLineLength = 0

  const hueStep = Math.ceil(360 / (terminalWidth - 2))

  while (hueCount < 360) {
    let currentHue = `${ansi.style.reset}${currentBorder.y} `
    let currentLineLength = 0

    for (let hue = startOffset; hue < 360; hue += hueStep, hueCount++, currentLineLength++) {
      const { r, g, b } = hsvToRgb(hue, 100, 100)
      const hexColor = rgbToHex(r, g, b)
      const colorBlock = `${hue === state.selectedColor.h ? ansi.hex('#000000') : ansi.hex(hexColor)}█`

      if (!uniqueHues.has(colorBlock)) {
        uniqueHues.add(colorBlock)
        currentHue += colorBlock
      }

      maxLineLength = Math.max(maxLineLength, currentLineLength)
    }

    currentHue += `${ansi.style.reset} ${currentBorder.y}\n`
    output.push(currentHue)
    startOffset++
  }

  const { topBorder, bottomBorder } = createBorders(currentBorder, maxLineLength + 3)
  output.unshift(topBorder)
  output.push(bottomBorder)


  const padding = addCenterPadding(topBorder, terminalWidth)
  return output.map(l => padding + l)
  for (const line of output) {
    printf(padding + line)
  }
}

function generateColorRange(type, viewWidth) {
  const colorBlocks = []

  for (let i = 0; i < 100; i++) {
    let r, g, b
    if (type === SELECTED_SECTION.saturations) {
      ({ r, g, b } = hsvToRgb(state.selectedColor.h, i, state.selectedColor.v))
    } else { // value
      ({ r, g, b } = hsvToRgb(state.selectedColor.h, state.selectedColor.s, i))
    }

    const hexColor = rgbToHex(r, g, b)
    const isSelected = (type === SELECTED_SECTION.saturations)
      ? i === state.selectedColor.s
      : i === state.selectedColor.v
    const colorBlock = `${isSelected ? ansi.hex('#000000') : ansi.hex(hexColor)}█`
    colorBlocks.push(colorBlock)
  }

  const currentBorder = state.currentFocus === type ? BORDER_CHARS.double : BORDER_CHARS.rounded
  return createColorDisplay(colorBlocks, viewWidth, currentBorder)
}

function createColorDisplay(colorBlocks, viewWidth, borderStyle) {
  const output = []
  const maxBlocksPerLine = viewWidth - 4

  if (colorBlocks.length > maxBlocksPerLine) {
    const { topBorder, bottomBorder } = createBorders(borderStyle, viewWidth - 2)
    output.push(topBorder)

    while (colorBlocks.length) {
      const line = colorBlocks.splice(0, maxBlocksPerLine)
      if (line.length < maxBlocksPerLine) {
        line.push(ansi.style.reset, " ".repeat(maxBlocksPerLine - line.length))
      }
      output.push(`${borderStyle.y} ${line.join('')}${ansi.style.reset} ${borderStyle.y}\n`)
    }

    output.push(bottomBorder)
  } else {
    const { topBorder, bottomBorder } = createBorders(borderStyle, colorBlocks.length + 2)
    const line = [borderStyle.y, ' ', ...colorBlocks, ansi.style.reset, ' ', borderStyle.y, '\n']
    output.push(topBorder, ...line, bottomBorder)
  }

  return output
}

function generateSaturation(viewWidth) {
  return generateColorRange(SELECTED_SECTION.saturations, viewWidth)
}

function generateValue(viewWidth) {
  return generateColorRange(SELECTED_SECTION.values, viewWidth)
}

function createColorValueBox(label, value) {
  return style(` ${label}:${value} `, {
    border: state.selectedMode === label ? Border.DOUBLE : Border.ROUNDED
  }).split('\n')
}


function generateResultsView() {
  const { h, s, v } = state.selectedColor
  const { r, g, b } = hsvToRgb(parseInt(h), parseInt(s), parseInt(v))
  const hexValue = rgbToHex(parseInt(r), parseInt(g), parseInt(b))
  const hslValue = rgbToHsl(parseInt(r), parseInt(g), parseInt(b))
  const hsvBox = createColorValueBox(SELECTED_MODE.hsv, `${parseInt(h)},${parseInt(s)},${parseInt(v)}`)
  const rgbBox = createColorValueBox(SELECTED_MODE.rgb, `${parseInt(r)},${parseInt(g)},${parseInt(b)}`)
  const hexBox = createColorValueBox(SELECTED_MODE.hex, hexValue)
  const hslBox = createColorValueBox(SELECTED_MODE.hsl, `${Math.round(hslValue.h * 360)},${Math.round(hslValue.s * 100)},${Math.round(hslValue.l * 100)}`)

  const totalBoxWidth = hsvBox[0].length + rgbBox[0].length + hexBox[0].length + hslBox[0].length

  const displayLines = []
  for (let i = 0; i < 3; i++) {
    const colorBar = ansi.rgb(parseInt(r), parseInt(g), parseInt(b)) +
      '█'.repeat(terminalWidth - totalBoxWidth - 8) +
      ' ' + ansi.style.reset
    displayLines.push(` ${rgbBox[i]} ${hsvBox[i]} ${hexBox[i]} ${hslBox[i]} ${colorBar}`)
  }
  return (style(displayLines.join('\n'), {
    border: state.currentFocus === SELECTED_SECTION.result ? Border.DOUBLE : Border.ROUNDED,
  }))
}


function displayColorSections() {
  const saturationOutput = generateSaturation(terminalWidth / 2)
  const valueOutput = generateValue(terminalWidth / 2)

  const saturationLines = saturationOutput.join('').split('\n')
  const valueLines = valueOutput.join('').split('\n')

  const combinedWidth = saturationLines[0].length + valueLines[0].length
  const padding = combinedWidth < terminalWidth
    ? ' '.repeat(parseInt((terminalWidth - combinedWidth) / 2))
    : ''

  const result = []
  for (let i = 0; i < saturationLines.length; i++) {
    result.push(`${padding}${saturationLines[i]}${valueLines[i]}${i !== saturationLines.length - 1 ? '\n' : ''}`)
  }
  return result
}


