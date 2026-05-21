const instances = {
    atlas: {
        appTitle: 'Atlas',
        enableCart: true,
        enableArchiveExplorer: true,
        enableMap: true,
        enableAddFilters: true,
        defaultDownloadProduct: 'src',
        defaultSortField: 'gather.time.start_time',
        defaultSortDirection: 'desc',
        aboutTitle: 'Atlas',
        aboutDescription:
            'The Cartography and Imaging Sciences Node of the Planetary Data System provides a set of applications under the name, "Atlas". These applications allow users to explore, search, and download imaging and data products that have been collected from a variety NASA\'s planetary space missions. Through the use of these tools, users have access to petabytes of imaging data in one central location. This collection of data is updated periodically and is reported within the Latest News section of our home page.',
        aboutContactUrl: '',
        defaultFilters: [
            '_text',
            'gather.common.mission',
            'gather.common.spacecraft',
            'gather.common.instrument',
            'gather.common.target',
            'gather.common.product_type',
            'gather.common.kind',
            'archive.bundle_id',
            'gather.machine_learning.classification.classifications.class',
            'gather.machine_learning.classification.classifications.confidence',
        ],
        defaultFilterValues: {},
        drawerOrder: 0,
        drawerLabel: 'Atlas',
        baseUrl: '',
        dataEndpoint: '/data',
        searchEndpoint: '/search/atlas/_search',
        pitEndpoint: '/search/atlas/_pit',
        scrollEndpoint: '/search/_search/scroll',
        archiveEndpoint: '/search/atlas/_search',
    },
    raws: {
        appTitle: 'Planetary Raws',
        enableCart: false,
        enableArchiveExplorer: false,
        enableMap: false,
        enableAddFilters: false,
        defaultDownloadProduct: 'browse',
        defaultSortField: 'gather.time.start_time',
        defaultSortDirection: 'desc',
        aboutTitle: 'Planetary Raws',
        aboutDescription:
            'Planetary Raws provides access to raw imaging data from NASA planetary missions.',
        aboutContactUrl: 'https://pds-imaging.jpl.nasa.gov/help/help.html',
        defaultFilters: [
            '_text',
            'gather.common.mission',
            'gather.common.spacecraft',
            'gather.common.instrument',
            'gather.common.target',
            'gather.common.product_type',
            'gather.common.kind',
            'archive.bundle_id',
        ],
        defaultFilterValues: {
            'gather.common.product_type': { exclude: ['Movie Frame'] },
        },
        drawerOrder: 1,
        drawerLabel: 'Planetary Raws',
        baseUrl: '',
        dataEndpoint: '/data',
        searchEndpoint: '/search/atlas/_search',
        pitEndpoint: '/search/atlas/_pit',
        scrollEndpoint: '/search/_search/scroll',
        archiveEndpoint: '/search/atlas/_search',
    },
}

export const getAppConfig = () => {
    let appInstance = 'atlas'
    if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.APP_INSTANCE)
        appInstance = window.APP_CONFIG.APP_INSTANCE
    else if (process.env.REACT_APP_APP_INSTANCE) appInstance = process.env.REACT_APP_APP_INSTANCE

    return instances[appInstance] || instances.atlas
}

export const getAllInstances = () => instances
