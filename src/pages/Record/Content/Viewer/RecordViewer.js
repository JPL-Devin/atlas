import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import { makeStyles } from '@mui/styles'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import WrapTextIcon from '@mui/icons-material/WrapText'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'

import {
    getIn,
    getPDSUrl,
    getExtension,
    getHeader,
    copyToClipboard,
} from '../../../../core/utils.js'
import { setSnackBarText } from '../../../../core/redux/actions/actions'
import {
    ES_PATHS,
    IMAGE_EXTENSIONS,
    TEXT_PREVIEW_EXTENSIONS,
    DOCUMENT_PREVIEW_EXTENSIONS,
    VIDEO_PREVIEW_EXTENSIONS,
    AUDIO_PREVIEW_EXTENSIONS,
    MAX_TEXT_PREVIEW_BYTES,
} from '../../../../core/constants.js'
import { getAppInstanceKey } from '../../../../core/appConfig.js'
import { resolvePresentation } from '../../../../core/recordPresentation'
import { emptyStates } from '../../../../config/recordDetail'

import OpenSeadragonViewer from '../../../../components/OpenSeadragonViewer/OpenSeadragonViewer'
import ThreeViewer from '../../../../components/ThreeViewer/ThreeViewer'
import ViewerLoading from '../../../../components/ViewerLoading/ViewerLoading'

const columnColors = (theme) => [
    theme.palette.swatches.grey.grey150,
    theme.palette.swatches.blue.blue300,
    theme.palette.swatches.green.green200,
    theme.palette.swatches.yellow.yellow500,
    theme.palette.swatches.orange.orange600,
    theme.palette.swatches.purple.purple400,
    theme.palette.swatches.lightblue.lightblue700,
    theme.palette.swatches.red.red400,
]

const useStyles = makeStyles((theme) => ({
    ...Object.fromEntries(columnColors(theme).map((color, i) => [`col${i}`, { color }])),
    delimiter: {
        color: theme.palette.swatches.grey.grey500,
    },
    RecordViewer: {
        flex: 1,
        height: '100%',
        display: 'flex',
        flexFlow: 'column',
        background: theme.palette.swatches.grey.grey150,
        minWidth: 0,
        [theme.breakpoints.down('lg')]: {
            // Stacked, the image leads and the panel follows it.
            order: -1,
            height: 'unset',
            flex: 'unset',
        },
    },
    // The shadow rides on an overlay so the viewers' own canvases don't cover it.
    viewerBody: {
        'position': 'relative',
        'flex': 1,
        'minHeight': 0,
        '&:after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 2,
            boxShadow: 'inset 0px 2px 4px 0px rgba(0, 0, 0, 0.15)',
        },
        [theme.breakpoints.down('lg')]: {
            flex: 'unset',
            height: '55vh',
        },
    },
    // The viewers paint their own surface, so match it while they're absent.
    loadingBody: {
        background: theme.palette.swatches.grey.grey150,
    },
    emptyState: {
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexFlow: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: theme.palette.swatches.grey.grey500,
        padding: '32px',
        [theme.breakpoints.down('lg')]: {
            // Stacked the column has no height of its own to centre within.
            flex: 'unset',
            height: '55vh',
            padding: '24px 16px',
        },
    },
    emptyStateTitle: {
        fontSize: '15px',
        fontWeight: 'bold',
        marginBottom: '6px',
    },
    emptyStateBody: {
        fontSize: '13px',
        maxWidth: '360px',
    },
    // Name | asset toggle | actions, as a strip the preview scrolls beneath.
    toolbar: {
        flex: '0 0 36px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)',
        alignItems: 'center',
        gap: '8px',
        padding: '0 8px',
        background: theme.palette.swatches.grey.grey850,
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey700}`,
        color: theme.palette.swatches.grey.grey300,
    },
    toolbarName: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: 0,
        fontSize: '12px',
        fontFamily: 'monospace',
        color: theme.palette.swatches.grey.grey150,
    },
    toolbarFilename: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    typeChip: {
        flexShrink: 0,
        padding: '1px 6px',
        borderRadius: '3px',
        fontSize: '10px',
        fontWeight: 'bold',
        letterSpacing: '0.04em',
        color: theme.palette.swatches.grey.grey850,
        background: theme.palette.swatches.grey.grey300,
    },
    toolbarActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '2px',
    },
    toolbarButton: {
        'padding': '4px',
        'color': theme.palette.swatches.grey.grey300,
        '&.Mui-disabled': {
            color: theme.palette.swatches.grey.grey600,
        },
        '&.active': {
            color: theme.palette.swatches.grey.grey0,
            background: theme.palette.swatches.grey.grey700,
        },
        '& svg': {
            fontSize: '18px',
        },
    },
    assetToggle: {
        '& .MuiToggleButton-root': {
            padding: '1px 10px',
            fontSize: '12px',
            textTransform: 'none',
            color: theme.palette.swatches.grey.grey300,
            borderColor: theme.palette.swatches.grey.grey700,
        },
        '& .MuiToggleButton-root.Mui-selected': {
            color: theme.palette.swatches.grey.grey0,
            background: theme.palette.swatches.grey.grey700,
        },
    },
    documentFrame: {
        display: 'block',
        width: '100%',
        height: '100%',
        border: 'none',
        background: theme.palette.swatches.grey.grey850,
    },
    mediaBody: {
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.swatches.grey.grey850,
    },
    video: {
        maxWidth: '100%',
        maxHeight: '100%',
        outline: 'none',
    },
    audio: {
        width: 'calc(100% - 64px)',
        maxWidth: '640px',
    },
    textPreview: {
        height: '100%',
        margin: 0,
        padding: '16px',
        boxSizing: 'border-box',
        overflow: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: '1.5',
        whiteSpace: 'pre',
        color: theme.palette.swatches.grey.grey150,
        background: theme.palette.swatches.grey.grey850,
    },
    textPreviewWrapped: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
    },
    srOnly: {
        position: 'absolute',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
    },
}))

// The viewer outlives the tabs, so a tab that wants overlays on the image
// registers them here instead of mounting its own viewer.
const OverlayContext = createContext(() => {})

export const RecordViewerOverlayProvider = OverlayContext.Provider

/**
 * Puts a tab's overlay features on the shared viewer
 *
 * @param {Object} overlay - { features }
 * @param {Array} deps - when to re-register
 */
export const useViewerOverlay = (overlay, deps) => {
    const setOverlay = useContext(OverlayContext)

    useEffect(() => {
        setOverlay(overlay)
        return () => setOverlay({})
    }, deps)
}

/**
 * Reads the viewable asset out of a record
 *
 * @param {Object} recordData - the indexed record
 * @return {Object} { url, type }
 */
export const getViewableAsset = (recordData) => {
    const release_id = getIn(recordData, ES_PATHS.release_id)
    const browse_uri = getIn(recordData, ES_PATHS.browse)
    const uri = getIn(recordData, ES_PATHS.source)

    let url = getPDSUrl(browse_uri, release_id)
    let type = getExtension(url, true)
    if (!IMAGE_EXTENSIONS.includes(type)) {
        url = getPDSUrl(uri, release_id)
        type = getExtension(url, true)
    }
    return { url, type }
}

const SOURCE_PREVIEW_EXTENSIONS = [
    ...TEXT_PREVIEW_EXTENSIONS,
    ...DOCUMENT_PREVIEW_EXTENSIONS,
    ...VIDEO_PREVIEW_EXTENSIONS,
    ...AUDIO_PREVIEW_EXTENSIONS,
]

const TOO_LARGE_NOTICE = {
    title: 'This file is too large to preview inline.',
    body: 'Download the product to view its full contents.',
}
const FETCH_FAILED_NOTICE = {
    title: 'Preview unavailable',
    body: 'The file could not be loaded for inline preview.',
}

/**
 * Fetches a text product for inline display, bailing out over the size cap
 *
 * @param {string} url - the product URL
 * @return {Object} { status: 'loading'|'ready'|'too_large'|'error', text }
 */
const useTextPreview = (url) => {
    const [state, setState] = useState({ url: null, status: 'loading', text: null })

    useEffect(() => {
        if (url == null) {
            return
        }
        const controller = new AbortController()
        const settle = (status, text) => {
            if (!controller.signal.aborted) {
                setState({ url, status, text })
            }
        }

        // Streamed so an oversized body is aborted after the cap, not buffered whole.
        const readCapped = async () => {
            const res = await fetch(url, {
                headers: getHeader().headers,
                signal: controller.signal,
            })
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`)
            }
            if (Number(res.headers.get('content-length')) > MAX_TEXT_PREVIEW_BYTES) {
                await res.body?.cancel()
                return null
            }
            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let bytes = 0
            let text = ''
            for (;;) {
                const { done, value } = await reader.read()
                if (done) {
                    break
                }
                bytes += value.byteLength
                if (bytes > MAX_TEXT_PREVIEW_BYTES) {
                    await reader.cancel()
                    return null
                }
                text += decoder.decode(value, { stream: true })
            }
            return text + decoder.decode()
        }

        readCapped()
            .then((text) => settle(text == null ? 'too_large' : 'ready', text))
            .catch(() => settle('error', null))

        return () => controller.abort()
    }, [url])

    // A stale result for the previous url reads as loading for this one.
    return state.url === url ? state : { status: 'loading', text: null }
}

const COLUMN_COLOR_COUNT = 8
// Beyond this many fields, remaining text renders uncoloured to keep the DOM small
const MAX_COLORED_FIELDS = 50000

const splitDelimited = (line, delimiter) => {
    const fields = []
    let field = ''
    let quoted = false
    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
            quoted = !quoted
            field += ch
        } else if (ch === delimiter && !quoted) {
            fields.push(field)
            field = ''
        } else {
            field += ch
        }
    }
    fields.push(field)
    return fields
}

const ColoredDelimitedText = (props) => {
    const { text, delimiter, classes } = props
    const lines = text.split('\n')
    const rows = []
    let fieldCount = 0
    let coloredLines = 0
    while (coloredLines < lines.length) {
        const fields = splitDelimited(lines[coloredLines], delimiter)
        if (fieldCount + fields.length > MAX_COLORED_FIELDS) {
            break
        }
        fieldCount += fields.length
        rows.push(fields)
        coloredLines++
    }
    const rest = lines.slice(coloredLines)
    return (
        <>
            {rows.map((fields, row) => {
                return (
                    <span key={row}>
                        {fields.map((field, col) => (
                            <React.Fragment key={col}>
                                {col > 0 && <span className={classes.delimiter}>{delimiter}</span>}
                                <span className={classes[`col${col % COLUMN_COLOR_COUNT}`]}>
                                    {field}
                                </span>
                            </React.Fragment>
                        ))}
                        {'\n'}
                    </span>
                )
            })}
            {rest.length > 0 && rest.join('\n')}
        </>
    )
}

ColoredDelimitedText.propTypes = {
    text: PropTypes.string.isRequired,
    delimiter: PropTypes.string.isRequired,
    classes: PropTypes.object.isRequired,
}

const TextPreview = (props) => {
    const { text, type, wrap, classes } = props
    let content = text
    if (type === 'csv') {
        content = <ColoredDelimitedText text={text} delimiter="," classes={classes} />
    } else if (type === 'tab') {
        const delimiter = text.includes('\t') ? '\t' : ','
        content = <ColoredDelimitedText text={text} delimiter={delimiter} classes={classes} />
    }
    return (
        <pre
            className={`${classes.textPreview} ${wrap ? classes.textPreviewWrapped : ''}`}
            aria-label="text preview"
        >
            {content}
        </pre>
    )
}

TextPreview.propTypes = {
    text: PropTypes.string.isRequired,
    type: PropTypes.string,
    wrap: PropTypes.bool,
    classes: PropTypes.object.isRequired,
}

const ToolbarButton = (props) => {
    const { title, active, className, ...rest } = props
    return (
        <Tooltip title={title} arrow>
            <span>
                <IconButton
                    size="small"
                    className={`${className} ${active ? 'active' : ''}`}
                    aria-pressed={active}
                    {...rest}
                />
            </span>
        </Tooltip>
    )
}

ToolbarButton.propTypes = {
    title: PropTypes.string.isRequired,
    active: PropTypes.bool,
    className: PropTypes.string,
}

const basename = (uri) => (uri || '').split('/').pop()

const RecordViewer = (props) => {
    const { recordData, loading, overlay } = props
    const c = useStyles()
    const dispatch = useDispatch()

    const [viewerFailed, setViewerFailed] = useState(false)
    const [asset, setAsset] = useState('source')
    const [wrap, setWrap] = useState(false)
    const [playing, setPlaying] = useState(false)
    const [muted, setMuted] = useState(false)
    const mediaRef = useRef(null)
    const isNarrow = useMediaQuery(useTheme().breakpoints.down('lg'))

    const release_id = getIn(recordData, ES_PATHS.release_id)
    const supplemental = getIn(recordData, ES_PATHS.supplemental)

    // A pending record isn't a product without a browse image, so it shows the
    // loading state rather than the empty state.
    const isLoading = loading === true && Object.keys(recordData || {}).length === 0

    const presentation = resolvePresentation(recordData, { instance: getAppInstanceKey() })
    const emptyState = emptyStates[presentation.emptyState] || emptyStates.no_browse_generic

    const { url: imgURL, type } = getViewableAsset(recordData)

    // Non-image products preview the source product itself, never the browse image.
    const sourceURI = getIn(recordData, ES_PATHS.source)
    const sourceURL = getPDSUrl(sourceURI, release_id)
    const sourceType = getExtension(sourceURL, true)
    const rawSize = getIn(recordData, ES_PATHS.archive.size)
    const sourceSize = rawSize != null && !isNaN(Number(rawSize)) ? Number(rawSize) : null

    const hasImage = imgURL != null && (type === 'obj' || IMAGE_EXTENSIONS.includes(type))
    const hasSourcePreview = sourceURL != null && SOURCE_PREVIEW_EXTENSIONS.includes(sourceType)
    // With both a source preview and a browse image, the source leads and the
    // browse is a toggle away.
    const canToggle = hasImage && hasSourcePreview
    const showSource = hasSourcePreview && (!hasImage || asset === 'source')
    const isImage = hasImage && !showSource

    const isTextPreview = showSource && TEXT_PREVIEW_EXTENSIONS.includes(sourceType)
    const textTooLarge = isTextPreview && sourceSize != null && sourceSize > MAX_TEXT_PREVIEW_BYTES
    const isDocumentPreview = showSource && DOCUMENT_PREVIEW_EXTENSIONS.includes(sourceType)
    const isVideoPreview = showSource && VIDEO_PREVIEW_EXTENSIONS.includes(sourceType)
    const isAudioPreview = showSource && AUDIO_PREVIEW_EXTENSIONS.includes(sourceType)
    const isMediaPreview = isVideoPreview || isAudioPreview

    const text = useTextPreview(isTextPreview && !textTooLarge ? sourceURL : null)
    const textNotice =
        text.status === 'too_large'
            ? TOO_LARGE_NOTICE
            : text.status === 'error'
              ? FETCH_FAILED_NOTICE
              : null

    // A product whose only asset is a source image the archive can't render
    // falls back to the configured empty state once the viewer reports failure.
    const hasViewable =
        (isImage || showSource) && !viewerFailed && !textTooLarge && textNotice == null

    useEffect(() => {
        setViewerFailed(false)
        setAsset('source')
        setPlaying(false)
        setMuted(false)
    }, [imgURL, sourceURL])

    const toggleMedia = () => {
        const media = mediaRef.current
        if (media == null) {
            return
        }
        if (media.paused) {
            media.play().catch(() => setViewerFailed(true))
        } else {
            media.pause()
        }
    }
    const toggleMuted = () => {
        if (mediaRef.current != null) {
            mediaRef.current.muted = !mediaRef.current.muted
        }
    }

    const mediaEvents = {
        ref: mediaRef,
        controls: true,
        preload: 'metadata',
        muted,
        onPlay: () => setPlaying(true),
        onPause: () => setPlaying(false),
        onVolumeChange: (e) => setMuted(e.target.muted),
        onError: () => setViewerFailed(true),
    }

    const activeURI = showSource ? sourceURI : getIn(recordData, ES_PATHS.browse) || sourceURI
    const activeType = showSource ? sourceType : type

    const toolbar = hasSourcePreview && !isLoading && (
        <div className={c.toolbar} role="toolbar" aria-label="viewer toolbar">
            <div className={c.toolbarName}>
                <span className={c.typeChip}>{activeType.toUpperCase()}</span>
                <span className={c.toolbarFilename} title={activeURI}>
                    {basename(activeURI)}
                </span>
            </div>
            <div>
                {canToggle && (
                    <ToggleButtonGroup
                        className={c.assetToggle}
                        size="small"
                        exclusive
                        value={asset}
                        aria-label="viewer asset"
                        onChange={(e, next) => {
                            if (next != null) {
                                setAsset(next)
                                setViewerFailed(false)
                                setPlaying(false)
                            }
                        }}
                    >
                        <ToggleButton value="source" aria-label="show source preview">
                            {sourceType.toUpperCase()}
                        </ToggleButton>
                        <ToggleButton value="browse" aria-label="show browse image">
                            Browse
                        </ToggleButton>
                    </ToggleButtonGroup>
                )}
            </div>
            <div className={c.toolbarActions}>
                {isTextPreview && (
                    <>
                        <ToolbarButton
                            title="Wrap lines"
                            aria-label="wrap lines"
                            className={c.toolbarButton}
                            active={wrap}
                            disabled={text.status !== 'ready'}
                            onClick={() => setWrap((w) => !w)}
                        >
                            <WrapTextIcon />
                        </ToolbarButton>
                        <ToolbarButton
                            title="Copy text"
                            aria-label="copy text"
                            className={c.toolbarButton}
                            disabled={text.status !== 'ready'}
                            onClick={() => {
                                copyToClipboard(text.text)
                                dispatch(setSnackBarText('Copied text to clipboard!', 'success'))
                            }}
                        >
                            <ContentCopyIcon />
                        </ToolbarButton>
                    </>
                )}
                {isMediaPreview && (
                    <>
                        <ToolbarButton
                            title={playing ? 'Pause' : 'Play'}
                            aria-label={playing ? 'pause media' : 'play media'}
                            className={c.toolbarButton}
                            disabled={viewerFailed}
                            onClick={toggleMedia}
                        >
                            {playing ? <PauseIcon /> : <PlayArrowIcon />}
                        </ToolbarButton>
                        <ToolbarButton
                            title={muted ? 'Unmute' : 'Mute'}
                            aria-label={muted ? 'unmute media' : 'mute media'}
                            className={c.toolbarButton}
                            active={muted}
                            disabled={viewerFailed}
                            onClick={toggleMuted}
                        >
                            {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                        </ToolbarButton>
                    </>
                )}
                {(isDocumentPreview || isMediaPreview) && (
                    <ToolbarButton
                        title="Open in new tab"
                        aria-label="open source in new tab"
                        className={c.toolbarButton}
                        onClick={() => window.open(sourceURL, '_blank', 'noopener')}
                    >
                        <OpenInNewIcon />
                    </ToolbarButton>
                )}
            </div>
        </div>
    )

    const notice = textTooLarge ? TOO_LARGE_NOTICE : textNotice || emptyState

    // Stacked, an empty state would only push the panel down.
    if (isNarrow && !hasViewable && !canToggle && !isLoading) {
        return null
    }

    return (
        <div className={c.RecordViewer}>
            {toolbar}
            {isLoading ? (
                <div className={`${c.viewerBody} ${c.loadingBody}`}>
                    <ViewerLoading label="record loading" />
                </div>
            ) : hasViewable ? (
                <>
                    {presentation.altText != null && (
                        <span className={c.srOnly}>{presentation.altText}</span>
                    )}
                    <div className={c.viewerBody}>
                        {isTextPreview ? (
                            text.status === 'ready' ? (
                                <TextPreview
                                    text={text.text}
                                    type={sourceType}
                                    wrap={wrap}
                                    classes={c}
                                />
                            ) : (
                                <ViewerLoading label="text preview loading" />
                            )
                        ) : isDocumentPreview ? (
                            <iframe
                                className={c.documentFrame}
                                src={sourceURL}
                                title="pdf preview"
                            />
                        ) : isVideoPreview ? (
                            <div className={c.mediaBody}>
                                {/* eslint-disable-next-line jsx-a11y/media-has-caption -- archive products ship no caption tracks */}
                                <video key={sourceURL} className={c.video} {...mediaEvents}>
                                    <source src={sourceURL} type="video/mp4" />
                                </video>
                            </div>
                        ) : isAudioPreview ? (
                            <div className={c.mediaBody}>
                                {/* eslint-disable-next-line jsx-a11y/media-has-caption -- archive products ship no caption tracks */}
                                <audio key={sourceURL} className={c.audio} {...mediaEvents}>
                                    <source src={sourceURL} type="audio/wav" />
                                </audio>
                            </div>
                        ) : type === 'obj' ? (
                            <ThreeViewer
                                url={imgURL}
                                release_id={release_id}
                                supplemental={supplemental}
                            />
                        ) : (
                            <OpenSeadragonViewer
                                image={{ src: imgURL }}
                                // 0 opens at the home zoom, so the image fills the
                                // viewer's constraining dimension.
                                settings={{ defaultZoomLevel: 0 }}
                                features={overlay.features}
                                onOpenFailed={() => setViewerFailed(true)}
                            />
                        )}
                    </div>
                </>
            ) : (
                <div className={c.emptyState}>
                    <div className={c.emptyStateTitle}>{notice.title}</div>
                    <div className={c.emptyStateBody}>{notice.body}</div>
                </div>
            )}
        </div>
    )
}

RecordViewer.propTypes = {
    recordData: PropTypes.object,
    loading: PropTypes.bool,
    overlay: PropTypes.object,
}

export default RecordViewer
