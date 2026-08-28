import React, { useEffect, useRef, useState } from 'react'
import OpenSeadragon from 'openseadragon'
import 'svg-overlay'
import PropTypes from 'prop-types'

import clsx from 'clsx'

import { makeStyles } from '@mui/styles'

import IconButton from '@mui/material/IconButton'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import HomeIcon from '@mui/icons-material/Home'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import RotateLeftIcon from '@mui/icons-material/RotateLeft'
import RotateRightIcon from '@mui/icons-material/RotateRight'

import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'

import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'

import './OpenSeadragon.css'
import ViewerLoading from '../ViewerLoading/ViewerLoading'

const useStyles = makeStyles((theme) => ({
    OpenSeadragonViewer: {
        'width': '100%',
        'height': '100%',
        'background': theme.palette.swatches.grey.grey150,
        'position': 'relative',
        // The minimap is too cramped to be useful at phone width.
        '& #openSeadragon .navigator': {
            [theme.breakpoints.down('md')]: {
                display: 'none !important',
            },
        },
    },
    OpenSeadragonContainer: {
        width: '100%',
        height: '100%',
    },
    uiOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        padding: theme.spacing(1),
        boxSizing: 'border-box',
    },
    topLeft: {
        paddingTop: theme.spacing(1),
    },
    bottomRight: {
        paddingBottom: theme.spacing(2),
    },
    // The controls sit over a light image surface, so they're light too.
    button: {
        // Flex (still block-level, so the controls stack) keeps the box square.
        'display': 'flex !important',
        'alignItems': 'center',
        'justifyContent': 'center',
        'boxSizing': 'border-box',
        'width': '34px',
        'height': '34px',
        'fontSize': '19px',
        'pointerEvents': 'all',
        'background': theme.palette.swatches.grey.grey100,
        'color': theme.palette.swatches.grey.grey700,
        'border': `1px solid ${theme.palette.swatches.grey.grey200}`,
        'padding': 0,
        'margin': theme.spacing(0, 1),
        'borderRadius': 0,
        '&:hover': {
            background: theme.palette.swatches.grey.grey150,
            color: theme.palette.swatches.grey.grey800,
        },
    },
    gap: {
        marginBottom: theme.spacing(2),
    },
    // Stacked controls share one border between them.
    joiner: {
        borderBottom: 'none',
    },
    openFailedWrapper: {
        opacity: 0,
        transition: `0.2s ease-in opacity`,
        pointerEvents: 'none',
    },
    openFailedShown: {
        pointerEvents: 'initial',
        opacity: 1,
    },
    status: {
        'position': 'absolute',

        'background': theme.palette.swatches.grey.grey800,
        'top': 0,
        'width': '100%',
        'height': '100%',
        'transition': 'all 0.2s ease-out',
        '& > div': {
            transition: 'background 0.4s ease-out',
        },
        '& > div > div': {
            transition: 'background 0.4s ease-out',
        },
    },
    statusHidden: {
        pointerEvents: 'none',
        opacity: 1,
    },
    statusPaper: {
        'position': 'absolute',
        'top': '50%',
        'left': '50%',
        'transform': 'translateX(-50%) translateY(-50%)',
        'background': theme.palette.primary.main,
        'opacity': 0.75,
        '& > div': {
            padding: `${theme.spacing(4)} ${theme.spacing(6)}`,
        },
    },
    statusError: {
        background: theme.palette.accent.main,
        fontSize: '16px',
        color: theme.palette.text.secondary,
        paddingBottom: theme.spacing(0.5),
    },
    statusErrorTitle: {
        'display': 'flex',
        'justifyContent': 'center',
        'fontSize': '24px',
        'fontWeight': 'bold',
        'marginBottom': theme.spacing(1.5),
        '& > div': {
            marginLeft: theme.spacing(1.5),
        },
    },
    statusErrorMessage: {
        textAlign: 'center',
        margin: '0px 5%',
        maxWidth: '550px',
        color: theme.palette.swatches.grey.grey100,
    },
}))

const OpenSeadragonViewer = ({ image, settings, features, onOpenFailed }) => {
    const [viewer, setViewer] = useState(null)
    const [openFailed, setOpenFailed] = useState(false)
    const [imageLoading, setImageLoading] = useState(true)
    const [svgOverlay, setSvgOverlay] = useState(null)

    const openHandlerRef = useRef(null)
    const openFailedHandlerRef = useRef(null)
    const restoreHandlerRef = useRef(null)

    const c = useStyles()

    settings = settings || {}

    const InitOpenSeadragon = () => {
        viewer && viewer.destroy()
        setViewer(
            OpenSeadragon({
                id: 'openSeadragon',
                zoomInButton: 'osd-zoomin',
                zoomOutButton: 'osd-zoomout',
                homeButton: 'osd-home',
                fullPageButton: 'osd-fullscreen',
                rotateLeftButton: 'osd-rotateleft',
                rotateRightButton: 'osd-rotateright',
                animationTime: 0.5,
                blendTime: 0.4,
                constrainDuringPan: true,
                // Pixel peeking goes well past 1:1, in gentler steps than the
                // default doubling.
                maxZoomPixelRatio: 40,
                minZoomLevel: 0.35,
                visibilityRatio: 0.95,
                zoomPerScroll: 1.6,
                zoomPerClick: 1.6,
                // Fill the viewer on load rather than letterboxing the image.
                homeFillsViewer: true,
                // Zoomed-in pixels stay square rather than being interpolated.
                imageSmoothingEnabled: false,
                showNavigator: true,
                showRotationControl: true,
                degrees: window.atlasGlobal.imageRotation || 0,
                navigatorPosition: 'BOTTOM_RIGHT',
                navigatorSizeRatio: 0.09,
                ...settings,
            })
        )
    }
    // Make viewer
    useEffect(() => {
        InitOpenSeadragon()
        return () => {
            viewer && viewer.destroy()
        }
    }, [])

    // Update image when changed
    useEffect(() => {
        if (image && image.src && viewer) {
            setOpenFailed(false)
            setImageLoading(true)
            if (openHandlerRef.current) {
                viewer.removeHandler('open', openHandlerRef.current)
            }
            if (openFailedHandlerRef.current) {
                viewer.removeHandler('open-failed', openFailedHandlerRef.current)
            }
            if (restoreHandlerRef.current) {
                viewer.removeHandler('open', restoreHandlerRef.current)
                restoreHandlerRef.current = null
            }
            const fullSrc = image.src
            // A smaller render opens first, then swaps once full-res downloads.
            const previewSrc =
                image.previewSrc && image.previewSrc !== fullSrc ? image.previewSrc : null
            let cancelled = false
            let showingPreview = false
            const openUrl = (url) =>
                viewer.open({
                    type: 'image',
                    url,
                    buildPyramid: false,
                })
            const onOpen = function (e) {
                setImageLoading(false)
                const so = viewer.svgOverlay()
                setSvgOverlay(so)
                drawFeatures(so, features)
            }
            const handleOpenFailed = function () {
                // A missing preview size falls straight through to full-res.
                if (showingPreview) {
                    showingPreview = false
                    openUrl(fullSrc)
                    return
                }
                setImageLoading(false)
                setOpenFailed(true)
                if (typeof onOpenFailed === 'function') onOpenFailed()
            }
            openHandlerRef.current = onOpen
            openFailedHandlerRef.current = handleOpenFailed
            viewer.addHandler('open', onOpen)
            viewer.addHandler('open-failed', handleOpenFailed)
            if (previewSrc) {
                showingPreview = true
                openUrl(previewSrc)
                const fullImg = new Image()
                fullImg.onload = () => {
                    if (cancelled || !showingPreview) return
                    showingPreview = false
                    // Keep the user's viewport across the preview → full swap.
                    const center = viewer.viewport ? viewer.viewport.getCenter() : null
                    const zoom = viewer.viewport ? viewer.viewport.getZoom() : null
                    const restore = () => {
                        viewer.removeHandler('open', restore)
                        if (restoreHandlerRef.current === restore)
                            restoreHandlerRef.current = null
                        if (center != null && zoom != null) {
                            viewer.viewport.zoomTo(zoom, null, true)
                            viewer.viewport.panTo(center, true)
                        }
                    }
                    restoreHandlerRef.current = restore
                    viewer.addHandler('open', restore)
                    openUrl(fullSrc)
                }
                fullImg.src = fullSrc
            } else openUrl(fullSrc)
            return () => {
                cancelled = true
                if (restoreHandlerRef.current) {
                    viewer.removeHandler('open', restoreHandlerRef.current)
                    restoreHandlerRef.current = null
                }
            }
        }
    }, [image.src, image.previewSrc, viewer])

    useEffect(() => {
        if (viewer && svgOverlay) {
            drawFeatures(viewer.svgOverlay(), features)
        }
    }, [features, viewer, svgOverlay])

    // Labels counter-scale, so they follow every viewport change.
    useEffect(() => {
        if (!viewer || !svgOverlay) return
        const onViewportChange = () => scaleFeatureLabels(svgOverlay)
        viewer.addHandler('animation', onViewportChange)
        viewer.addHandler('animation-finish', onViewportChange)
        viewer.addHandler('resize', onViewportChange)
        viewer.addHandler('rotate', onViewportChange)
        return () => {
            viewer.removeHandler('animation', onViewportChange)
            viewer.removeHandler('animation-finish', onViewportChange)
            viewer.removeHandler('resize', onViewportChange)
            viewer.removeHandler('rotate', onViewportChange)
        }
    }, [viewer, svgOverlay])

    useEffect(() => {
        // The drawer redraws on every pan/zoom, so smoothing is set on it rather
        // than on the canvases it owns.
        if (viewer && viewer.drawer) viewer.drawer.setImageSmoothingEnabled(false)
        // open-failed is handled in the image loading useEffect above
    }, [viewer])

    return (
        <div className={c.OpenSeadragonViewer}>
            <div id="openSeadragon" className={c.OpenSeadragonContainer}></div>
            <div className={c.uiOverlay}>
                <div className={c.topLeft}>
                    <IconButton
                        id="osd-home"
                        className={clsx(c.button, c.joiner)}
                        title="Home"
                        aria-label="image view home"
                        onClick={() => {
                            viewer.viewport.setRotation(0)
                        }}
                        size="large"
                    >
                        <HomeIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                        id="osd-fullscreen"
                        className={clsx(c.button, c.gap)}
                        title="Fullscreen"
                        aria-label="image view fullscreen"
                        size="large"
                    >
                        <FullscreenIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                        id="osd-rotateleft"
                        className={clsx(c.button, c.joiner)}
                        title="Rotate Counter-Clockwise"
                        aria-label="image view rotate counter clockwise"
                        size="large"
                    >
                        <RotateLeftIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                        id="osd-rotateright"
                        className={c.button}
                        title="Rotate Clockwise"
                        aria-label="image view rotate clockwise"
                        size="large"
                    >
                        <RotateRightIcon fontSize="inherit" />
                    </IconButton>
                </div>
                <div className={c.bottomRight}>
                    <IconButton
                        id="osd-zoomin"
                        className={clsx(c.button, c.joiner)}
                        title="Zoom In"
                        aria-label="image view zoom in"
                        size="large"
                    >
                        <AddIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                        id="osd-zoomout"
                        className={c.button}
                        title="Zoom Out"
                        aria-label="image view zoom out"
                        size="large"
                    >
                        <RemoveIcon fontSize="inherit" />
                    </IconButton>
                </div>
            </div>
            <ViewerLoading hidden={!imageLoading || openFailed} />
            <div className={clsx(c.openFailedWrapper, { [c.openFailedShown]: openFailed })}>
                <div className={clsx(c.status, { [c.statusHidden]: !openFailed })}>
                    <Paper className={c.statusPaper} elevation={2}>
                        <div className={c.statusError}>
                            <div className={c.statusErrorTitle}>
                                <Tooltip title={''} arrow placement="left-end">
                                    <ErrorOutlineOutlinedIcon fontSize="large" />
                                </Tooltip>
                                <div>This product doesn't have a browse image.</div>
                            </div>
                            <div className={c.statusErrorMessage}>
                                You can still view the label, download the source product and add it
                                to the cart.
                            </div>
                        </div>
                    </Paper>
                </div>
            </div>
        </div>
    )
}

const SVG_NS = 'http://www.w3.org/2000/svg'
const FEATURE_STROKE_WIDTH = 2
const FEATURE_LABEL_SIZE = 11
const LABEL_CLASS = 'osd-feature-label'
// Labels only earn their space once their box is big enough on screen.
const LABEL_MIN_BOX_PX = 44

/**
 * Draws GeoJSON features as vector outlines on the viewer's SVG overlay
 *
 * @param {Object} overlay - OpenSeadragon SVG overlay
 * @param {Array} features - GeoJSON features, optionally with _color and _label
 */
function drawFeatures(overlay, features) {
    if (!overlay) return

    const node = overlay.node()
    node.innerHTML = ''
    // No features means the overlay is cleared, e.g. leaving the ML tab.
    if (!features) return

    const imageSize = overlay._viewer.world._contentSize

    features.forEach((feature) => {
        const geom = feature.geometry
        if (!geom) return

        // Overlay coordinates are the image's width normalized to 1.
        const points =
            geom.type === 'Polygon'
                ? geom.coordinates[0].map((coord) => [
                      coord[0] / imageSize.x,
                      coord[1] / imageSize.x,
                  ])
                : [
                      [0, 0],
                      [1, 0],
                      [1, imageSize.y / imageSize.x],
                      [0, imageSize.y / imageSize.x],
                  ]

        const polygon = document.createElementNS(SVG_NS, 'polygon')
        polygon.setAttribute('points', points.map((p) => p.join(',')).join(' '))
        polygon.setAttribute('fill', 'transparent')
        polygon.setAttribute('stroke', feature._color)
        // Strokes stay the same thickness on screen at every zoom level.
        polygon.setAttribute('stroke-width', FEATURE_STROKE_WIDTH)
        polygon.setAttribute('vector-effect', 'non-scaling-stroke')
        node.appendChild(polygon)

        if (feature._label == null) return

        const anchorX = Math.min(...points.map((p) => p[0]))
        const anchorY = Math.min(...points.map((p) => p[1]))
        const label = document.createElementNS(SVG_NS, 'text')
        label.setAttribute('class', LABEL_CLASS)
        label.setAttribute('data-x', anchorX)
        label.setAttribute('data-y', anchorY)
        label.setAttribute('data-w', Math.max(...points.map((p) => p[0])) - anchorX)
        label.setAttribute('font-size', FEATURE_LABEL_SIZE)
        label.setAttribute('font-weight', 'bold')
        label.setAttribute('fill', feature._color)
        label.setAttribute('paint-order', 'stroke')
        label.setAttribute('stroke', 'rgba(0,0,0,0.65)')
        label.setAttribute('stroke-width', 3)
        label.setAttribute('vector-effect', 'non-scaling-stroke')
        label.textContent = feature._label
        node.appendChild(label)
    })

    scaleFeatureLabels(overlay)
}

/**
 * Keeps feature labels at a fixed screen size, since the overlay itself scales
 *
 * @param {Object} overlay - OpenSeadragon SVG overlay
 */
function scaleFeatureLabels(overlay) {
    if (!overlay) return
    const node = overlay.node()
    // The overlay's transform carries both zoom and the viewer's rotation.
    const consolidated = node.transform.baseVal.consolidate()
    const m = consolidated ? consolidated.matrix : null
    const scale = m ? Math.sqrt(m.a * m.a + m.b * m.b) : 1
    if (!scale) return

    node.querySelectorAll(`.${LABEL_CLASS}`).forEach((label) => {
        const x = Number(label.getAttribute('data-x'))
        const y = Number(label.getAttribute('data-y'))
        const boxPx = Number(label.getAttribute('data-w')) * scale
        label.setAttribute('display', boxPx < LABEL_MIN_BOX_PX ? 'none' : 'inline')
        label.setAttribute(
            'transform',
            `translate(${x} ${y}) scale(${1 / scale}) translate(0 -4)`
        )
    })
}

OpenSeadragonViewer.propTypes = {
    onOpenFailed: PropTypes.func,
    image: PropTypes.shape({
        src: PropTypes.string,
        previewSrc: PropTypes.string,
    }),
}

export default OpenSeadragonViewer
