import { test, expect } from '@playwright/test'

import { formatMappings } from '../../src/facets/FacetBuilder'

test.describe('formatMappings', () => {
    test('a mapping without pds4_label or archive (Raws) still formats', () => {
        const schema = {
            mappings: {
                properties: {
                    uri: { type: 'keyword' },
                    gather: {
                        properties: {
                            uri: { type: 'keyword' },
                            common: { properties: { mission: { type: 'keyword' } } },
                        },
                    },
                    raws_label: { properties: { camera_name: { type: 'keyword' } } },
                },
            },
        }
        const facets = formatMappings(schema)
        expect(facets.groups.common.groups.mission).toBeTruthy()
        expect(facets.groups.uri.description).toMatch(/uniform resource identifier/)
    })
})
