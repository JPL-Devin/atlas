import React from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'

import { SisLink } from './SisLink'
import { getSisForInstrument, getSisGap } from '../../core/sis'

const useStyles = makeStyles((theme) => ({
    row: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: '4px 12px',
        boxSizing: 'border-box',
        padding: '6px 12px',
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey150}`,
        color: theme.palette.swatches.grey.grey600,
        fontSize: '12px',
        lineHeight: 1.5,
    },
    label: {
        fontWeight: 'bold',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: theme.palette.swatches.grey.grey500,
    },
    gap: {
        fontStyle: 'italic',
    },
}))

/**
 * The SIS documents that define a mission or instrument's products, or the
 * recorded reason there are none. Renders nothing when neither is known.
 */
export const SisDocumentation = (props) => {
    const { mission, instruments, label } = props

    const c = useStyles()

    const documents = getSisForInstrument(mission, instruments)
    const gap = documents.length === 0 ? getSisGap(mission, instruments) : null

    if (documents.length === 0 && gap == null) return null

    return (
        <div className={c.row} aria-label="sis documentation">
            <span className={c.label}>{label || 'Documentation'}</span>
            {gap != null ? (
                <span className={c.gap}>{gap.note}</span>
            ) : (
                documents.map((document) => <SisLink document={document} key={document.id} />)
            )}
        </div>
    )
}

SisDocumentation.propTypes = {
    mission: PropTypes.string,
    instruments: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    label: PropTypes.string,
}

export default SisDocumentation
