import { test, expect } from '@playwright/test'
import { fromJS } from 'immutable'
import { buildSearchQuery } from '../../src/core/redux/actions/actions'
import { mergeKeywordValues } from '../../src/core/utils'

const state = fromJS({ filterType: 'basic' })
const keyword = (field, selection, nestedPath = false) => ({
    facets: [{ field, state: selection, type: 'keyword', component: 'list', nestedPath }],
})

test('keyword counts omit only own checked values, retaining other filters and constraints', () => {
    const filters = {
        mission: keyword('mission', { A: true, B: true, __filter: 'mars', exclude: ['hidden'] }),
        instrument: keyword('instrument', { C: true, D: true }),
    }
    const results = buildSearchQuery(state, filters).query
    const query = buildSearchQuery(state, filters, { skipCheckedFilter: 'mission' }).query
    expect(query.bool.must).toEqual([
        { regexp: { mission: { value: '.*mars.*', case_insensitive: true } } },
        { bool: { should: [{ match: { instrument: 'C' } }, { match: { instrument: 'D' } }] } },
        { exists: { field: 'gather.uri' } },
    ])
    expect(query.bool.must_not).toEqual(results.bool.must_not)
    expect(query.bool.must_not).toContainEqual({ match: { mission: 'hidden' } })
    expect(query.bool.must_not).toHaveLength(3)
    expect(results.bool.must[1]).toEqual({ bool: { should: [{ match: { mission: 'A' } }, { match: { mission: 'B' } }] } })
    expect(buildSearchQuery(state, {}).query.bool.must).toEqual([{ exists: { field: 'gather.uri' } }])
})

test('self exclusion supports nested keyword fields without changing other nested filters', () => {
    const filters = { own: keyword('items.name', { A: true }, 'items'), other: keyword('items.kind', { B: true }, 'items') }
    const query = buildSearchQuery(state, filters, { skipCheckedFilter: 'own' }).query
    expect(query.bool.must[0].bool.should[0].nested).toEqual({ path: 'items', query: { bool: { must: [{ match: { 'items.kind': 'B' } }] } } })
    expect(JSON.stringify(query)).not.toContain('items.name')
})

test('baseline merge zeros absent buckets, retains selected values, and sorts by key', () => {
    expect(mergeKeywordValues([{ key: 'B', doc_count: 9 }, { key: 'A', doc_count: 5 }], [{ key: 'B', doc_count: 2 }], { C: true, D: false })).toEqual([
        { key: 'A', doc_count: 0 }, { key: 'B', doc_count: 2 }, { key: 'C', doc_count: 0 },
    ])
    expect(mergeKeywordValues([], [])).toEqual([])
})

test('baseline merge filters case-insensitively, keeps selected missing values, and handles invalid regex', () => {
    const baseline = [{ key: 'Mars 2020' }, { key: 'Cassini' }]
    expect(mergeKeywordValues(baseline, [], { __filter: 'MARS', Cassini: true, exclude: ['hidden'] })).toEqual([
        { key: 'Cassini', doc_count: 0 }, { key: 'Mars 2020', doc_count: 0 },
    ])
    expect(mergeKeywordValues(baseline, [], { __filter: '[' })).toEqual([])
    expect(mergeKeywordValues(baseline, [], { __filter: 'mars|cas' })).toEqual([
        { key: 'Cassini', doc_count: 0 },
    ])
})
