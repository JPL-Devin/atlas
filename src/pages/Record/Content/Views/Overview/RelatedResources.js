import React from 'react'
import PropTypes from 'prop-types'

import { ES_PATHS } from '../../../../../core/constants.js'
import { getIn } from '../../../../../core/utils.js'
import SisResources from '../../../../../components/SisResources/SisResources.js'

const first = (value) => (Array.isArray(value) ? value[0] : value)

// The record's SIS documentation, resolved from its indexed mission/instrument.
export const RelatedResources = (props) => {
    const { recordData, headingClassName } = props

    return (
        <SisResources
            mission={first(getIn(recordData, ES_PATHS.mission))}
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
