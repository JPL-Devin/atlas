import React, { useState } from 'react'
import PropTypes from 'prop-types'

import Tooltip from '@mui/material/Tooltip'
import { makeStyles } from '@mui/styles'

import { DARK_COLORS } from '../../../filenameColors'

const useStyles = makeStyles((theme) => ({
    filenameRow: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px',
        width: '100%',
        minWidth: 0,
    },
    // The name wraps rather than scrolling, so its tail is never hidden.
    filename: {
        flex: 1,
        fontSize: '18px',
        fontWeight: 'bold',
        lineHeight: '23px',
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
        'color': 'inherit',
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
        'color': 'inherit',
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

// Colours the parsed segments and tracks which one is open, so the name and its
// descriptions can live in different parts of the page.
export const useFilenameSelection = (parsed) => {
    const [selected, setSelected] = useState(null)
    const [showAll, setShowAll] = useState(false)

    const pieces = (parsed?.pieces || []).map((piece, idx) => ({
        ...piece,
        idx,
        color: DARK_COLORS[piece.color] || 'inherit',
    }))
    const labelled = pieces.filter((piece) => piece.label != null)

    return {
        pieces,
        entries: showAll
            ? labelled
            : labelled.filter((piece) => selected != null && piece.idx === selected),
        selected,
        setSelected,
        showAll,
        setShowAll,
    }
}

export const FilenameName = (props) => {
    const { selection } = props
    const { pieces, selected, setSelected, showAll, setShowAll } = selection

    const c = useStyles()

    return (
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
                            onClick={() => setSelected(selected === piece.idx ? null : piece.idx)}
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
    )
}

FilenameName.propTypes = {
    selection: PropTypes.object.isRequired,
}

export const FilenameDetails = (props) => {
    const { parsed, selection } = props
    const { entries } = selection

    const c = useStyles()

    return (
        <div className={entries.length === 1 ? c.details : c.detailsEmpty}>
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
            {entries.length > 0 && parsed.reference != null && (
                <div className={c.reference}>{parsed.reference}</div>
            )}
        </div>
    )
}

FilenameDetails.propTypes = {
    parsed: PropTypes.object.isRequired,
    selection: PropTypes.object.isRequired,
}
