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
const tileOf = (presentation, label) => presentation.tiles.find((t) => t.label === label)
const valueOf = (presentation, label) => {
    const tile = tileOf(presentation, label)
    return tile ? tile.value : null
}

test.describe('resolvePresentation', () => {
    test('msl pds3 keeps sol, site and drive', () => {
        const p = resolvePresentation(mslPds3)
        expect(valueOf(p, 'Sol')).toBe('2407')
        expect(valueOf(p, 'Site')).toBe('75')
        expect(valueOf(p, 'Drive')).toBe('1420')
        // No LMST in this record, so its tile and caption clause drop.
        expect(labels(p)).not.toContain('Local mean solar time')
        expect(p.caption).not.toContain('local mean solar time')
        expect(p.caption).toContain('on sol 2407')
        expect(p.caption).toContain('from site 75 drive 1420')
        expect(p.shortCaption).toBe('MAHLI, Sol 2407')
    })

    test('msl pds4 drops the surface tiles it has no normalized path for', () => {
        const p = resolvePresentation(mslPds4)
        expect(labels(p)).not.toContain('Sol')
        expect(labels(p)).not.toContain('Site')
        expect(labels(p)).not.toContain('Drive')
        // The caption fragment referencing the missing instrument drops whole,
        // leaving no separator artifact behind.
        expect(p.caption).toBe('Mars')
        // A tile asks for the compact format so the timestamp fits one line.
        expect(valueOf(p, 'Start time')).toBe('2012-12-25 18:07Z')
    })

    test('mars 2020 renders rover geometry with units', () => {
        const p = resolvePresentation(mars2020Navcam)
        expect(valueOf(p, 'Sol')).toBe('818')
        expect(valueOf(p, 'Local mean solar time')).toBe('14:19:46')
        expect(labels(p)).not.toContain('Local true solar time')
        expect(valueOf(p, 'Instrument elevation')).toBe('-32.9°')
        expect(p.caption).toContain('NAVCAM_RIGHT')
        expect(p.caption).toContain('14:19:46 local mean solar time')
    })

    test('landed at-a-glance leads with mission, spacecraft, instrument then sol, site, drive', () => {
        const p = resolvePresentation(mars2020Navcam)
        expect(labels(p).slice(0, 6)).toEqual([
            'Mission',
            'Spacecraft',
            'Instrument',
            'Sol',
            'Site',
            'Drive',
        ])
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
        expect(p.caption).toBe(
            'Imaged by MOC Wide Angle aboard Mars Global Surveyor, on orbit 2272, over Mars at 56.83, -95.86, during the Mapping mission phase'
        )
        expect(p.captionTitle).toBe('MOC Wide Angle, orbit 2272')
    })

    test('mission tiles use Atlas display names, spacecraft keeps its own name', () => {
        const mgs = resolvePresentation(mgsMoc)
        expect(valueOf(mgs, 'Mission')).toBe('Mars Global Surveyor')
        expect(valueOf(mgs, 'Spacecraft')).toBe('Mars Global Surveyor')
        expect(valueOf(resolvePresentation(mslPds3), 'Mission')).toBe('MSL')
        expect(valueOf(resolvePresentation(mslPds3), 'Spacecraft')).toBe('Curiosity')
        const m2020 = resolvePresentation(mars2020Navcam)
        expect(valueOf(m2020, 'Mission')).toBe('Mars 2020')
        expect(valueOf(m2020, 'Spacecraft')).toBe('Perseverance')
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
        expect(Object.keys(p.tiles[0]).sort()).toEqual([
            'icon',
            'inline',
            'label',
            'shortLabel',
            'sub',
            'value',
        ])
    })

    test('tile count honours maxTiles and priorityTiles', () => {
        const p = resolvePresentation(mars2020Navcam)
        expect(p.tiles.length).toBeLessThanOrEqual(12)
        expect(p.priorityTiles).toBe(6)
    })

    test('tiles carry icons, and sol and lmst stand alone on two lines', () => {
        const msl = resolvePresentation(mslPds3)
        expect(tileOf(msl, 'Sol').icon).toBe('sun')
        expect(tileOf(msl, 'Sol').sub).toBe(null)

        const m2020 = resolvePresentation(mars2020Navcam)
        expect(tileOf(m2020, 'Site').icon).toBe('place')
        expect(valueOf(m2020, 'Drive')).toBe('1469')
        expect(tileOf(m2020, 'Local mean solar time').sub).toBe(null)
    })

    test('azimuth pairs with elevation on one line', () => {
        const p = resolvePresentation(mars2020Navcam)
        const instrument = tileOf(p, 'Instrument elevation')
        expect(instrument.inline).toBe(true)
        expect(instrument.sub).toBe('az 0.2°')
        expect(tileOf(p, 'Solar elevation').inline).toBe(true)
    })

    test('citation names its author', () => {
        const p = resolvePresentation(mars2020Navcam)
        expect(p.citation.startsWith('NASA/JPL, ')).toBe(true)
    })

    test('citation never ends on dangling punctuation when a fragment drops', () => {
        ;[mars2020Navcam, mslPds3, mgsMoc, messNoBrowse].forEach((record) => {
            const citation = resolvePresentation(record).citation
            if (citation == null) return
            expect(citation).not.toMatch(/[,;·-]\s*$/)
            expect(citation).not.toMatch(/,\s*,/)
        })
    })

    test('caption chips resolve and drop whole when a path is missing', () => {
        const m2020 = resolvePresentation(mars2020Navcam)
        expect(m2020.captionChips).toContain('Sol 818')
        expect(m2020.captionChips).toContain('NAVCAM_RIGHT')

        const msl = resolvePresentation(mslPds3)
        expect(msl.captionChips).toContain('Site 75')
        expect(msl.captionChips).toContain('Drive 1420')

        // The pds4 fixture has no normalized instrument, so that chip is absent.
        const pds4 = resolvePresentation(mslPds4)
        expect(pds4.captionChips).toContain('Mars')
        expect(pds4.captionChips.length).toBeLessThan(4)
    })

    test('description clauses drop whole so the prose stays grammatical', () => {
        const m2020 = resolvePresentation(mars2020Navcam)
        expect(m2020.description).toContain('on sol 818')
        expect(m2020.description).not.toContain('undefined')
        expect(m2020.description).not.toMatch(/\s\./)

        // No normalized instrument on this record, so the lead sentence drops
        // and the rest still reads as prose.
        const pds4 = resolvePresentation(mslPds4)
        expect(pds4.description).not.toContain('aboard')
        expect(pds4.description.startsWith('It observes Mars.')).toBe(true)
    })

    test('sections carry only fields with a valid normalized value', () => {
        const p = resolvePresentation(mslPds3)
        const ids = p.sections.map((s) => s.id)
        expect(ids).toContain('identification')
        expect(ids).toContain('geometry_surface')
        const identification = p.sections.find((s) => s.id === 'identification')
        // Mission is a tile with the same value, so it doesn't repeat as a row.
        expect(identification.rows.some((row) => row.label === 'Mission')).toBe(false)
        expect(identification.rows.some((row) => row.label === 'Product ID')).toBe(true)
        p.sections.forEach((section) => {
            expect(section.rows.length).toBeGreaterThan(0)
            section.rows.forEach((row) => {
                expect(row.value).toBeTruthy()
                expect(String(row.value)).not.toContain('undefined')
            })
        })

        // An orbiter never gets a surface geometry section, and vice versa.
        const mgs = resolvePresentation(mgsMoc)
        expect(mgs.sections.map((s) => s.id)).not.toContain('geometry_surface')
    })

    test('the catch-all section adds normalized metadata without the raw labels', () => {
        const p = resolvePresentation(mars2020Navcam)
        const other = p.sections.find((s) => s.id === 'other')
        expect(other.rows.length).toBeGreaterThan(0)

        const configured = p.sections
            .filter((s) => s.id !== 'other')
            .reduce((all, s) => all.concat(s.rows.map((r) => r.label)), [])
        const tiles = p.tiles.map((t) => t.value)

        other.rows.forEach((row) => {
            expect(configured).not.toContain(row.label)
            expect(tiles).not.toContain(row.value)
            expect(String(row.value)).not.toContain('undefined')
        })

        // Nothing out of the pds4/pds3 label trees leaks in.
        const inLabel = Object.keys(mars2020Navcam.pds4_label || {})
        expect(other.rows.some((row) => inLabel.includes(row.label))).toBe(false)
        expect(other.rows.some((row) => row.label === 'Instrument category')).toBe(true)
    })

    test('a sub-line drops on its own when its field is missing', () => {
        const p = resolvePresentation(mars2020Navcam)
        const sol = tileOf(p, 'Sol')
        expect(sol.value).toBeTruthy()
        expect(sol.sub).toBe(null)
    })
})
