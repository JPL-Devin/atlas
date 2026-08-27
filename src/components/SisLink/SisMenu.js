import React, { useState } from 'react'
import PropTypes from 'prop-types'

import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Tooltip from '@mui/material/Tooltip'
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined'
import { makeStyles } from '@mui/styles'

import { SisLink } from './SisLink'
import { getSisForInstrument, getSisGap } from '../../core/sis'

const useStyles = makeStyles((theme) => ({
    button: {
        'padding': 10,
        'borderRadius': 0,
        'opacity': 0.5,
        'transition': 'opacity 0.2s ease-out',
        '&:hover': {
            opacity: 1,
        },
    },
    icon: {
        fontSize: 20,
    },
    popover: {
        boxSizing: 'border-box',
        maxWidth: '480px',
        padding: '10px 14px',
    },
    heading: {
        marginBottom: '6px',
        fontSize: '11px',
        fontWeight: 'bold',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: theme.palette.swatches.grey.grey500,
    },
    document: {
        fontSize: '13px',
        lineHeight: 1.5,
        padding: '3px 0',
    },
    note: {
        fontSize: '11px',
        color: theme.palette.swatches.grey.grey500,
    },
    gap: {
        fontSize: '13px',
        fontStyle: 'italic',
        lineHeight: 1.5,
        color: theme.palette.swatches.grey.grey600,
    },
}))

/**
 * An icon button listing the SIS documents for a mission or instrument, kept
 * out of the way in a popover so headings hold their height. Renders nothing
 * when nothing applies.
 */
export const SisMenu = (props) => {
    const { mission, instruments } = props

    const c = useStyles()

    const [anchor, setAnchor] = useState(null)

    const documents = getSisForInstrument(mission, instruments)
    const gap = documents.length === 0 ? getSisGap(mission, instruments) : null

    if (documents.length === 0 && gap == null) return null

    return (
        <>
            <Tooltip title="Data Product SIS" arrow>
                <IconButton
                    className={c.button}
                    aria-label="sis documentation"
                    onClick={(event) => setAnchor(event.currentTarget)}
                    size="large"
                >
                    <DescriptionIcon className={c.icon} />
                </IconButton>
            </Tooltip>
            <Popover
                open={anchor != null}
                anchorEl={anchor}
                onClose={() => setAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <div className={c.popover}>
                    <div className={c.heading}>Data Product SIS</div>
                    {gap != null ? (
                        <div className={c.gap}>{gap.note}</div>
                    ) : (
                        documents.map((document) => (
                            <div className={c.document} key={document.id}>
                                <SisLink document={document} />
                                {document.note != null && (
                                    <div className={c.note}>{document.note}</div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Popover>
        </>
    )
}

SisMenu.propTypes = {
    mission: PropTypes.string,
    instruments: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
}

export default SisMenu
