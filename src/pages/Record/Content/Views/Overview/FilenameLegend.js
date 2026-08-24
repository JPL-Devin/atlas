import React from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'

import { DARK_COLORS } from '../../../filenameColors'

// Entries line up under their segment, but a late segment would run off the
// panel, so the indent stops here.
const MAX_INDENT = 14

const useStyles = makeStyles((theme) => ({
    filename: {
        fontFamily: 'monospace',
        fontSize: '12px',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        overflowX: 'auto',
        paddingBottom: '4px',
    },
    piece: {
        borderBottom: '2px solid transparent',
    },
    entries: {
        paddingTop: '4px',
    },
    entry: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px',
        padding: '2px 0',
    },
    // A stem down from the segment, elbowing into its description.
    elbow: {
        width: '10px',
        height: '11px',
        marginTop: '2px',
        flexShrink: 0,
        borderLeft: '1px solid',
        borderBottom: '1px solid',
        borderBottomLeftRadius: '3px',
    },
    entryText: {
        minWidth: 0,
        fontSize: '12px',
        lineHeight: '16px',
    },
    entryValue: {
        fontFamily: 'monospace',
        marginRight: '6px',
    },
    entryLabel: {
        color: theme.palette.swatches.grey.grey300,
    },
    entryMeaning: {
        color: theme.palette.swatches.grey.grey0,
    },
    entryDescription: {
        color: theme.palette.swatches.grey.grey400,
    },
    reference: {
        marginTop: '8px',
        fontSize: '11px',
        color: theme.palette.swatches.grey.grey400,
    },
}))

const FilenameLegend = (props) => {
    const { parsed } = props

    const c = useStyles()

    let offset = 0
    const pieces = parsed.pieces.map((piece) => {
        const start = offset
        offset += piece.text.length
        return { ...piece, start, color: DARK_COLORS[piece.color] || 'inherit' }
    })
    const entries = pieces.filter((piece) => piece.label != null)

    return (
        <div aria-label="filename breakdown">
            <div className={c.filename}>
                {pieces.map((piece, idx) => (
                    <span
                        className={c.piece}
                        style={{ color: piece.color, borderBottomColor: piece.color }}
                        key={idx}
                    >
                        {piece.text}
                    </span>
                ))}
            </div>
            <div className={c.entries}>
                {entries.map((piece, idx) => (
                    <div
                        className={c.entry}
                        style={{ marginLeft: `${Math.min(piece.start, MAX_INDENT)}ch` }}
                        key={idx}
                    >
                        <div className={c.elbow} style={{ borderColor: piece.color }} />
                        <div className={c.entryText}>
                            <span className={c.entryValue} style={{ color: piece.color }}>
                                {piece.text}
                            </span>
                            <span className={c.entryLabel}>{piece.label}</span>
                            {piece.meaning != null && (
                                <div className={c.entryMeaning}>{piece.meaning}</div>
                            )}
                            {piece.description != null && (
                                <div className={c.entryDescription}>{piece.description}</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {parsed.reference != null && <div className={c.reference}>{parsed.reference}</div>}
        </div>
    )
}

FilenameLegend.propTypes = {
    parsed: PropTypes.object,
}

export default FilenameLegend
