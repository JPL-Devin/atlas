import { test, expect } from '@playwright/test'

import {
    defaultProfile,
    emptyStates,
    fields,
    icons,
    instanceProfiles,
    mappingSnapshot,
    profiles,
    sections,
} from '../../src/config/recordDetail'
import { FORMATTER_NAMES } from '../../src/core/recordPresentation'
import { TOKEN } from '../../src/core/recordPresentation/resolve'
import tileIcons from '../../src/pages/Record/Content/Views/Overview/tileIcons.js'

const ALLOWED_PATHS = new Set(mappingSnapshot.paths)
const CAPTION_KEYS = [
    'description',
    'caption',
    'shortCaption',
    'captionTitle',
    'captionChips',
    'altText',
    'citationAuthor',
    'citation',
]

// Every profile layer that can carry tiles/captions, flattened for iteration.
const layers = () => {
    const out = [{ name: '_default', layer: defaultProfile }]
    Object.entries(profiles).forEach(([name, layer]) => out.push({ name, layer }))
    Object.entries(instanceProfiles).forEach(([instance, profile]) => {
        Object.entries(profile.missions).forEach(([mission, missionLayer]) => {
            out.push({ name: `${instance}/${mission}`, layer: missionLayer })
            Object.entries(missionLayer.instruments || {}).forEach(([instrument, layer]) => {
                out.push({ name: `${instance}/${mission}/${instrument}`, layer })
            })
        })
    })
    return out
}

test.describe('record detail config', () => {
    test('field catalog only references normalized paths', () => {
        Object.keys(fields).forEach((path) => {
            expect(ALLOWED_PATHS.has(path), `${path} is not in the mapping snapshot`).toBe(true)
            expect(path.startsWith('gather.') || path.startsWith('archive.')).toBe(true)
        })
    })

    test('field catalog uses known formatters and has labels', () => {
        Object.entries(fields).forEach(([path, field]) => {
            expect(FORMATTER_NAMES, `${path} has an unknown formatter`).toContain(field.format)
            expect(field.label, `${path} has no label`).toBeTruthy()
        })
    })

    test('every tile path is catalogued', () => {
        layers().forEach(({ name, layer }) => {
            ;(layer.tiles || []).forEach((entry) => {
                const paths =
                    typeof entry === 'string'
                        ? [entry]
                        : [entry.path, entry.pair].filter((p) => p != null)
                expect(paths.length, `${name}: tile entry has no path`).toBeGreaterThan(0)
                paths.forEach((path) => {
                    expect(
                        fields[path],
                        `${name}: tile ${path} is not in the field catalog`
                    ).toBeTruthy()
                })
                if (typeof entry !== 'string' && entry.format != null)
                    expect(
                        FORMATTER_NAMES,
                        `${name}: tile ${entry.path} overrides with an unknown formatter`
                    ).toContain(entry.format)
            })
        })
    })

    test('every catalogued field has an icon the UI can render', () => {
        Object.entries(fields).forEach(([path, field]) => {
            expect(icons, `${path} has an unknown icon`).toContain(field.icon)
            expect(tileIcons[field.icon], `${field.icon} has no component`).toBeTruthy()
        })
    })

    test('every caption token is a catalogued path', () => {
        layers().forEach(({ name, layer }) => {
            CAPTION_KEYS.forEach((key) => {
                ;(layer[key] || []).forEach((fragment) => {
                    const paths = [...String(fragment).matchAll(new RegExp(TOKEN))].map(
                        ([, path]) => path
                    )
                    paths.forEach((path) => {
                        expect(
                            fields[path],
                            `${name}.${key}: {{${path}}} is not in the field catalog`
                        ).toBeTruthy()
                    })
                    // Only direct interpolation is supported — no conditionals.
                    expect(String(fragment)).not.toMatch(/\{\{\s*[#/]/)
                })
            })
        })
    })

    test('every profile declares a known empty state', () => {
        layers().forEach(({ name, layer }) => {
            if (layer.emptyState == null) return
            expect(emptyStates[layer.emptyState], `${name}: unknown empty state`).toBeTruthy()
        })
    })

    test('every section field is catalogued and every section has a title', () => {
        Object.entries(sections).forEach(([id, section]) => {
            expect(section.title, `${id} has no title`).toBeTruthy()
            expect(section.fields.length, `${id} has no fields`).toBeGreaterThan(0)
            section.fields.forEach((path) => {
                expect(fields[path], `${id}: ${path} is not in the field catalog`).toBeTruthy()
            })
        })
    })

    test('every profile references known sections', () => {
        layers().forEach(({ name, layer }) => {
            ;(layer.sections || []).forEach((id) => {
                expect(sections[id], `${name}: unknown section ${id}`).toBeTruthy()
            })
        })
    })

    test('tile lists are long enough to survive drop-out', () => {
        Object.entries(profiles).forEach(([name, profile]) => {
            const maxTiles = profile.maxTiles != null ? profile.maxTiles : 8
            expect(
                profile.tiles.length,
                `${name} cannot fill ${maxTiles} tiles`
            ).toBeGreaterThanOrEqual(maxTiles)
        })
    })
})
