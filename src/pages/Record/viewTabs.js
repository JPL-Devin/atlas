import { ES_PATHS } from '../../core/constants'
import { getIn } from '../../core/utils'

// Tab order for the record view; `condition` gates a tab on the record's data.
export const VIEW_TABS = [
    { id: 'overview' },
    { id: 'product label' },
    { id: 'ml classification', condition: ES_PATHS.ml_classification_related },
]

export const getVisibleViewTabs = (recordData) =>
    VIEW_TABS.filter(
        (tab) => tab.condition == null || getIn(recordData, tab.condition) != null
    ).map((tab) => tab.id)
