import React, { useState } from 'react'
import PropTypes from 'prop-types'

import Tooltip from '@mui/material/Tooltip'
import { makeStyles } from '@mui/styles'

import { DARK_COLORS } from '../../../filenameColors'

const useStyles = makeStyles((theme) => ({
    FilenameLegend: {
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey700}`,
        paddingBottom: '8px',
        marginBottom: '4px',
    },
    filenameRow: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px',
    },
    // The name wraps rather than scrolling, so its tail is never hidden.
    filename: {
        flex: 1,
        fontFamily: 'monospace',
        fontSize: '15px',
        lineHeight: '23px',
        letterSpacing: '0.02em',
        wordBreak: 'break-all',
        paddingBottom: '2px',
    },
    segment: {
        'font': 'inherit',
        'padding': 0,
        'border': 'none',
        'background': 'none',
        'borderBottom': '2px solid',
        'cursor': 'pointer',
    },
    // Unselected segments stay readable (WCAG AA), so they lose the solid
    // underline rather than most of their contrast.
    segmentDim: {
        opacity: 0.7,
        borderBottomStyle: 'dotted',
    },
    allButton: {
        'font': 'inherit',
        'lineHeight': '12px',
        'padding': '0 4px',
        'border': `1px solid ${theme.palette.swatches.grey.grey600}`,
        'borderRadius': '3px',
        'background': 'none',
        'color': theme.palette.swatches.grey.grey300,
        'cursor': 'pointer',
        '&[aria-pressed=true]': {
            background: theme.palette.swatches.grey.grey700,
            color: theme.palette.swatches.grey.grey0,
        },
    },
    // An open segment's details keep a fixed height, so switching segments
    // never shifts the panel below.
    details: {
        minHeight: '104px',
    },
    hint: {
        fontSize: '11px',
        color: theme.palette.swatches.grey.grey400,
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

    const pieces = parsed.pieces.map((piece, idx) => ({
        ...piece,
        idx,
        color: DARK_COLORS[piece.color] || 'inherit',
    }))
    const labelled = pieces.filter((piece) => piece.label != null)

    // Clicking a segment shows only its description; the * button shows them all.
    const [selected, setSelected] = useState(null)
    const [showAll, setShowAll] = useState(false)
    const entries = showAll
        ? labelled
        : labelled.filter((piece) => selected != null && piece.idx === selected)

    return (
        <div className={c.FilenameLegend} aria-label="filename breakdown">
            <div className={c.filenameRow}>
                <div className={c.filename}>
                    {pieces.map((piece) =>
                        piece.label == null ? (
                            <span key={piece.idx}>{piece.text}</span>
                        ) : (
                            <button
                                type="button"
                                className={`${c.segment} ${
                                    !showAll && selected != null && selected !== piece.idx
                                        ? c.segmentDim
                                        : ''
                                }`}
                                style={{ color: piece.color, borderBottomColor: piece.color }}
                                aria-label={`${piece.label}: ${piece.text}`}
                                aria-pressed={selected === piece.idx}
                                onClick={() =>
                                    setSelected(selected === piece.idx ? null : piece.idx)
                                }
                                key={piece.idx}
                            >
                                {piece.text}
                            </button>
                        )
                    )}
                </div>
                <Tooltip title={showAll ? 'Hide all field details' : 'Show all field details'} arrow>
                    <button
                        type="button"
                        className={c.allButton}
                        aria-label="show all filename field details"
                        aria-pressed={showAll}
                        onClick={() => setShowAll(!showAll)}
                    >
                        *
                    </button>
                </Tooltip>
            </div>
            <div className={entries.length === 1 ? c.details : ''}>
                {entries.length === 0 && (
                    <div className={c.hint}>Select a part of the name to see what it means.</div>
                )}
                {entries.map((piece) => (
                    <div className={c.entry} key={piece.idx}>
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
                ))}
                {entries.length > 0 && parsed.reference != null && (
                    <div className={c.reference}>{parsed.reference}</div>
                )}
            </div>
        </div>
    )
}

FilenameLegend.propTypes = {
    parsed: PropTypes.object,
}

export default FilenameLegend
