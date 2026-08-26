import { ES_PATHS, RELATED_MAPPINGS } from './constants'
import { getAppConfig } from './appConfig'
import { getIn, humanFileSize, getExtension, sortRelatedKeys } from './utils'

/**
 * The record's downloadable products (source plus related assets), shaped for
 * SplitButton's checklist.
 */
export const getDownloadProducts = (recordData) => {
    const release_id = getIn(recordData, ES_PATHS.release_id)

    const related = { ...getIn(recordData, ES_PATHS.related, {}) }
    if (related.src == null) related.src = {}

    const ml_classification_related = getIn(recordData, ES_PATHS.ml_classification_related, {})
    if (ml_classification_related.overlay)
        related.ml_classifier_features = ml_classification_related.overlay
    if (ml_classification_related.label)
        related.ml_classifier_label = ml_classification_related.label

    return sortRelatedKeys(Object.keys(related)).map((key) => {
        const uri = key === 'src' ? getIn(recordData, ES_PATHS.source) : related[key].uri
        // The source product carries its size on the archive entry, not in `related`.
        const bytes = key === 'src' ? getIn(recordData, ES_PATHS.archive.size) : related[key].size
        const size = humanFileSize(bytes)
        const extension = getExtension(uri)
        return {
            key,
            name: RELATED_MAPPINGS[key] || key,
            subname: `.${extension}${size ? ` (${size})` : ''}`,
            extension,
            size,
            uri,
            checked: key === getAppConfig().defaultDownloadProduct,
            release_id,
        }
    })
}
