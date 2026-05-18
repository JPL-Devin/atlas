/**
 * Sample test data for Atlas E2E tests.
 *
 * Atlas pulls live data from an Elasticsearch-backed PDS API, so most
 * fixtures here are just shapes / examples — tests should still skip
 * gracefully when the live API is unreachable.
 */

export const SAMPLE_SEARCH_QUERIES = [
    { mission: 'Mars Reconnaissance Orbiter' },
    { mission: 'Mars Science Laboratory', instrument: 'MASTCAM' },
    { instrument: 'HiRISE' },
]

// Example record URIs. These come from the PDS-IMG ATLAS archive — they may
// or may not resolve depending on whether the external API is reachable from
// the test environment, so consumers of these fixtures should handle the
// "no results" case rather than asserting on data.
export const SAMPLE_RECORD_URIS = [
    'urn:nasa:pds:mars2020_mastcamz_ops_raw',
    'urn:nasa:pds:mars_reconnaissance_orbiter_hirise',
]

export const SAMPLE_FILTER_CONFIGURATIONS = [
    { facet: 'mission', operator: 'is', value: 'Mars 2020' },
    { facet: 'instrument', operator: 'is', value: 'NAVCAM' },
]

export const APP_ROUTES = ['/search', '/record', '/cart', '/archive-explorer']
