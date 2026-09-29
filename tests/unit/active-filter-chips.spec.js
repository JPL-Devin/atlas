import { test, expect } from '@playwright/test'

import { getActiveFilterChips } from '../../src/pages/Search/Panels/ResultsPanel/subcomponents/ChippedFilters/activeFilterChips'

test('Artemis 2 filter chips show display names and keep the keys used to remove filters', () => {
    const filters = Object.fromEntries(
        ['mission', 'spacecraft'].map((field) => [
            `gather.common.${field}`,
            { display_name: field, facets: [{ state: { artemis2: true } }] },
        ])
    )
    const chips = getActiveFilterChips(filters)
    expect(chips.map((chip) => chip.label)).toEqual(['Mission: Artemis 2', 'Spacecraft: Artemis 2'])
    expect(chips.map((chip) => chip.stateKey)).toEqual(['artemis2', 'artemis2'])
    expect(filters['gather.common.mission'].facets[0].state).toEqual({ artemis2: true })
})

test('typed mission filter queries remain literal', () => {
    const [chip] = getActiveFilterChips({
        'gather.common.mission': {
            display_name: 'mission',
            facets: [{ state: { __filter: 'artemis2' } }],
        },
    })
    expect(chip.label).toBe('Mission: *artemis2*')
})
