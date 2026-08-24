import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'

import { DARK_COLORS } from '../../../filenameColors'

const useStyles = makeStyles((theme) => ({
    filename: {
        fontFamily: 'monospace',
        fontSize: '12px',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        overflowX: 'auto',
        paddingBottom: '6px',
    },
    segment: {
        'font': 'inherit',
        'padding': 0,
        'border': 'none',
        'background': 'none',
        'borderBottom': '2px solid',
        'cursor': 'help',
    },
    segmentDim: {
        opacity: 0.4,
    },
    entry: {
        fontSize: '12px',
        lineHeight: '16px',
        padding: '3px 0',
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

    // Hover narrows the list to one segment; a click pins it, since a touch
    // device never hovers.
    const [hovered, setHovered] = useState(null)
    const [pinned, setPinned] = useState(null)
    const active = hovered != null ? hovered : pinned

    const pieces = parsed.pieces.map((piece, idx) => ({
        ...piece,
        idx,
        color: DARK_COLORS[piece.color] || 'inherit',
    }))
    const labelled = pieces.filter((piece) => piece.label != null)
    const entries = active != null ? labelled.filter((piece) => piece.idx === active) : labelled

    return (
        <div aria-label="filename breakdown">
            <div className={c.filename}>
                {pieces.map((piece) =>
                    piece.label == null ? (
                        <span key={piece.idx}>{piece.text}</span>
                    ) : (
                        <button
                            type="button"
                            className={`${c.segment} ${
                                active != null && active !== piece.idx ? c.segmentDim : ''
                            }`}
                            style={{ color: piece.color, borderBottomColor: piece.color }}
                            aria-label={`${piece.label}: ${piece.text}`}
                            onMouseEnter={() => setHovered(piece.idx)}
                            onMouseLeave={() => setHovered(null)}
                            onFocus={() => setHovered(piece.idx)}
                            onBlur={() => setHovered(null)}
                            onClick={() => setPinned(pinned === piece.idx ? null : piece.idx)}
                            key={piece.idx}
                        >
                            {piece.text}
                        </button>
                    )
                )}
            </div>
            {entries.map((piece) => (
                <div className={c.entry} key={piece.idx}>
                    <span className={c.entryValue} style={{ color: piece.color }}>
                        {piece.text}
                    </span>
                    <span className={c.entryLabel}>{piece.label}</span>
                    {piece.meaning != null && <div className={c.entryMeaning}>{piece.meaning}</div>}
                    {piece.description != null && (
                        <div className={c.entryDescription}>{piece.description}</div>
                    )}
                </div>
            ))}
            {parsed.reference != null && <div className={c.reference}>{parsed.reference}</div>}
        </div>
    )
}

FilenameLegend.propTypes = {
    parsed: PropTypes.object,
}

export default FilenameLegend
