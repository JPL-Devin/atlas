import { ES_PATHS } from './constants'
import { getIn, getPDSUrl, getFilename } from './utils'
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
