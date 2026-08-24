import { test, expect } from '@playwright/test'

import { parseFilename, resolveFilenameSpec } from '../../src/core/recordPresentation'
import { filenameSpecs } from '../../src/config/recordDetail'

import mars2020Navcam from '../fixtures/records/mars2020-navcam.json'
import mslPds3 from '../fixtures/records/msl-pds3-mastcam.json'
import mgsMoc from '../fixtures/records/mgs-moc.json'

const m20 = filenameSpecs.mars_2020

const parse = (filename) => parseFilename(filename, m20)
const segment = (parsed, label) => parsed.pieces.find((p) => p.label === label)
const valueOf = (parsed, label) => {
    const piece = segment(parsed, label)
    return piece ? piece.text : null
}
const meaningOf = (parsed, label) => {
    const piece = segment(parsed, label)
    return piece ? piece.meaning : null
}

test.describe('resolveFilenameSpec', () => {
    test('only missions with a spec get one', () => {
        expect(resolveFilenameSpec({ mission: 'mars_2020', pds_standard: 'pds4' })).toBe(m20)
        expect(resolveFilenameSpec({ mission: 'msl', pds_standard: 'pds3' })).toBe(null)
        expect(resolveFilenameSpec({})).toBe(null)
    })
})

test.describe('parseFilename', () => {
    test('splits a real Navcam RDR into its SIS fields', () => {
        const parsed = parse('NRM_0818_0739564747_023IDM_N0391469VCE_16000_0A02LLJ02.IMG')
        expect(valueOf(parsed, 'Instrument')).toBe('NR')
        expect(meaningOf(parsed, 'Instrument')).toBe('Navcam Right')
        expect(meaningOf(parsed, 'Color / filter')).toBe('Grayscale (monochrome / panchromatic)')
        expect(meaningOf(parsed, 'Special processing')).toBe('Nominal processing')
        expect(valueOf(parsed, 'Sol')).toBe('0818')
        expect(meaningOf(parsed, 'Sol')).toBe('Sol 818')
        expect(meaningOf(parsed, 'Venue')).toBe('Flight (surface or cruise)')
        expect(meaningOf(parsed, 'Spacecraft clock')).toBe('SCLK 739564747 seconds')
        expect(meaningOf(parsed, 'Milliseconds')).toBe('23 ms')
        expect(valueOf(parsed, 'Product type')).toBe('IDM')
        expect(meaningOf(parsed, 'Product type')).toBe('RDR — miscellaneous product')
        expect(meaningOf(parsed, 'Thumbnail')).toContain('not a thumbnail')
        expect(meaningOf(parsed, 'Site')).toBe('Site 39')
        expect(meaningOf(parsed, 'Drive')).toBe('Drive 1469')
        expect(valueOf(parsed, 'Sequence ID')).toBe('VCE_16000')
        expect(valueOf(parsed, 'Camera specific')).toBe('_0A0')
        expect(meaningOf(parsed, 'Downsample')).toBe('4×4 downsampled')
        expect(meaningOf(parsed, 'Compression')).toBe('Lossless LOCO')
        expect(meaningOf(parsed, 'Producer')).toBe('JPL (IDS/MIPL)')
        expect(meaningOf(parsed, 'Version')).toBe('Version 2')
        expect(meaningOf(parsed, 'Extension')).toBe('VICAR image with an attached ODL label')
    })

    test('the pieces reassemble into the original filename', () => {
        const filename = 'ZL0_0673_0761234567_123EBY_N0301234ZCAM03456_1100LMA03.IMG'
        const parsed = parse(filename)
        expect(parsed.pieces.map((p) => p.text).join('')).toBe(filename)
        // The extension dot sits between segments and carries no label.
        expect(parsed.pieces.filter((p) => p.label == null).map((p) => p.text)).toEqual(['.'])
    })

    test('decodes a Mastcam-Z EDR, filter and producer included', () => {
        const parsed = parse('ZR2_0453_0700000000_000ECM_N0260000ZCAM01234_0340I3A01.IMG')
        expect(meaningOf(parsed, 'Instrument')).toBe('Mastcam-Z Right')
        expect(meaningOf(parsed, 'Color / filter')).toContain('Mastcam-Z filter 2')
        expect(meaningOf(parsed, 'Product type')).toContain('original companded image')
        expect(meaningOf(parsed, 'Compression')).toBe('ICER, 3 bits per pixel')
        expect(meaningOf(parsed, 'Producer')).toBe('ASU — Mastcam-Z team')
    })

    test('decodes a linearized product and a JPEG quality level', () => {
        const parsed = parse('NLF_0818_0739564747_023RASLN0391469NCAM00500_0A0505J01.IMG')
        expect(meaningOf(parsed, 'Color / filter')).toBe('RGB, all three bands')
        expect(meaningOf(parsed, 'Geometry')).toContain('Linearized')
        expect(meaningOf(parsed, 'Compression')).toBe('JPEG quality level 5')
    })

    test('unknown codes keep their label but claim no meaning', () => {
        const parsed = parse('QQM_0818_0739564747_023QQQ_N0391469VCE_16000_0A02LLJ02.IMG')
        expect(valueOf(parsed, 'Instrument')).toBe('QQ')
        expect(meaningOf(parsed, 'Instrument')).toBe(null)
        expect(meaningOf(parsed, 'Product type')).toBe(null)
        expect(segment(parsed, 'Instrument').description).toContain('Camera that acquired')
    })

    test('out-of-range fields decode as such', () => {
        const parsed = parse('NRM______0739564747_023IDM_N_______VCE_16000_0A02LLJ__.IMG')
        expect(meaningOf(parsed, 'Sol')).toBe('Out of range')
        expect(meaningOf(parsed, 'Site')).toBe('Out of range')
        expect(meaningOf(parsed, 'Drive')).toBe('Out of range')
        expect(meaningOf(parsed, 'Version')).toBe('Out of range')
    })

    test('names outside the single-frame convention fall back to plain text', () => {
        // Mosaic and terrain products use their own conventions.
        expect(parse('SOL_0818_1_0_0_RAS_N_0391469_XYZ_A01.IMG')).toBe(null)
        expect(parse('NRM_0818_0739564747_023IDM_N0391469VCE_16000_0A02LLJ02')).toBe(null)
        expect(parse('nrm_0818_0739564747_023idm_n0391469vce_16000_0a02llj02.img')).toBe(null)
        expect(parse('')).toBe(null)
        expect(parse(undefined)).toBe(null)
    })

    test('records from missions with no spec render as plain text', () => {
        const forRecord = (record) =>
            parseFilename(
                record.gather.pds_archive.file_name,
                resolveFilenameSpec({
                    mission: record.gather.common.mission,
                    pds_standard: record.gather.pds_archive.pds_standard,
                })
            )
        expect(forRecord(mslPds3)).toBe(null)
        expect(forRecord(mgsMoc)).toBe(null)
        expect(forRecord(mars2020Navcam)).not.toBe(null)
    })
})

test.describe('filename spec config', () => {
    test('segments are ordered, non-overlapping and fully labelled', () => {
        Object.keys(filenameSpecs).forEach((key) => {
            const spec = filenameSpecs[key]
            expect(spec.segments.length).toBeGreaterThan(0)
            let cursor = 0
            spec.segments.forEach((s) => {
                expect(s.label, `${key} segment at ${s.start}`).toBeTruthy()
                expect(s.description, `${key} ${s.label}`).toBeTruthy()
                expect(s.start, `${key} ${s.label}`).toBeGreaterThan(cursor)
                expect(s.length).toBeGreaterThan(0)
                cursor = s.start - 1 + s.length
            })
        })
    })

    test('neighbouring segments never share a colour', () => {
        Object.keys(filenameSpecs).forEach((key) => {
            const segments = filenameSpecs[key].segments
            segments.forEach((s, i) => {
                if (i === 0) return
                expect(s.color, `${key} ${segments[i - 1].label} / ${s.label}`).not.toBe(
                    segments[i - 1].color
                )
            })
        })
    })

    test('no code is claimed twice within a segment', () => {
        Object.keys(filenameSpecs).forEach((key) => {
            filenameSpecs[key].segments.forEach((s) => {
                const seen = new Set(Object.keys(s.values || {}))
                ;(s.valueGroups || []).forEach((group) => {
                    group.codes.split(/\s+/).forEach((code) => {
                        expect(seen.has(code), `${key} ${s.label} ${code}`).toBe(false)
                        seen.add(code)
                    })
                })
            })
        })
    })
})
