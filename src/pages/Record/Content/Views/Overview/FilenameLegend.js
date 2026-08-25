import React, { useState } from 'react'
import PropTypes from 'prop-types'

import Tooltip from '@mui/material/Tooltip'
import { makeStyles } from '@mui/styles'

import { DARK_COLORS } from '../../../filenameColors'

const useStyles = makeStyles((theme) => ({
    // The name stays put while the rest of the panel scrolls under it, so the
    // row is a direct child of the scroll container rather than of a wrapper.
    filenameRow: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px',
        position: 'sticky',
        // Offset by the scroll container's top padding, so nothing shows above.
        top: '-16px',
        zIndex: 2,
        background: theme.palette.swatches.grey.grey800,
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey700}`,
        // Negative margins let it span the panel's full width.
        margin: '-16px -20px 8px -20px',
        padding: '12px 20px 8px 20px',
    },
    // The name wraps rather than scrolling, so its tail is never hidden.
    filename: {
        flex: 1,
        fontSize: '18px',
        fontWeight: 'bold',
        lineHeight: '26px',
        letterSpacing: '0.02em',
        textAlign: 'center',
        wordBreak: 'break-all',
    },
    // A segment only takes its colour once it is hovered, selected or shown
    // through the * button; at rest the whole name reads as plain text.
    segment: {
        'font': 'inherit',
        'padding': 0,
        'border': 'none',
        'background': 'none',
        'borderBottom': '2px solid transparent',
        'cursor': 'pointer',
        'color': theme.palette.swatches.grey.grey300,
        '&:hover, &:focus-visible': {
            color: 'var(--segment-color)',
            borderBottomColor: 'var(--segment-color)',
        },
    },
    segmentActive: {
        color: 'var(--segment-color)',
        borderBottomColor: 'var(--segment-color)',
    },
    allButton: {
        'fontFamily': 'inherit',
        'fontWeight': 'bold',
        'fontSize': '18px',
        'lineHeight': '18px',
        'padding': '0 4px',
        'border': 'none',
        'borderRadius': '3px',
        'background': 'none',
        'color': theme.palette.swatches.grey.grey300,
        'cursor': 'pointer',
        // Borderless at rest, but it lights up on hover so it reads as a
        // control rather than a stray glyph.
        '&:hover, &:focus-visible': {
            background: theme.palette.swatches.grey.grey700,
            color: theme.palette.swatches.grey.grey0,
        },
        '&[aria-pressed=true]': {
            background: theme.palette.swatches.grey.grey600,
            color: theme.palette.swatches.grey.grey0,
        },
    },
    // An open segment's details keep a fixed height, so switching segments
    // never shifts the panel below.
    details: {
        minHeight: '104px',
        marginBottom: '4px',
    },
    detailsEmpty: {
        marginBottom: '4px',
    },
    entry: {
        fontSize: '13px',
        lineHeight: '17px',
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
        color: theme.palette.swatches.grey.grey300,
    },
    reference: {
        marginTop: '8px',
        fontSize: '11px',
        color: theme.palette.swatches.grey.grey300,
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
        <>
            <div className={c.filenameRow} aria-label="filename breakdown">
                <div className={c.filename}>
                    {pieces.map((piece) =>
                        piece.label == null ? (
                            <span key={piece.idx}>{piece.text}</span>
                        ) : (
                            <button
                                type="button"
                                className={`${c.segment} ${
                                    showAll || selected === piece.idx ? c.segmentActive : ''
                                }`}
                                style={{ '--segment-color': piece.color }}
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
                <Tooltip
                    title={showAll ? 'Hide all field details' : 'Show all field details'}
                    arrow
                >
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
            <div className={entries.length === 1 ? c.details : c.detailsEmpty}>
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
        </>
    )
}

FilenameLegend.propTypes = {
    parsed: PropTypes.object,
}

export default FilenameLegend
