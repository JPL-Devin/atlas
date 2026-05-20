import { getAppConfig, getAllInstances } from '../appConfig'

// Helper to reset module state between tests
const setAppInstance = (value) => {
    delete process.env.REACT_APP_APP_INSTANCE
    if (typeof window !== 'undefined') {
        delete window.APP_CONFIG
    }
    if (value !== undefined) {
        process.env.REACT_APP_APP_INSTANCE = value
    }
}

afterEach(() => {
    setAppInstance(undefined)
})

describe('getAppConfig()', () => {
    describe('atlas instance (default)', () => {
        beforeEach(() => setAppInstance('atlas'))

        it('returns atlas config when APP_INSTANCE is "atlas"', () => {
            const config = getAppConfig()
            expect(config.appTitle).toBe('Atlas')
        })

        it('returns atlas config when APP_INSTANCE is unset', () => {
            setAppInstance(undefined)
            const config = getAppConfig()
            expect(config.appTitle).toBe('Atlas')
        })

        it('has all required fields', () => {
            const config = getAppConfig()
            expect(config).toHaveProperty('appTitle')
            expect(config).toHaveProperty('enableCart')
            expect(config).toHaveProperty('enableArchiveExplorer')
            expect(config).toHaveProperty('enableMap')
            expect(config).toHaveProperty('enableAddFilters')
            expect(config).toHaveProperty('defaultDownloadProduct')
            expect(config).toHaveProperty('defaultSortField')
            expect(config).toHaveProperty('defaultSortDirection')
            expect(config).toHaveProperty('aboutTitle')
            expect(config).toHaveProperty('aboutDescription')
            expect(config).toHaveProperty('aboutContactUrl')
            expect(config).toHaveProperty('defaultFilters')
            expect(config).toHaveProperty('defaultFilterValues')
            expect(config).toHaveProperty('drawerOrder')
            expect(config).toHaveProperty('drawerLabel')
            expect(config).toHaveProperty('baseUrl')
            expect(config).toHaveProperty('dataEndpoint')
            expect(config).toHaveProperty('searchEndpoint')
            expect(config).toHaveProperty('pitEndpoint')
            expect(config).toHaveProperty('scrollEndpoint')
            expect(config).toHaveProperty('archiveEndpoint')
        })

        it('has correct default values for atlas', () => {
            const config = getAppConfig()
            expect(config.enableCart).toBe(true)
            expect(config.enableArchiveExplorer).toBe(true)
            expect(config.enableMap).toBe(true)
            expect(config.enableAddFilters).toBe(true)
            expect(config.defaultDownloadProduct).toBe('src')
            expect(config.defaultSortField).toBe('gather.time.start_time')
            expect(config.defaultSortDirection).toBe('desc')
            expect(config.aboutTitle).toBe('Atlas')
            expect(config.drawerOrder).toBe(0)
            expect(config.drawerLabel).toBe('Atlas')
        })

        it('has atlas-specific endpoint paths', () => {
            const config = getAppConfig()
            expect(config.dataEndpoint).toBe('/data')
            expect(config.searchEndpoint).toBe('/search/atlas/_search')
            expect(config.pitEndpoint).toBe('/search/atlas/_pit')
            expect(config.scrollEndpoint).toBe('/search/_search/scroll')
            expect(config.archiveEndpoint).toBe('/search/atlas/_search')
        })

        it('includes ML filters in defaultFilters', () => {
            const config = getAppConfig()
            expect(config.defaultFilters).toContain(
                'gather.machine_learning.classification.classifications.class'
            )
            expect(config.defaultFilters).toContain(
                'gather.machine_learning.classification.classifications.confidence'
            )
        })

        it('has empty defaultFilterValues', () => {
            const config = getAppConfig()
            expect(config.defaultFilterValues).toEqual({})
        })
    })

    describe('raws instance', () => {
        beforeEach(() => setAppInstance('raws'))

        it('returns raws config when APP_INSTANCE is "raws"', () => {
            const config = getAppConfig()
            expect(config.appTitle).toBe('Planetary Raws')
        })

        it('has all required fields', () => {
            const config = getAppConfig()
            expect(config).toHaveProperty('appTitle')
            expect(config).toHaveProperty('enableCart')
            expect(config).toHaveProperty('enableArchiveExplorer')
            expect(config).toHaveProperty('enableMap')
            expect(config).toHaveProperty('enableAddFilters')
            expect(config).toHaveProperty('defaultDownloadProduct')
            expect(config).toHaveProperty('defaultSortField')
            expect(config).toHaveProperty('defaultSortDirection')
            expect(config).toHaveProperty('aboutTitle')
            expect(config).toHaveProperty('aboutDescription')
            expect(config).toHaveProperty('aboutContactUrl')
            expect(config).toHaveProperty('defaultFilters')
            expect(config).toHaveProperty('defaultFilterValues')
            expect(config).toHaveProperty('drawerOrder')
            expect(config).toHaveProperty('drawerLabel')
            expect(config).toHaveProperty('baseUrl')
            expect(config).toHaveProperty('dataEndpoint')
            expect(config).toHaveProperty('searchEndpoint')
            expect(config).toHaveProperty('pitEndpoint')
            expect(config).toHaveProperty('scrollEndpoint')
            expect(config).toHaveProperty('archiveEndpoint')
        })

        it('has correct raws values', () => {
            const config = getAppConfig()
            expect(config.enableCart).toBe(false)
            expect(config.enableArchiveExplorer).toBe(false)
            expect(config.enableMap).toBe(false)
            expect(config.enableAddFilters).toBe(false)
            expect(config.defaultDownloadProduct).toBe('browse')
            expect(config.defaultSortField).toBe('gather.time.start_time')
            expect(config.defaultSortDirection).toBe('desc')
            expect(config.aboutTitle).toBe('Planetary Raws')
            expect(config.aboutContactUrl).toBe(
                'https://pds-imaging.jpl.nasa.gov/help/help.html'
            )
            expect(config.drawerOrder).toBe(1)
            expect(config.drawerLabel).toBe('Planetary Raws')
        })

        it('has raws-specific endpoint paths', () => {
            const config = getAppConfig()
            expect(config.dataEndpoint).toBe('/data')
            expect(config.searchEndpoint).toBe('/search/raws/_search')
            expect(config.pitEndpoint).toBe('/search/raws/_pit')
            expect(config.scrollEndpoint).toBe('/search/_search/scroll')
            expect(config.archiveEndpoint).toBe('/search/raws/_search')
        })

        it('does NOT include ML filters in defaultFilters', () => {
            const config = getAppConfig()
            expect(config.defaultFilters).not.toContain(
                'gather.machine_learning.classification.classifications.class'
            )
            expect(config.defaultFilters).not.toContain(
                'gather.machine_learning.classification.classifications.confidence'
            )
        })

        it('has Movie Frame excluded in defaultFilterValues', () => {
            const config = getAppConfig()
            expect(config.defaultFilterValues['gather.common.product_type']).toBeDefined()
            expect(
                config.defaultFilterValues['gather.common.product_type'].exclude
            ).toContain('Movie Frame')
        })
    })

    describe('window.APP_CONFIG override', () => {
        it('reads APP_INSTANCE from window.APP_CONFIG when available', () => {
            window.APP_CONFIG = { APP_INSTANCE: 'raws' }
            const config = getAppConfig()
            expect(config.appTitle).toBe('Planetary Raws')
            delete window.APP_CONFIG
        })

        it('prefers window.APP_CONFIG over process.env', () => {
            process.env.REACT_APP_APP_INSTANCE = 'atlas'
            window.APP_CONFIG = { APP_INSTANCE: 'raws' }
            const config = getAppConfig()
            expect(config.appTitle).toBe('Planetary Raws')
            delete window.APP_CONFIG
        })
    })
})

describe('getAllInstances()', () => {
    it('returns both atlas and raws configs', () => {
        const instances = getAllInstances()
        expect(instances).toHaveProperty('atlas')
        expect(instances).toHaveProperty('raws')
    })

    it('has correct appTitle for each instance', () => {
        const instances = getAllInstances()
        expect(instances.atlas.appTitle).toBe('Atlas')
        expect(instances.raws.appTitle).toBe('Planetary Raws')
    })

    it('has non-empty endpoint strings for every instance', () => {
        const instances = getAllInstances()
        const endpointKeys = [
            'dataEndpoint',
            'searchEndpoint',
            'pitEndpoint',
            'scrollEndpoint',
            'archiveEndpoint',
        ]
        Object.keys(instances).forEach((instanceKey) => {
            endpointKeys.forEach((epKey) => {
                const value = instances[instanceKey][epKey]
                expect(typeof value).toBe('string')
                expect(value.length).toBeGreaterThan(0)
            })
        })
    })
})
