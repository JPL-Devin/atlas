import { test, expect } from '@playwright/test'

import {
    formatSisSize,
    formatSisTitle,
    getSisDocuments,
    getSisForInstrument,
    getSisGap,
} from '../../src/core/sis'
import { filenameSpecs } from '../../src/config/recordDetail'
import sisConfig from '../../src/config/recordDetail/sis.json'

const variantsOf = (spec) => (Array.isArray(spec) ? spec : [spec])

test.describe('the SIS registry', () => {
    test('every document links a PDF and carries its size', () => {
        Object.keys(sisConfig.documents).forEach((id) => {
            const document = sisConfig.documents[id]
            expect(document.title, id).toBeTruthy()
            expect(document.mission, id).toBeTruthy()
            expect(document.url, id).toMatch(/^https:\/\//)
            expect(document.size, id).toBeGreaterThan(0)
            expect(typeof document.camera, id).toBe('boolean')
        })
    })

    test('every gap explains itself', () => {
        expect(sisConfig.gaps.length).toBeGreaterThan(0)
        sisConfig.gaps.forEach((gap) => {
            expect(gap.mission).toBeTruthy()
            expect(gap.note).toBeTruthy()
        })
    })

    test('every filename convention points at documents that exist', () => {
        Object.keys(filenameSpecs).forEach((mission) => {
            variantsOf(filenameSpecs[mission]).forEach((variant) => {
                const ids = Array.isArray(variant.sis) ? variant.sis : [variant.sis]
                expect(variant.sis, mission).not.toBe(undefined)
                expect(getSisDocuments(variant.sis).length, mission).toBe(ids.length)
            })
        })
    })
})

test.describe('getSisDocuments', () => {
    test('resolves one id or several, and skips unknown ones', () => {
        expect(getSisDocuments('m20_camera').map((d) => d.id)).toEqual(['m20_camera'])
        expect(getSisDocuments(['mgs_moc_rdr', 'mgs_moc_sdp']).map((d) => d.id)).toEqual([
            'mgs_moc_rdr',
            'mgs_moc_sdp',
        ])
        expect(getSisDocuments(['nope', 'mro_ctx']).map((d) => d.id)).toEqual(['mro_ctx'])
        expect(getSisDocuments(null)).toEqual([])
    })
})

test.describe('getSisForInstrument', () => {
    test('an instrument gets its own document plus the mission-wide ones', () => {
        expect(getSisForInstrument('mro', 'CTX').map((d) => d.id)).toEqual(['mro_ctx'])
        expect(getSisForInstrument('mro', ['HIRISE']).map((d) => d.id)).toEqual([
            'mro_hirise_edr',
            'mro_hirise_rdr',
        ])
        // MER's SIS covers every camera, so it needs no instrument list.
        expect(getSisForInstrument('mer', 'PANCAM_LEFT').map((d) => d.id)).toEqual(['mer_camsis'])
    })

    test('without an instrument the whole mission is listed', () => {
        expect(getSisForInstrument('msl').map((d) => d.id)).toEqual(['msl_camera', 'msl_mmm'])
        expect(getSisForInstrument(null)).toEqual([])
        expect(getSisForInstrument('vgr')).toEqual([])
    })
})

test.describe('getSisGap', () => {
    test('a mission with no SIS explains the absence', () => {
        expect(getSisGap('vgr', 'ISSNA').note).toMatch(/no voyager iss/i)
        expect(getSisGap('vik').note).toMatch(/viking orbiter/i)
    })

    test('an instrument gap only applies to that instrument', () => {
        expect(getSisGap('go', 'NIMS').note).toMatch(/nims/i)
        expect(getSisGap('go', 'SSI')).toBe(null)
        expect(getSisGap('mer', 'PANCAM_LEFT')).toBe(null)
    })
})

test.describe('formatting', () => {
    test('sizes read as KB below a megabyte', () => {
        expect(formatSisSize(26 * 1024)).toBe('26 KB')
        expect(formatSisSize(2.7 * 1024 * 1024)).toBe('2.7 MB')
        expect(formatSisSize(36 * 1024 * 1024)).toBe('36 MB')
        expect(formatSisSize(0)).toBe(null)
    })

    test('titles carry the revision when there is one', () => {
        expect(formatSisTitle(sisConfig.documents.mro_hirise_rdr)).toBe(
            'MRO HiRISE RDR Products SIS (v1.3)'
        )
        expect(formatSisTitle({ title: 'Nameless SIS' })).toBe('Nameless SIS')
        expect(formatSisTitle(null)).toBe(null)
    })
})
