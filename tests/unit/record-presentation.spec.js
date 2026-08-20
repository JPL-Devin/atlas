import { test, expect } from '@playwright/test'

import { resolvePresentation } from '../../src/core/recordPresentation'

import cassini from '../fixtures/records/cassini-iss.json'
import goNims from '../fixtures/records/go-nims-sparse.json'
import mars2020Navcam from '../fixtures/records/mars2020-navcam.json'
import messNoBrowse from '../fixtures/records/mess-no-browse.json'
import mgsMoc from '../fixtures/records/mgs-moc.json'
import mslPds3 from '../fixtures/records/msl-pds3-mastcam.json'
import mslPds4 from '../fixtures/records/msl-pds4.json'

const labels = (presentation) => presentation.tiles.map((t) => t.label)
const valueOf = (presentation, label) => {
    const tile = presentation.tiles.find((t) => t.label === label)
    return tile ? tile.value : null
}

test.describe('resolvePresentation', () => {
    test('msl pds3 keeps sol, site and drive', () => {
        const p = resolvePresentation(mslPds3)
        expect(valueOf(p, 'Sol')).toBe('2407')
        expect(valueOf(p, 'Site')).toBe('75')
        expect(valueOf(p, 'Drive')).toBe('1420')
        expect(p.caption).toBe('MAHLI · Sol 2407 · Site 75 · Drive 1420')
        expect(p.shortCaption).toBe('MAHLI · Sol 2407')
    })

    test('msl pds4 drops the surface tiles it has no normalized path for', () => {
        const p = resolvePresentation(mslPds4)
        expect(labels(p)).not.toContain('Sol')
        expect(labels(p)).not.toContain('Site')
        expect(labels(p)).not.toContain('Drive')
        // The caption fragment referencing the missing instrument drops whole,
        // leaving no separator artifact behind.
        expect(p.caption).toBe('Mars')
        expect(valueOf(p, 'Start time')).toBe('2012-12-25 18:07:49Z')
    })

    test('mars 2020 renders rover geometry with units', () => {
        const p = resolvePresentation(mars2020Navcam)
        expect(valueOf(p, 'Sol')).toBe('818')
        expect(valueOf(p, 'Local true solar time')).toBe('14:28:56')
        expect(valueOf(p, 'Instrument elevation')).toBe('-32.9°')
        expect(p.caption).toContain('NAVCAM_RIGHT')
        expect(p.caption).toContain('14:28:56 LTST')
    })

    test('raws overrides mars 2020 navcam without touching the shared profile', () => {
        const atlas = resolvePresentation(mars2020Navcam)
        const raws = resolvePresentation(mars2020Navcam, { instance: 'raws' })
        expect(raws.caption.startsWith('Navcam Right')).toBe(true)
        expect(atlas.caption.startsWith('Navcam Right')).toBe(false)
        expect(raws.tiles.length).toBe(6)
        expect(raws.tiles.length).toBeLessThan(atlas.tiles.length)
    })

    test('mgs orbiter uses orbit and drops the N/A filter', () => {
        const p = resolvePresentation(mgsMoc)
        expect(valueOf(p, 'Orbit')).toBe('2272')
        expect(valueOf(p, 'Location')).toBe('56.83, -95.86')
        expect(labels(p)).not.toContain('Sol')
        expect(p.caption).toBe('MOC Wide Angle · orbit 2272 · Mars')
    })

    test('cassini sentinel geometry drops out', () => {
        const p = resolvePresentation(cassini)
        expect(labels(p)).not.toContain('Incidence angle')
        expect(labels(p)).not.toContain('Emission angle')
        expect(labels(p)).not.toContain('Target distance')
        expect(valueOf(p, 'Instrument')).toBe('VIMS')
    })

    test('sparse records still render tiles and a caption', () => {
        const p = resolvePresentation(goNims)
        expect(p.tiles.length).toBeGreaterThan(0)
        expect(p.caption).toBeTruthy()
        expect(p.emptyState).toBe('no_browse_generic')
    })

    test('no-browse messenger record gets the spectrometer empty state', () => {
        const p = resolvePresentation(messNoBrowse)
        expect(p.emptyState).toBe('no_browse_spectrometer')
        expect(valueOf(p, 'Incidence angle')).toBe('32.7°')
    })

    test('resolved output never exposes paths or template source', () => {
        const p = resolvePresentation(mars2020Navcam, { instance: 'raws' })
        const serialized = JSON.stringify(p)
        expect(serialized).not.toContain('gather.')
        expect(serialized).not.toContain('{{')
        expect(Object.keys(p.tiles[0]).sort()).toEqual(['label', 'shortLabel', 'value'])
    })

    test('tile count honours maxTiles and priorityTiles', () => {
        const p = resolvePresentation(mars2020Navcam)
        expect(p.tiles.length).toBeLessThanOrEqual(8)
        expect(p.priorityTiles).toBe(4)
    })
})
