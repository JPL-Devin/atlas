/* global console */
// Reports WCAG contrast ratios for the record detail page's text pairs.
// Run with: node scripts/contrast-report.mjs
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))

// The theme and colour modules are ESM and pull in MUI, so read the hexes out
// of the source instead of importing them.
const swatches = (file) => {
    const source = fs.readFileSync(path.join(here, '..', file), 'utf8')
    const found = {}
    const re = /([A-Za-z0-9_]+):\s*'(#[0-9A-Fa-f]{6})'/g
    let m = re.exec(source)
    while (m != null) {
        if (found[m[1]] == null) found[m[1]] = m[2]
        m = re.exec(source)
    }
    return found
}

const hex = (value) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(value.trim())
    if (m == null) throw new Error(`not a hex colour: ${value}`)
    const n = parseInt(m[1], 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const rgba = (value) => {
    const m = /rgba?\(([^)]+)\)/.exec(value)
    if (m == null) return null
    const parts = m[1].split(',').map((p) => parseFloat(p))
    return { rgb: parts.slice(0, 3), alpha: parts.length > 3 ? parts[3] : 1 }
}

const parse = (value) => {
    const asRgba = rgba(value)
    if (asRgba != null) return asRgba
    return { rgb: hex(value), alpha: 1 }
}

const over = (fg, bg) => fg.rgb.map((c, i) => c * fg.alpha + bg.rgb[i] * (1 - fg.alpha))

const luminance = (rgb) => {
    const [r, g, b] = rgb.map((c) => {
        const s = c / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const ratio = (fgValue, bgValue) => {
    const bg = parse(bgValue)
    const fg = parse(fgValue)
    const composited = fg.alpha < 1 ? over(fg, bg) : fg.rgb
    const a = luminance(composited)
    const b = luminance(bg.rgb)
    const hi = Math.max(a, b)
    const lo = Math.min(a, b)
    return (hi + 0.05) / (lo + 0.05)
}

const g = swatches('src/themes/light.js')
const blue = g
const DARK_COLORS = swatches('src/pages/Record/filenameColors.js')

// [where, text colour, background, font px, bold, opacity]
const checks = [
    ['panel body text', g.grey0, g.grey800, 13, false],
    ['panel heading', g.grey0, g.grey800, 13, true],
    ['about-this-product paragraph', g.grey300, g.grey800, 12, false],
    ['tile label', g.grey400, g.grey850, 11, false],
    ['tile value', g.grey0, g.grey850, 13, false],
    ['tile sub-value', g.grey400, g.grey850, 11, false],
    ['field filter placeholder', g.grey400, g.grey800, 12, false],
    ['section heading', g.grey0, g.grey800, 13, true],
    ['section count', g.grey300, g.grey800, 12, false],
    ['row label', g.grey400, g.grey800, 12, false],
    ['row value', g.grey0, g.grey800, 12, false],
    ['citation body', g.grey300, g.grey800, 12, false],
    ['caption chip', g.grey100, g.grey700, 11, false],
    ['caption title', g.grey0, 'rgba(16,16,19,0.62)', 15, true],
    ['caption prose', g.grey150, 'rgba(16,16,19,0.62)', 12, false],
    ['caption author', g.grey400, 'rgba(16,16,19,0.62)', 11, false],
    ['viewer empty state', g.grey400, g.grey900, 13, false],
    ['action button label', g.grey0, g.grey850, 13, false],
    ['action button secondary', g.grey300, g.grey850, 13, false],
    ['version select', g.grey200, g.grey800, 12, false],
    ['filename * button', g.grey300, g.grey800, 12, false],
    ['filename segment label', g.grey300, g.grey800, 12, false],
    ['filename segment meaning', g.grey0, g.grey800, 12, false],
    ['filename segment description', g.grey400, g.grey800, 12, false],
    ['filename SIS reference', g.grey400, g.grey800, 11, false],
    ['filename hint', g.grey400, g.grey800, 11, false],
    ['primary action', g.grey0, blue.blue800, 13, false],
    // Title bar (light surface)
    ['title filename', '#000000', g.grey100, 16, true],
    ['title back/copy icon', '#000000', g.grey100, 20, false],
    ['title copy icon @ 0.65 rest', '#000000', g.grey100, 20, false, 0.65],
    ['title add-to-cart icon', '#1C67E3', g.grey100, 20, false],
    ['title download label', '#F6F6F6', '#1C67E3', 14, false],
    ['title ML chip', g.grey800, '#FF9800', 11, true],
]

Object.entries(DARK_COLORS).forEach(([name, value]) => {
    checks.push([`filename segment ${name}`, value, g.grey800, 17, false])
    checks.push([`filename segment ${name} (dimmed)`, value, g.grey800, 17, false, 0.7])
})

const required = (px, bold) => (px >= 24 || (bold && px >= 18.66) ? 3 : 4.5)

let failures = 0
checks.forEach(([where, fg, bg, px, bold, opacity]) => {
    const colour =
        opacity == null
            ? fg
            : `rgba(${hex(fg).join(',')},${opacity})`
    const value = ratio(colour, bg)
    const need = required(px, bold)
    const pass = value >= need
    if (!pass) failures += 1
    console.log(
        `${pass ? 'PASS' : 'FAIL'}  ${value.toFixed(2)}:1  (needs ${need}:1)  ${where}  ${fg} on ${bg}${
            opacity != null ? ` @ ${opacity}` : ''
        }`
    )
})
console.log(`\n${checks.length} pairs, ${failures} below threshold`)
