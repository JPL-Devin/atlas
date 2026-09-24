import { ES_PATHS } from './constants'
import { getIn, getPDSUrl, getFilename, splitUri } from './utils'
import { getDownloadProducts, getSupplementalProducts } from './recordDownloads'
import {
    getRawLabel,
    withoutLabelBranches,
} from '../pages/Record/Content/Views/ProductLabel/labelData'

/**
 * Everything on a record page that is worth copying, shaped for CopyLinks.
 * Product URLs come from the same list the Download button uses.
 */
export const getRecordCopyItems = (recordData) => {
    const filename = getIn(recordData, ES_PATHS.file_name)
    const uri = getIn(recordData, ES_PATHS.uri)

    const items = []
    if (filename) {
        items.push({
            key: 'filename',
            label: 'Filename',
            value: filename,
            message: 'Copied filename to clipboard!',
        })
    }
    if (uri) {
        items.push({
            key: 'uri',
            label: 'Atlas URI',
            value: uri,
            message: 'Copied URI to clipboard!',
        })
    }

    const products = [...getDownloadProducts(recordData), ...getSupplementalProducts(recordData)]
    products.forEach((product, idx) => {
        if (!product.uri) {
            return
        }
        const url = getPDSUrl(product.uri, product.release_id)
        items.push({
            key: `product_${product.key}`,
            groupLabel: idx === 0 ? 'Product URLs' : undefined,
            label: `${product.name} URL`,
            subname: product.subname || (product.extension ? `.${product.extension}` : undefined),
            value: url,
            message: `Copied ${product.name} URL to clipboard!`,
            url,
            filename: getFilename(product.uri),
        })
    })

    const rawLabel = getRawLabel(recordData)
    const labelData = Object.keys(rawLabel).length > 0 ? rawLabel : withoutLabelBranches(recordData)
    items.push({
        key: 'metadata',
        groupLabel: 'Data',
        label: 'Metadata JSON',
        value: () => JSON.stringify(labelData, null, 2),
        message: 'Copied Label JSON to Clipboard!',
    })

    return items
}

// Mirrors the path shown in the FileExplorer heading.
const getFileExplorerPath = (preview, columns) => {
    const parts = []
    columns.forEach((c) => {
        if (!c.active) {
            return
        }
        if (c.type === 'filter' || c.type === 'volume') {
            parts.push(c.active.key)
        }
    })
    if (preview.uri) {
        parts.push(splitUri(preview.uri).relativeUrl || '')
    }
    return parts.map((v) => `${v[0] === '/' ? '' : '/'}${v}`).join('') || '/'
}

export const getFileExplorerCopyItems = (preview, columns) => {
    const items = [
        {
            key: 'path',
            label: 'Path',
            value: getFileExplorerPath(preview, columns),
            message: 'Copied path to clipboard!',
        },
    ]
    if (!preview.uri) {
        return items
    }
    const isFile = preview.fs_type === 'file'
    const url = getPDSUrl(preview.uri, getIn(preview, ES_PATHS.release_id))
    items.push({
        key: 'uri',
        label: 'Atlas URI',
        value: preview.uri,
        message: 'Copied URI to clipboard!',
    })
    items.push({
        key: 'url',
        groupLabel: isFile ? 'File' : 'Directory',
        label: isFile ? 'File URL' : 'Directory URL',
        subname: isFile ? getFilename(preview.uri) : undefined,
        value: url,
        message: 'Copied URL to clipboard!',
        url: isFile ? url : undefined,
        filename: getFilename(preview.uri),
    })
    return items
}

// `copy(type)` dispatches copyToClipboardAction for the current query.
export const getSearchCopyItems = (copy) => [
    { key: 'dsl', label: 'Query (DSL)', onCopy: () => copy('DSL') },
    { key: 'python', groupLabel: 'Commands', label: 'Python', onCopy: () => copy('Python') },
    { key: 'curl', label: 'CURL', onCopy: () => copy('CURL') },
    { key: 'fetch', label: 'Fetch', onCopy: () => copy('Fetch') },
]
