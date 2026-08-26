import { ES_PATHS } from '../../core/constants'
import { getIn, isObject } from '../../core/utils'

// A record only carries the label branch for its own PDS standard.
const hasLabel = (recordData) => {
    const pdsStandard = getIn(recordData, ES_PATHS.pds_standard)
    const label = getIn(
        recordData,
        pdsStandard === 'pds4' ? ES_PATHS.pds4_label : ES_PATHS.pds3_label
    )
    return isObject(label) && Object.keys(label).length > 0
}

// Tab order for the record view; `condition` gates a tab on the record's data.
export const VIEW_TABS = [
    { id: 'overview' },
    { id: 'product label', condition: hasLabel },
    { id: 'ml classification', condition: ES_PATHS.ml_classification_related },
]

export const getVisibleViewTabs = (recordData) =>
    VIEW_TABS.filter((tab) => {
        if (tab.condition == null) return true
        if (typeof tab.condition === 'function') return tab.condition(recordData)
        return getIn(recordData, tab.condition) != null
    }).map((tab) => tab.id)
