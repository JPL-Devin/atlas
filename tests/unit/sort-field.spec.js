import { test, expect } from '@playwright/test'

import { getSortField } from '../../src/core/sortFields'

const mapping = {
    mappings: {
        properties: {
            archive: { properties: { name: { type: 'keyword' } } },
            gather: {
                properties: {
                    pds_archive: {
                        properties: {
                            file_name: { type: 'text' },
                            product_id: { type: 'text' },
                        },
                    },
                    time: { properties: { start_time: { type: 'date' } } },
                },
            },
            pds3_label: {
                properties: {
                    FILTER_NAME: {
                        type: 'text',
                        fields: { keyword: { type: 'keyword', ignore_above: 256 } },
                    },
                    DATA_NOTE: { type: 'text', fielddata: true },
                },
            },
        },
    },
}

test.describe('getSortField', () => {
    test('keeps non-text fields as-is', () => {
        expect(getSortField(mapping, 'gather.time.start_time')).toBe('gather.time.start_time')
        expect(getSortField(mapping, 'archive.name')).toBe('archive.name')
    })

    test('sorts text fields on their keyword sub-field', () => {
        expect(getSortField(mapping, 'pds3_label.FILTER_NAME')).toBe(
            'pds3_label.FILTER_NAME.keyword'
        )
    })

    test('keeps text fields with fielddata enabled', () => {
        expect(getSortField(mapping, 'pds3_label.DATA_NOTE')).toBe('pds3_label.DATA_NOTE')
    })

    test('uses the keyword fallback for text-only file_name', () => {
        expect(getSortField(mapping, 'gather.pds_archive.file_name')).toBe('archive.name')
    })

    test('returns null for text-only fields without a fallback', () => {
        expect(getSortField(mapping, 'gather.pds_archive.product_id')).toBeNull()
    })

    test('passes through unmapped fields and unloaded mappings', () => {
        expect(getSortField(mapping, 'pds3_label.NOT_MAPPED')).toBe('pds3_label.NOT_MAPPED')
        expect(getSortField(false, 'gather.pds_archive.file_name')).toBe(
            'gather.pds_archive.file_name'
        )
        expect(getSortField(mapping, null)).toBeNull()
    })
})
