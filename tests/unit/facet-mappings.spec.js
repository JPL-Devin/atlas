import { test, expect } from '@playwright/test'

import { formatMappings } from '../../src/facets/FacetBuilder'
import { getIn } from '../../src/core/utils'

test.describe('formatMappings', () => {
    test('Raws top-level URL keys resolve to their mapped filters', () => {
        const atlasMapping = formatMappings({
            mappings: {
                properties: {
                    gather: { properties: { uri: { type: 'keyword' } } },
                    raws_label: { properties: { foo: { type: 'keyword' } } },
                    related: { properties: { uri: { type: 'keyword' } } },
                },
            },
        })

        for (const key of ['raws_label.foo', 'related.uri']) {
            const lookupPath = key.split('.').join('..groups..').split('..')
            const filter = getIn(atlasMapping.groups, lookupPath)
            expect(filter.facets[0].field).toBe(key)
            expect(filter.facets[0].type).toBe('keyword')
            expect(getIn(atlasMapping.groups, ['gather', 'groups', ...lookupPath])).toBeFalsy()
        }
    })

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
