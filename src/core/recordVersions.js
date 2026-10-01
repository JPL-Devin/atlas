const LIDVID_FIELD = 'pds4_label.lidvid'

export function getVersionQuery(lidvid, uri) {
    const [lid, vid] = lidvid?.split('::') || []
    if (!lid || !vid || !uri) {
        return null
    }

    const extension = uri.match(/\.[a-z0-9]+$/i)?.[0]
    return {
        size: 1000,
        query: {
            bool: {
                filter: [{ prefix: { [`${LIDVID_FIELD}.keyword`]: `${lid}::` } }],
                should: [
                    { term: { uri: { value: uri, boost: 2 } } },
                    ...(extension ? [{ wildcard: { uri: `*${extension}` } }] : []),
                ],
            },
        },
        collapse: { field: `${LIDVID_FIELD}.keyword` },
        sort: ['_score', { release_id_num: 'desc' }, { uri: 'asc' }],
        _source: ['uri', LIDVID_FIELD],
    }
}

export function getVersionOptions(hits, lidvid, uri) {
    const [lid, vid] = lidvid?.split('::') || []
    if (!lid || !vid || !uri) {
        return []
    }

    const byVersion = new Map()
    const sources = [{ uri, pds4_label: { lidvid } }, ...(hits || []).map((hit) => hit._source)]
    for (const source of sources) {
        const [productLid, versionRaw] = source?.pds4_label?.lidvid?.split('::') || []
        if (productLid !== lid || !versionRaw || !source?.uri || byVersion.has(versionRaw)) {
            continue
        }
        byVersion.set(versionRaw, {
            uri: source.uri,
            name: source.uri.split('/').pop(),
            version: `Version ${versionRaw}`,
            versionRaw,
        })
    }

    return [...byVersion.values()].sort((a, b) =>
        b.versionRaw.localeCompare(a.versionRaw, 'en', { numeric: true })
    )
}
