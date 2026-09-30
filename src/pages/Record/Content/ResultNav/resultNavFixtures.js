// Mock search-result context for the result navigation mockups. Not wired to Redux.

export const RESULT_NAV_VARIANTS = ['a', 'b', 'c']

export const RESULT_NAV_FIXTURE = {
    total: 1284,
    pageSize: 100,
}

// Preset states: which result is open and how much of the result set is loaded.
export const RESULT_NAV_STATES = {
    first: { label: 'First', index: 0, loaded: 100 },
    middle: { label: 'Middle', index: 41, loaded: 100 },
    lastLoaded: { label: 'Last loaded', index: 99, loaded: 100 },
    loading: { label: 'Loading', index: 99, loaded: 100, loadingNext: true },
    none: { label: 'No context', index: null, loaded: 0 },
}

const CAMERAS = ['NLF', 'NRF', 'ZLF', 'ZRF', 'SIF']

export const getFixtureResult = (index) => {
    const sol = 950 + Math.floor(index / 8)
    const sclk = String(751234567 + index * 37).padStart(10, '0')
    const camera = CAMERAS[index % CAMERAS.length]
    const title = `${camera}_${sol}_${sclk}_${String(100 + index).padStart(3, '0')}ECM_N0450000NCAM00500_01_295J01.png`
    return {
        index,
        title,
        uri: `atlas:pds4:mars_2020:perseverance:/mars2020_navcam_ops_raw/data/sol/${sol}/ids/edr/ncam/${title}`,
    }
}
