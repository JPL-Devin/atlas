import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'

import { getIn, getPDSUrl, getExtension } from '../../../../../core/utils.js'
import { HASH_PATHS, ES_PATHS, IMAGE_EXTENSIONS } from '../../../../../core/constants.js'
import { getAppConfig, getAppInstanceKey } from '../../../../../core/appConfig.js'
import { resolvePresentation } from '../../../../../core/recordPresentation'
import { emptyStates } from '../../../../../config/recordDetail'
import { setRecordViewTab } from '../../../../../core/redux/actions/actions.js'

import tileIcons from './tileIcons.js'
import OpenSeadragonViewer from '../../../../../components/OpenSeadragonViewer/OpenSeadragonViewer'
import ThreeViewer from '../../../../../components/ThreeViewer/ThreeViewer'

const useStyles = makeStyles((theme) => ({
    Overview: {
        width: '100%',
        height: '100%',
        background: theme.palette.swatches.grey.grey100,
        color: theme.palette.text.primary,
        display: 'flex',
        [theme.breakpoints.down('md')]: {
            flexFlow: 'column',
            overflowY: 'auto',
        },
    },
    viewerColumn: {
        flex: 1,
        height: '100%',
        display: 'flex',
        flexFlow: 'column',
        background: theme.palette.swatches.grey.grey900,
        minWidth: 0,
        [theme.breakpoints.down('md')]: {
            height: 'unset',
            flex: 'unset',
        },
    },
    viewer: {
        flex: 1,
        minHeight: 0,
        [theme.breakpoints.down('md')]: {
            flex: 'unset',
            height: '55vh',
        },
    },
    caption: {
        color: theme.palette.swatches.grey.grey150,
        borderTop: `1px solid ${theme.palette.swatches.grey.grey700}`,
        fontSize: '13px',
        lineHeight: '20px',
        padding: '10px 16px',
    },
    emptyState: {
        flex: 1,
        display: 'flex',
        flexFlow: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: theme.palette.swatches.grey.grey200,
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
    metadata: {
        width: '480px',
        height: '100%',
        boxSizing: 'border-box',
        overflowY: 'auto',
        padding: '16px 20px 32px 20px',
        borderLeft: `1px solid ${theme.palette.swatches.grey.grey300}`,
        [theme.breakpoints.down('md')]: {
            width: '100%',
            height: 'unset',
            borderLeft: 'none',
            borderTop: `1px solid ${theme.palette.swatches.grey.grey300}`,
        },
    },
    heading: {
        fontSize: '12px',
        fontWeight: 'bold',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: theme.palette.swatches.grey.grey500,
        marginBottom: '10px',
    },
    tiles: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '8px',
        [theme.breakpoints.down('lg')]: {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        },
        [theme.breakpoints.down('sm')]: {
            gridTemplateColumns: 'minmax(0, 1fr)',
        },
    },
    tile: {
        background: theme.palette.swatches.grey.grey150,
        border: `1px solid ${theme.palette.swatches.grey.grey300}`,
        borderRadius: '2px',
        padding: '8px 10px',
        minWidth: 0,
    },
    tileLabel: {
        'display': 'flex',
        'alignItems': 'center',
        'gap': '4px',
        'fontSize': '11px',
        'textTransform': 'uppercase',
        'letterSpacing': '0.04em',
        'color': theme.palette.swatches.grey.grey600,
        'whiteSpace': 'nowrap',
        'overflow': 'hidden',
        '& > svg': {
            fontSize: '12px',
            flexShrink: 0,
        },
    },
    tileLabelText: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    tileValue: {
        fontSize: '14px',
        lineHeight: '20px',
        wordBreak: 'break-word',
    },
    tileSub: {
        fontSize: '11px',
        lineHeight: '16px',
        color: theme.palette.swatches.grey.grey600,
        wordBreak: 'break-word',
    },
    secondary: {
        marginTop: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
    },
    citation: {
        marginTop: '16px',
        fontSize: '12px',
        lineHeight: '18px',
        color: theme.palette.swatches.grey.grey600,
    },
    versionRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
    },
    versionLabel: {
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: theme.palette.swatches.grey.grey600,
    },
    select: {
        fontSize: '14px',
    },
    // Describes the image for screen readers; the viewer itself is a canvas.
    srOnly: {
        position: 'absolute',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
    },
}))

const Overview = (props) => {
    const { recordData, versions, activeVersion } = props
    const c = useStyles()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const theme = useTheme()
    const isNarrow = useMediaQuery(theme.breakpoints.down('md'))

    const release_id = getIn(recordData, ES_PATHS.release_id)
    const browse_uri = getIn(recordData, ES_PATHS.browse)
    const uri = getIn(recordData, ES_PATHS.source)
    const supplemental = getIn(recordData, ES_PATHS.supplemental)
    const pds_standard = getIn(recordData, ES_PATHS.pds_standard)

    const presentation = resolvePresentation(recordData, { instance: getAppInstanceKey() })
    const emptyState = emptyStates[presentation.emptyState] || emptyStates.no_browse_generic

    let imgURL = getPDSUrl(browse_uri, release_id)
    let type = getExtension(imgURL, true)
    if (!IMAGE_EXTENSIONS.includes(type)) {
        imgURL = getPDSUrl(uri, release_id)
        type = getExtension(imgURL, true)
    }
    const hasViewable = imgURL != null && (type === 'obj' || IMAGE_EXTENSIONS.includes(type))

    let Viewer = null
    if (hasViewable)
        Viewer =
            type === 'obj' ? (
                <ThreeViewer url={imgURL} release_id={release_id} supplemental={supplemental} />
            ) : (
                <OpenSeadragonViewer image={{ src: imgURL }} settings={{ defaultZoomLevel: 0.5 }} />
            )

    // Phones show only the priority tiles; wider viewports show the configured
    // maximum in the same configured order.
    const tiles = isNarrow
        ? presentation.tiles.slice(0, presentation.priorityTiles)
        : presentation.tiles
    const caption = isNarrow ? presentation.shortCaption : presentation.caption

    const showVersions = pds_standard === 'pds4' && versions.length > 0

    return (
        <div className={c.Overview}>
            {(hasViewable || !isNarrow) && (
                <div className={c.viewerColumn}>
                    {hasViewable ? (
                        <>
                            {presentation.altText != null && (
                                <span className={c.srOnly}>{presentation.altText}</span>
                            )}
                            <div className={c.viewer}>{Viewer}</div>
                            {caption != null && (
                                <div className={c.caption} aria-label="record caption">
                                    {caption}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={c.emptyState}>
                            <div className={c.emptyStateTitle}>{emptyState.title}</div>
                            <div className={c.emptyStateBody}>{emptyState.body}</div>
                        </div>
                    )}
                </div>
            )}
            <div className={c.metadata}>
                {showVersions && (
                    <div className={c.versionRow}>
                        <div className={c.versionLabel}>Version</div>
                        <FormControl size="small">
                            <Select
                                className={c.select}
                                aria-label="record version"
                                onChange={(e) => {
                                    navigate(
                                        `${HASH_PATHS.record}?uri=${versions[e.target.value].uri}`
                                    )
                                }}
                                value={activeVersion == null ? '' : activeVersion}
                            >
                                {versions.map((v, idx) => (
                                    <MenuItem key={idx} value={idx}>
                                        {v.version}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                )}
                <div className={c.heading}>At a glance</div>
                <div className={c.tiles}>
                    {tiles.map((tile, idx) => {
                        const Icon = tileIcons[tile.icon]
                        return (
                            <div className={c.tile} key={idx}>
                                <div className={c.tileLabel}>
                                    {Icon && <Icon />}
                                    <span className={c.tileLabelText}>
                                        {isNarrow ? tile.shortLabel : tile.label}
                                    </span>
                                </div>
                                <div className={c.tileValue}>{tile.value}</div>
                                {tile.sub != null && <div className={c.tileSub}>{tile.sub}</div>}
                            </div>
                        )
                    })}
                </div>
                <div className={c.secondary}>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => dispatch(setRecordViewTab('product label'))}
                    >
                        View full label
                    </Button>
                </div>
                {presentation.citation != null && getAppConfig().enableRecordCitation && (
                    <div className={c.citation}>{presentation.citation}</div>
                )}
            </div>
        </div>
    )
}

Overview.propTypes = {
    recordData: PropTypes.object,
    versions: PropTypes.array,
    activeVersion: PropTypes.number,
}

export default Overview
