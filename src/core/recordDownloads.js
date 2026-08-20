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
        const size = humanFileSize(related[key].size)
        return {
            name: RELATED_MAPPINGS[key] || key,
            subname: `.${getExtension(uri)}${size ? ` (${size})` : ''}`,
            uri,
            checked: key === getAppConfig().defaultDownloadProduct,
            release_id,
        }
    })
}
