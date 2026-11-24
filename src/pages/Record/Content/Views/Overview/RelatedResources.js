import React from 'react'
import PropTypes from 'prop-types'

import { getSharedMissionKey } from '../../../../../config/recordDetail'
import { getAppInstanceKey } from '../../../../../core/appConfig.js'
import { ES_PATHS } from '../../../../../core/constants.js'
import { getIn } from '../../../../../core/utils.js'
import SisResources from '../../../../../components/SisResources/SisResources.js'

const first = (value) => (Array.isArray(value) ? value[0] : value)

// The record's SIS documentation, resolved from its indexed mission/instrument.
export const RelatedResources = (props) => {
    const { recordData, headingClassName } = props
    const mission = first(getIn(recordData, ES_PATHS.mission))

    return (
        <SisResources
            mission={getSharedMissionKey(mission, getAppInstanceKey())}
            instruments={getIn(recordData, ES_PATHS.instrument)}
            headingClassName={headingClassName}
        />
    )
}

RelatedResources.propTypes = {
    recordData: PropTypes.object,
    headingClassName: PropTypes.string,
}

export default RelatedResources
