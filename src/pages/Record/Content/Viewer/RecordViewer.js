import React, { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import { getIn, getPDSUrl, getExtension } from '../../../../core/utils.js'
import { ES_PATHS, IMAGE_EXTENSIONS } from '../../../../core/constants.js'
import { getAppInstanceKey } from '../../../../core/appConfig.js'
import { resolvePresentation } from '../../../../core/recordPresentation'
import { emptyStates } from '../../../../config/recordDetail'

import OpenSeadragonViewer from '../../../../components/OpenSeadragonViewer/OpenSeadragonViewer'
import ThreeViewer from '../../../../components/ThreeViewer/ThreeViewer'
import ViewerLoading from '../../../../components/ViewerLoading/ViewerLoading'

const useStyles = makeStyles((theme) => ({
    RecordViewer: {
        flex: 1,
        height: '100%',
        display: 'flex',
        flexFlow: 'column',
        background: theme.palette.swatches.grey.grey0,
        minWidth: 0,
        [theme.breakpoints.down('md')]: {
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
            boxShadow: 'inset 0 8px 12px -8px rgba(0,0,0,0.35)',
        },
        [theme.breakpoints.down('md')]: {
            flex: 'unset',
            height: '55vh',
        },
    },
    // The viewers paint their own surface, so match it while they're absent.
    loadingBody: {
        background: theme.palette.swatches.grey.grey0,
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
        [theme.breakpoints.down('md')]: {
            flex: 'unset',
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
 * Puts a tab's overlay features and layers control on the shared viewer
 *
 * @param {Object} overlay - { features, onLayers }
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

const RecordViewer = (props) => {
    const { recordData, loading, overlay } = props
    const c = useStyles()

    const [viewerFailed, setViewerFailed] = useState(false)
    const isNarrow = useMediaQuery(useTheme().breakpoints.down('md'))

    const release_id = getIn(recordData, ES_PATHS.release_id)
    const supplemental = getIn(recordData, ES_PATHS.supplemental)

    // A pending record isn't a product without a browse image, so it shows the
    // loading state rather than the empty state.
    const isLoading = loading === true && Object.keys(recordData || {}).length === 0

    const presentation = resolvePresentation(recordData, { instance: getAppInstanceKey() })
    const emptyState = emptyStates[presentation.emptyState] || emptyStates.no_browse_generic

    const { url: imgURL, type } = getViewableAsset(recordData)

    // A product whose only asset is a source image the archive can't render
    // falls back to the configured empty state once the viewer reports failure.
    const hasViewable =
        imgURL != null && (type === 'obj' || IMAGE_EXTENSIONS.includes(type)) && !viewerFailed

    useEffect(() => {
        setViewerFailed(false)
    }, [imgURL])

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
                        {type === 'obj' ? (
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
                                onLayers={overlay.onLayers}
                                onOpenFailed={() => setViewerFailed(true)}
                            />
                        )}
                    </div>
                </>
            ) : (
                <div className={c.emptyState}>
                    <div className={c.emptyStateTitle}>{emptyState.title}</div>
                    <div className={c.emptyStateBody}>{emptyState.body}</div>
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
