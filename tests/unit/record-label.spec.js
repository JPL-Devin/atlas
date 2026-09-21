import { test, expect } from '@playwright/test'

import { getRawLabel, hasRawLabel } from '../../src/pages/Record/Content/Views/ProductLabel/labelData'

test.describe('getRawLabel', () => {
    test('a pds4 record yields only its pds4_label branch', () => {
        const record = {
            gather: { pds_archive: { pds_standard: 'pds4' } },
            pds4_label: { lidvid: 'urn:nasa:pds:x::1.0', Product_Observational: { a: 1 } },
        }
        expect(Object.keys(getRawLabel(record)).sort()).toEqual([
            'Product_Observational',
            'lidvid',
        ])
    })

    test('a pds3 record yields only its pds3_label branch', () => {
        const record = {
            gather: { pds_archive: { pds_standard: 'pds3' } },
            pds3_label: { PRODUCT_ID: 'x' },
        }
        expect(getRawLabel(record)).toEqual({ PRODUCT_ID: 'x' })
    })

    test('a record with no label branch has no raw label', () => {
        const record = { gather: { pds_archive: { pds_standard: 'pds3' } } }
        expect(getRawLabel(record)).toEqual({})
        expect(hasRawLabel(record)).toBe(false)
    })
})
