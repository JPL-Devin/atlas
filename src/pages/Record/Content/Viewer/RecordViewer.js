import React, { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'

import { makeStyles } from '@mui/styles'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import { getIn, getPDSUrl, getExtension, getHeader } from '../../../../core/utils.js'
import {
    ES_PATHS,
    IMAGE_EXTENSIONS,
    TEXT_PREVIEW_EXTENSIONS,
    DOCUMENT_PREVIEW_EXTENSIONS,
    VIDEO_PREVIEW_EXTENSIONS,
    AUDIO_PREVIEW_EXTENSIONS,
    PREVIEWABLE_EXTENSIONS,
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
        if (url == null) return
        let cancelled = false
        const settle = (status, text) => {
            if (!cancelled) setState({ url, status, text })
        }

        axios
            .get(url, {
                ...getHeader(),
                responseType: 'text',
                transformResponse: [(data) => data],
                // The index can lack a size, so cap the body itself as well.
                maxContentLength: MAX_TEXT_PREVIEW_BYTES,
            })
            .then((res) => {
                if (res.status < 200 || res.status >= 300) {
                    throw new Error(`HTTP ${res.status}`)
                }
                const text = typeof res.data === 'string' ? res.data : String(res.data ?? '')
                // Browsers don't enforce maxContentLength, so measure bytes, not chars.
                if (new Blob([text]).size > MAX_TEXT_PREVIEW_BYTES) {
                    settle('too_large', null)
                } else {
                    settle('ready', text)
                }
            })
            .catch((err) => {
                const tooLarge =
                    err != null &&
                    (err.code === 'ERR_BAD_RESPONSE' ||
                        /maxContentLength/i.test(String(err.message || '')))
                settle(tooLarge ? 'too_large' : 'error', null)
            })

        return () => {
            cancelled = true
        }
    }, [url])

    // A stale result for the previous url reads as loading for this one.
    return state.url === url ? state : { status: 'loading', text: null }
}

const COLUMN_COLOR_COUNT = 8
// Beyond this many rows, remaining lines render uncoloured to keep the DOM small
const MAX_COLORED_ROWS = 5000

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
    const colored = lines.slice(0, MAX_COLORED_ROWS)
    const rest = lines.slice(MAX_COLORED_ROWS)
    return (
        <>
            {colored.map((line, row) => {
                const fields = splitDelimited(line, delimiter)
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
    const { url, type, classes, onNotice } = props
    const { status, text } = useTextPreview(url)

    useEffect(() => {
        if (status === 'too_large') {
            onNotice(TOO_LARGE_NOTICE)
        } else if (status === 'error') {
            onNotice(FETCH_FAILED_NOTICE)
        }
    }, [status, onNotice])

    if (status === 'loading') {
        return <ViewerLoading label="text preview loading" />
    }
    if (status !== 'ready') {
        return null
    }
    let content = text
    if (type === 'csv') {
        content = <ColoredDelimitedText text={text} delimiter="," classes={classes} />
    } else if (type === 'tab') {
        const delimiter = text.includes('\t') ? '\t' : ','
        content = <ColoredDelimitedText text={text} delimiter={delimiter} classes={classes} />
    }
    return (
        <pre className={classes.textPreview} aria-label="text preview">
            {content}
        </pre>
    )
}

TextPreview.propTypes = {
    url: PropTypes.string,
    type: PropTypes.string,
    classes: PropTypes.object.isRequired,
    onNotice: PropTypes.func.isRequired,
}

const RecordViewer = (props) => {
    const { recordData, loading, overlay } = props
    const c = useStyles()

    const [viewerFailed, setViewerFailed] = useState(false)
    const [textNotice, setTextNotice] = useState(null)
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
    const sourceURL = getPDSUrl(getIn(recordData, ES_PATHS.source), release_id)
    const sourceType = getExtension(sourceURL, true)
    const rawSize = getIn(recordData, ES_PATHS.archive.size)
    const sourceSize = rawSize != null && !isNaN(Number(rawSize)) ? Number(rawSize) : null

    const isImage = imgURL != null && (type === 'obj' || IMAGE_EXTENSIONS.includes(type))
    const isTextPreview = !isImage && TEXT_PREVIEW_EXTENSIONS.includes(sourceType)
    const textTooLarge = isTextPreview && sourceSize != null && sourceSize > MAX_TEXT_PREVIEW_BYTES
    const isDocumentPreview = !isImage && DOCUMENT_PREVIEW_EXTENSIONS.includes(sourceType)
    const isVideoPreview = !isImage && VIDEO_PREVIEW_EXTENSIONS.includes(sourceType)
    const isAudioPreview = !isImage && AUDIO_PREVIEW_EXTENSIONS.includes(sourceType)

    // A product whose only asset is a source image the archive can't render
    // falls back to the configured empty state once the viewer reports failure.
    const hasViewable =
        (isImage || (sourceURL != null && PREVIEWABLE_EXTENSIONS.includes(sourceType))) &&
        !viewerFailed &&
        !textTooLarge &&
        textNotice == null

    useEffect(() => {
        setViewerFailed(false)
        setTextNotice(null)
    }, [imgURL, sourceURL])

    const notice = textTooLarge ? TOO_LARGE_NOTICE : textNotice || emptyState

    // Stacked, an empty state would only push the panel down.
    if (isNarrow && !hasViewable && !isLoading) return null

    return (
        <div className={c.RecordViewer}>
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
                            <TextPreview
                                url={sourceURL}
                                type={sourceType}
                                classes={c}
                                onNotice={setTextNotice}
                            />
                        ) : isDocumentPreview ? (
                            <iframe
                                className={c.documentFrame}
                                src={sourceURL}
                                title="pdf preview"
                            />
                        ) : isVideoPreview ? (
                            <div className={c.mediaBody}>
                                {/* eslint-disable-next-line jsx-a11y/media-has-caption -- archive products ship no caption tracks */}
                                <video
                                    className={c.video}
                                    controls
                                    preload="metadata"
                                    onError={() => setViewerFailed(true)}
                                >
                                    <source src={sourceURL} type="video/mp4" />
                                </video>
                            </div>
                        ) : isAudioPreview ? (
                            <div className={c.mediaBody}>
                                {/* eslint-disable-next-line jsx-a11y/media-has-caption -- archive products ship no caption tracks */}
                                <audio
                                    className={c.audio}
                                    controls
                                    preload="metadata"
                                    onError={() => setViewerFailed(true)}
                                >
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
