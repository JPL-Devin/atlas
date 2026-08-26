import { ES_PATHS } from '../../../../../core/constants'
import { getIn, isObject } from '../../../../../core/utils'

// The raw label branches are the Product Label tab's primary content; without
// them the tab falls back to everything else the record was indexed with.
export const withoutLabelBranches = (recordData) =>
    Object.keys(recordData || {})
        .filter((key) => !/_label$/.test(key))
        .reduce((obj, key) => {
            const value = recordData[String(key)]
            if (value != null) obj[String(key)] = value
            return obj
        }, {})

// A record only carries the label branch for its own PDS standard.
export const getRawLabel = (recordData) => {
    const pdsStandard = getIn(recordData, ES_PATHS.pds_standard)
    const label = getIn(
        recordData,
        pdsStandard === 'pds4' ? ES_PATHS.pds4_label : ES_PATHS.pds3_label,
        {}
    )
    return isObject(label) ? label : {}
}

export const hasRawLabel = (recordData) =>
    Object.keys(getRawLabel(recordData)).length > 0
