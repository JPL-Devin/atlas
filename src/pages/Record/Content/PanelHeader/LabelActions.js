import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'

import Button from '@mui/material/Button'

import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

import { ES_PATHS } from '../../../../core/constants'
import { getIn, copyToClipboard, getPDSUrl } from '../../../../core/utils'
import { setSnackBarText } from '../../../../core/redux/actions/actions'

const useStyles = makeStyles(() => ({
    button: {
        fontSize: '12px',
        textTransform: 'none',
        whiteSpace: 'nowrap',
        flexShrink: 0,
    },
}))

// The label controls, shared by every panel header that has room for them.
const LabelActions = (props) => {
    const { recordData } = props

    const c = useStyles()
    const dispatch = useDispatch()

    const pdsStandard = getIn(recordData, ES_PATHS.pds_standard)
    const labelData = getIn(
        recordData,
        pdsStandard === 'pds4' ? ES_PATHS.pds4_label : ES_PATHS.pds3_label,
        {}
    )
    if (Object.keys(labelData).length === 0) return null

    const labelURL = getPDSUrl(
        getIn(recordData, ES_PATHS.label),
        getIn(recordData, ES_PATHS.release_id)
    )

    return (
        <>
            <Button
                className={c.button}
                variant="outlined"
                aria-label="copy label json button"
                size="small"
                startIcon={<ContentCopyIcon fontSize="small" />}
                onClick={() => {
                    copyToClipboard(JSON.stringify(labelData, null, 2))
                    dispatch(setSnackBarText('Copied Label JSON to Clipboard!', 'success'))
                }}
            >
                Copy Label JSON
            </Button>
            <Button
                className={c.button}
                variant="outlined"
                aria-label="view raw label button"
                size="small"
                href={labelURL}
                target="_blank"
                startIcon={<OpenInNewIcon fontSize="small" />}
            >
                View Raw Label
            </Button>
        </>
    )
}

LabelActions.propTypes = {
    recordData: PropTypes.object.isRequired,
}

export default LabelActions
