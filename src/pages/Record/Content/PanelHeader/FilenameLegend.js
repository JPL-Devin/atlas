import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'

import Tooltip from '@mui/material/Tooltip'
import { makeStyles } from '@mui/styles'

import { LIGHT_COLORS } from '../../filenameColors'
import { setRecordFilenamePart } from '../../../../core/redux/actions/actions'

const useStyles = makeStyles((theme) => ({
    filenameRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        width: '100%',
        minWidth: 0,
    },
    // The name wraps rather than scrolling, so its tail is never hidden.
    filename: {
        flex: 1,
        fontSize: '16px',
        fontWeight: 'bold',
        lineHeight: '21px',
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
        // A matching transparent top border keeps the name optically centred
        // whether or not a segment is underlined.
        'borderTop': '2px solid transparent',
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
            background: theme.palette.swatches.grey.grey150,
            color: theme.palette.swatches.grey.grey900,
        },
        '&[aria-pressed=true]': {
            background: theme.palette.swatches.grey.grey200,
            color: theme.palette.swatches.grey.grey900,
        },
    },
    // The block is sized to its content in JS so opening, closing and swapping
    // segments all animate; closed it takes no space at all.
    details: {
        overflow: 'hidden',
        transition: 'height 240ms ease',
    },
    // Every segment at once is far taller than the header can be, so it scrolls
    // with its bar out at the panel edge, in line with the body's scrollbar.
    detailsAll: {
        'overflowY': 'auto',
        'marginRight': '-20px',
        'paddingRight': '12px',
        'scrollbarWidth': 'thin',
        'scrollbarColor': `${theme.palette.swatches.grey.grey300} transparent`,
        '&::-webkit-scrollbar': {
            width: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
            background: theme.palette.swatches.grey.grey300,
            borderRadius: '4px',
        },
    },
    detailsContent: {
        paddingBottom: '14px',
    },
    // One open segment keeps a fixed height, so switching segments never
    // shifts the panel below.
    detailsContentOne: {
        minHeight: '104px',
    },
    entry: {
        fontSize: '14px',
        lineHeight: '19px',
        padding: '3px 0',
    },
    entryValue: {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontWeight: 'bold',
        letterSpacing: '0.02em',
        marginRight: '8px',
    },
    entryLabel: {
        fontSize: '12px',
        fontWeight: 'bold',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: theme.palette.swatches.grey.grey500,
    },
    entryMeaning: {
        color: theme.palette.text.primary,
    },
    entryDescription: {
        fontSize: '13px',
        color: theme.palette.swatches.grey.grey600,
    },
    reference: {
        marginTop: '8px',
        fontSize: '11px',
        color: theme.palette.swatches.grey.grey500,
    },
}))

// Colours the parsed segments and tracks which one is open. The selection lives
// in redux so it survives switching record tabs.
export const useFilenameSelection = (parsed) => {
    const dispatch = useDispatch()
    const part = useSelector((state) => state.get('recordFilenamePart'))

    const selected = part?.get('selected') ?? null
    const showAll = part?.get('showAll') ?? false
    const setSelected = (next) => dispatch(setRecordFilenamePart(next, showAll))
    const setShowAll = (next) => dispatch(setRecordFilenamePart(selected, next))

    const pieces = (parsed?.pieces || []).map((piece, idx) => ({
        ...piece,
        idx,
        color: LIGHT_COLORS[piece.color] || 'inherit',
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
            <Tooltip
                title={showAll ? 'Hide all file naming details' : 'Show all file naming details'}
                arrow
            >
                <button
                    type="button"
                    className={c.allButton}
                    aria-label="show all file naming details"
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

    const contentRef = useRef(null)
    const [contentHeight, setContentHeight] = useState(0)

    // The content's own height is what the block animates to.
    useEffect(() => {
        const content = contentRef.current
        if (content == null) return undefined
        const measure = () => setContentHeight(content.scrollHeight)
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(content)
        return () => observer.disconnect()
    }, [entries.length])

    const scrolls = entries.length > 1

    return (
        <div
            className={`${c.details} ${scrolls ? c.detailsAll : ''}`}
            style={{
                height: entries.length === 0 ? 0 : `min(${contentHeight}px, 40vh)`,
            }}
        >
            <div
                className={`${c.detailsContent} ${entries.length === 1 ? c.detailsContentOne : ''}`}
                ref={contentRef}
            >
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

FilenameDetails.propTypes = {
    parsed: PropTypes.object.isRequired,
    selection: PropTypes.object.isRequired,
}
