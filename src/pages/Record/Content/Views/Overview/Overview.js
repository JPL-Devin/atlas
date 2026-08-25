import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Input from '@mui/material/Input'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Skeleton from '@mui/material/Skeleton'
import FormControl from '@mui/material/FormControl'
import Tooltip from '@mui/material/Tooltip'

import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import SearchIcon from '@mui/icons-material/Search'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import SubtitlesIcon from '@mui/icons-material/Subtitles'

import {
    copyToClipboard,
    getIn,
    getPDSUrl,
    getExtension,
    getFilename,
} from '../../../../../core/utils.js'
import { HASH_PATHS, ES_PATHS, IMAGE_EXTENSIONS } from '../../../../../core/constants.js'
import { getAppConfig, getAppInstanceKey } from '../../../../../core/appConfig.js'
import { parseRecordFilename, resolvePresentation } from '../../../../../core/recordPresentation'
import { emptyStates } from '../../../../../config/recordDetail'
import { addToCart, setSnackBarText } from '../../../../../core/redux/actions/actions.js'
import { getDownloadProducts } from '../../../../../core/recordDownloads.js'
import { streamDownloadFile } from '../../../../../core/downloaders/ZipStream.js'
import SplitButton from '../../../../../components/SplitButton/SplitButton'

import tileIcons from './tileIcons.js'
import FilenameLegend from './FilenameLegend'
import OpenSeadragonViewer from '../../../../../components/OpenSeadragonViewer/OpenSeadragonViewer'
import ThreeViewer from '../../../../../components/ThreeViewer/ThreeViewer'
import ViewerLoading from '../../../../../components/ViewerLoading/ViewerLoading'

const useStyles = makeStyles((theme) => ({
    Overview: {
        width: '100%',
        height: '100%',
        background: theme.palette.swatches.grey.grey800,
        color: theme.palette.swatches.grey.grey0,
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
            boxShadow: 'inset 0 8px 12px -8px rgba(0,0,0,0.85)',
        },
        [theme.breakpoints.down('md')]: {
            flex: 'unset',
            height: '55vh',
        },
    },
    captionCard: {
        position: 'absolute',
        left: '16px',
        right: '16px',
        bottom: '16px',
        boxSizing: 'border-box',
        padding: '10px 14px 12px 14px',
        borderRadius: '3px',
        border: `1px solid ${theme.palette.swatches.grey.grey700}`,
        background: 'rgba(16,16,19,0.62)',
        backdropFilter: 'blur(8px) saturate(140%)',
        [theme.breakpoints.down('md')]: {
            left: '8px',
            right: '8px',
            bottom: '8px',
            padding: '8px 10px',
        },
    },
    captionChips: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '6px',
    },
    chip: {
        fontSize: '11px',
        lineHeight: '18px',
        padding: '0 8px',
        borderRadius: '9px',
        background: theme.palette.swatches.grey.grey700,
        color: theme.palette.swatches.grey.grey100,
        whiteSpace: 'nowrap',
    },
    // blue800 rather than blue700: white on blue700 is only 4.2:1.
    chipLead: {
        background: theme.palette.swatches.blue.blue800,
        color: theme.palette.swatches.grey.grey0,
    },
    captionTitle: {
        fontSize: '14px',
        fontWeight: 'bold',
        lineHeight: '20px',
        color: theme.palette.swatches.grey.grey0,
    },
    captionText: {
        fontSize: '13px',
        lineHeight: '19px',
        color: theme.palette.swatches.grey.grey150,
        marginTop: '2px',
    },
    captionFoot: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '8px',
        marginTop: '6px',
    },
    captionAuthor: {
        fontSize: '11px',
        color: theme.palette.swatches.grey.grey300,
        whiteSpace: 'nowrap',
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
    // The viewers paint their own surface, so match it while they're absent.
    loadingBody: {
        background: theme.palette.swatches.grey.grey850,
    },
    skeleton: {
        backgroundColor: theme.palette.swatches.grey.grey700,
    },
    metadata: {
        width: '520px',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexFlow: 'column',
        background: theme.palette.swatches.grey.grey800,
        borderLeft: `1px solid ${theme.palette.swatches.grey.grey700}`,
        [theme.breakpoints.down('md')]: {
            width: '100%',
            height: 'unset',
            borderLeft: 'none',
            borderTop: `1px solid ${theme.palette.swatches.grey.grey700}`,
        },
    },
    // The record's actions, pinned above the scrolling metadata.
    panelActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        flexShrink: 0,
        padding: '6px 12px',
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey700}`,
    },
    // Download anchors the right end; the copy/cart icons stay left.
    panelDownload: {
        marginLeft: 'auto',
    },
    // A slim scrollbar keeps the gutter from cutting into the heading rules.
    metadataScroll: {
        'flex': 1,
        'minHeight': 0,
        'overflowY': 'auto',
        'padding': '16px 20px 20px 20px',
        'scrollbarWidth': 'thin',
        'scrollbarColor': `${theme.palette.swatches.grey.grey600} transparent`,
        '&::-webkit-scrollbar': {
            width: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
            background: theme.palette.swatches.grey.grey600,
            borderRadius: '4px',
        },
        [theme.breakpoints.down('md')]: {
            flex: 'unset',
            overflowY: 'unset',
        },
    },
    heading: {
        fontSize: '12px',
        fontWeight: 'bold',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        // yellow700 is the site titlebar's goldenrod, lightened for the dark panel.
        color: theme.palette.swatches.yellow.yellow700,
        borderTop: `1px solid ${theme.palette.swatches.grey.grey700}`,
        // Negative margins pull the rule out to the panel edges.
        margin: '0 -20px 10px -20px',
        padding: '12px 20px 0 20px',
    },
    description: {
        fontSize: '13px',
        lineHeight: '20px',
        color: theme.palette.swatches.grey.grey150,
        marginBottom: '20px',
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
        background: theme.palette.swatches.grey.grey850,
        border: `1px solid ${theme.palette.swatches.grey.grey700}`,
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
        'color': theme.palette.swatches.grey.grey300,
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
    // Values never wrap, so a card is always exactly two lines; the full text
    // stays available as a tooltip and in the sections below.
    tileValue: {
        fontSize: '14px',
        lineHeight: '20px',
        minWidth: 0,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    tileSub: {
        fontSize: '11px',
        lineHeight: '16px',
        color: theme.palette.swatches.grey.grey300,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    // An inline sub sits beside the value, keeping paired fields (azimuth and
    // elevation) two lines high instead of three.
    tileValueRow: {
        display: 'flex',
        alignItems: 'baseline',
        columnGap: '6px',
        minWidth: 0,
    },
    fieldsHeading: {
        marginTop: '20px',
        marginBottom: 0,
    },
    filter: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: '4px 0 8px 0',
    },
    filterInput: {
        'flex': 1,
        'fontSize': '13px',
        'color': theme.palette.swatches.grey.grey0,
        '&:before': {
            borderBottom: `1px solid ${theme.palette.swatches.grey.grey600}`,
        },
        '& .MuiSvgIcon-root': {
            fontSize: '18px',
            color: theme.palette.swatches.grey.grey300,
        },
        '& input::placeholder': {
            color: theme.palette.swatches.grey.grey300,
            opacity: 1,
        },
    },
    clearFilter: {
        color: theme.palette.swatches.grey.grey300,
        transition: 'opacity 0.2s ease-out',
    },
    section: {
        borderTop: `1px solid ${theme.palette.swatches.grey.grey700}`,
    },
    sectionHead: {
        'display': 'flex',
        'alignItems': 'center',
        'justifyContent': 'space-between',
        'width': '100%',
        'padding': '8px 0',
        'background': 'none',
        'border': 'none',
        'cursor': 'pointer',
        'color': theme.palette.swatches.yellow.yellow700,
        'fontSize': '13px',
        'fontWeight': 'bold',
        'textAlign': 'left',
        '& > span': {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
        },
        '& .MuiSvgIcon-root': {
            fontSize: '18px',
            color: theme.palette.swatches.grey.grey300,
        },
    },
    sectionCount: {
        fontSize: '11px',
        fontWeight: 'normal',
        color: theme.palette.swatches.grey.grey300,
    },
    row: {
        'display': 'flex',
        'justifyContent': 'space-between',
        'gap': '16px',
        'padding': '4px 0',
        'fontSize': '13px',
        'lineHeight': '19px',
        '&:hover $rowCopy': {
            opacity: 1,
        },
    },
    rowLabel: {
        color: theme.palette.swatches.grey.grey300,
        whiteSpace: 'nowrap',
        flexShrink: 0,
    },
    rowValue: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '4px',
        minWidth: 0,
        color: theme.palette.swatches.grey.grey0,
        textAlign: 'right',
        overflowWrap: 'anywhere',
    },
    rowCopy: {
        'opacity': 0,
        'padding': '1px',
        'color': theme.palette.swatches.grey.grey300,
        'transition': 'opacity 0.15s ease-out',
        '& .MuiSvgIcon-root': {
            fontSize: '13px',
        },
    },
    noMatches: {
        fontSize: '12px',
        color: theme.palette.swatches.grey.grey300,
        padding: '8px 0',
    },
    citationHeading: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        fontSize: '12px',
        fontWeight: 'bold',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: theme.palette.swatches.yellow.yellow700,
        borderTop: `1px solid ${theme.palette.swatches.grey.grey700}`,
        margin: '0 -20px 0 -20px',
        padding: '12px 20px 6px 20px',
    },
    citation: {
        fontSize: '13px',
        lineHeight: '19px',
        color: theme.palette.swatches.grey.grey300,
        overflowWrap: 'anywhere',
    },
    actionIcon: {
        'flexShrink': 0,
        'color': theme.palette.swatches.grey.grey200,
        '&:hover': {
            color: theme.palette.swatches.grey.grey0,
            background: theme.palette.swatches.grey.grey700,
        },
    },
    select: {
        'fontSize': '12px',
        'marginLeft': '4px',
        'color': theme.palette.swatches.grey.grey0,
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.swatches.grey.grey500,
        },
        '& .MuiSvgIcon-root': {
            color: theme.palette.swatches.grey.grey300,
        },
    },
    selectMenu: {
        '& .MuiPaper-root': {
            background: theme.palette.swatches.grey.grey850,
            color: theme.palette.swatches.grey.grey0,
        },
        '& .MuiMenuItem-root.Mui-selected, & .MuiMenuItem-root:hover': {
            background: theme.palette.swatches.grey.grey700,
        },
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

// Sections open on load; the rest start collapsed, as in the mockup.
const OPEN_SECTIONS = ['identification', 'observation']

const matches = (row, filter) =>
    filter === '' ||
    String(row.label).toLowerCase().includes(filter) ||
    String(row.value).toLowerCase().includes(filter)

const Overview = (props) => {
    const { recordData, versions, activeVersion, loading } = props
    const c = useStyles()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const theme = useTheme()
    const isNarrow = useMediaQuery(theme.breakpoints.down('md'))
    const isPhone = useMediaQuery(theme.breakpoints.down('sm'))
    const isTwoUp = useMediaQuery(theme.breakpoints.down('lg'))
    // Mirrors the tile grid's own breakpoints.
    const tileColumns = isPhone ? 1 : isTwoUp ? 2 : 3
    const [viewerFailed, setViewerFailed] = useState(false)
    const [filterString, setFilterString] = useState('')
    const [collapsed, setCollapsed] = useState({})

    const release_id = getIn(recordData, ES_PATHS.release_id)
    const downloadProducts = getDownloadProducts(recordData)
    const browse_uri = getIn(recordData, ES_PATHS.browse)
    const uri = getIn(recordData, ES_PATHS.source)
    const supplemental = getIn(recordData, ES_PATHS.supplemental)
    const pds_standard = getIn(recordData, ES_PATHS.pds_standard)

    // A pending record isn't a product without a browse image, so it shows the
    // loading state rather than the empty state.
    const isLoading = loading === true && Object.keys(recordData || {}).length === 0

    const presentation = resolvePresentation(recordData, { instance: getAppInstanceKey() })
    const emptyState = emptyStates[presentation.emptyState] || emptyStates.no_browse_generic

    let imgURL = getPDSUrl(browse_uri, release_id)
    let type = getExtension(imgURL, true)
    if (!IMAGE_EXTENSIONS.includes(type)) {
        imgURL = getPDSUrl(uri, release_id)
        type = getExtension(imgURL, true)
    }
    // A product whose only asset is a source image the archive can't render
    // falls back to the configured empty state once the viewer reports failure.
    const hasViewable =
        imgURL != null && (type === 'obj' || IMAGE_EXTENSIONS.includes(type)) && !viewerFailed

    useEffect(() => {
        setViewerFailed(false)
    }, [imgURL])

    let Viewer = null
    if (hasViewable)
        Viewer =
            type === 'obj' ? (
                <ThreeViewer url={imgURL} release_id={release_id} supplemental={supplemental} />
            ) : (
                <OpenSeadragonViewer
                    image={{ src: imgURL }}
                    // 0 opens at the home zoom, so the image fills the viewer's
                    // constraining dimension.
                    settings={{ defaultZoomLevel: 0 }}
                    onOpenFailed={() => setViewerFailed(true)}
                />
            )

    // Phones show only the priority tiles; wider viewports show the configured
    // maximum in the same configured order. Either way the grid keeps whole
    // rows, so no row is left partly filled.
    const available = isNarrow
        ? presentation.tiles.slice(0, presentation.priorityTiles)
        : presentation.tiles
    const tiles = available.slice(0, Math.floor(available.length / tileColumns) * tileColumns)
    const caption = isNarrow ? presentation.shortCaption : presentation.caption

    // The version selector reads as an Identification field, as in the mockup.
    const showVersions = pds_standard === 'pds4' && versions.length > 0
    const versionRow = showVersions
        ? {
              label: 'Version',
              value:
                  activeVersion != null && versions[activeVersion] != null
                      ? String(versions[activeVersion].versionRaw)
                      : '',
              node: (
                  <>
                      {versions.length > 1 && (
                          <FormControl size="small" variant="standard">
                              <Select
                                  className={c.select}
                                  MenuProps={{ className: c.selectMenu }}
                                  aria-label="record version"
                                  renderValue={() =>
                                      `${versions.length} version${
                                          versions.length === 1 ? '' : 's'
                                      }`
                                  }
                                  displayEmpty
                                  onChange={(e) => {
                                      navigate(
                                          `${HASH_PATHS.record}?uri=${versions[e.target.value].uri}`
                                      )
                                  }}
                                  value={activeVersion == null ? '' : activeVersion}
                              >
                                  {versions.map((v, idx) => (
                                      <MenuItem key={idx} value={idx}>
                                          {v.versionRaw}
                                      </MenuItem>
                                  ))}
                              </Select>
                          </FormControl>
                      )}
                  </>
              ),
          }
        : null

    const filter = filterString.trim().toLowerCase()
    const sections = presentation.sections
        .map((section) =>
            section.id === 'identification' && versionRow != null
                ? { ...section, rows: [...section.rows, versionRow] }
                : section
        )
        .map((section) => ({
            ...section,
            rows: section.rows.filter((row) => matches(row, filter)),
        }))
        .filter((section) => section.rows.length > 0)

    const fieldCount = sections.reduce((total, section) => total + section.rows.length, 0)
    // Missions with no filename spec have nothing to explain.
    const parsedFilename = parseRecordFilename(getIn(recordData, ES_PATHS.file_name), recordData)

    const copy = (text, message) => {
        copyToClipboard(text)
        dispatch(setSnackBarText(message, 'success'))
    }

    const renderPanelActions = () => (
        <div className={c.panelActions} aria-label="record actions">
            {getAppConfig().enableCart && (
                <Tooltip title="Add to cart" arrow>
                    <IconButton
                        className={c.actionIcon}
                        aria-label="add record to cart"
                        size="small"
                        onClick={() => {
                            dispatch(
                                addToCart('image', {
                                    uri,
                                    related: getIn(recordData, ES_PATHS.related),
                                    release_id,
                                })
                            )
                            dispatch(setSnackBarText('Added to Cart!', 'success'))
                        }}
                    >
                        <AddShoppingCartIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
            {caption != null && (
                <Tooltip title="Copy caption" arrow>
                    <IconButton
                        className={c.actionIcon}
                        aria-label="copy record caption"
                        size="small"
                        onClick={() => copy(caption, 'Copied caption to clipboard!')}
                    >
                        <SubtitlesIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
            {presentation.citation != null && getAppConfig().enableRecordCitation && (
                <Tooltip title="Copy citation" arrow>
                    <IconButton
                        className={c.actionIcon}
                        aria-label="copy record citation"
                        size="small"
                        onClick={() => copy(presentation.citation, 'Copied citation to clipboard!')}
                    >
                        <FormatQuoteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
            <SplitButton
                className={c.panelDownload}
                forceName="Download"
                ariaLabel="download record products"
                type="checklist"
                items={downloadProducts}
                onClick={(checked) => {
                    checked.forEach((item) => {
                        if (item.uri)
                            streamDownloadFile(
                                getPDSUrl(item.uri, item.release_id),
                                getFilename(item.uri)
                            )
                    })
                }}
            />
        </div>
    )

    const renderCaptionCard = () => {
        if (presentation.captionTitle == null && caption == null) return null
        return (
            <div className={c.captionCard} aria-label="record caption">
                {!isNarrow && presentation.captionChips.length > 0 && (
                    <div className={c.captionChips}>
                        {presentation.captionChips.map((chip, idx) => (
                            <span className={`${c.chip} ${idx === 0 ? c.chipLead : ''}`} key={idx}>
                                {chip}
                            </span>
                        ))}
                    </div>
                )}
                {presentation.captionTitle != null && (
                    <div className={c.captionTitle}>{presentation.captionTitle}</div>
                )}
                {caption != null && <div className={c.captionText}>{caption}</div>}
                {!isNarrow && presentation.citationAuthor != null && (
                    <div className={c.captionFoot}>
                        <div className={c.captionAuthor}>{presentation.citationAuthor}</div>
                    </div>
                )}
            </div>
        )
    }

    // The panel keeps its shape while the record resolves, so nothing shifts
    // once the real values arrive.
    const renderSkeleton = () => (
        <>
            <div className={c.panelActions} aria-hidden="true">
                <Skeleton
                    className={`${c.skeleton} ${c.panelDownload}`}
                    variant="rectangular"
                    width={124}
                    height={30}
                />
            </div>
            <div className={c.metadataScroll} aria-hidden="true">
                <Skeleton className={c.skeleton} variant="text" width="90%" />
                <div className={c.heading}>At a glance</div>
                <div className={c.tiles}>
                    {Array.from({ length: 9 }).map((_, idx) => (
                        <div className={c.tile} key={idx}>
                            <Skeleton className={c.skeleton} variant="text" width="60%" />
                            <Skeleton
                                className={c.skeleton}
                                variant="text"
                                width="85%"
                                height={20}
                            />
                        </div>
                    ))}
                </div>
                <div className={`${c.heading} ${c.fieldsHeading}`}>Fields</div>
                <div className={c.filter}>
                    <Skeleton className={c.skeleton} variant="text" width="100%" height={32} />
                </div>
                {Array.from({ length: 8 }).map((_, idx) => (
                    <div className={c.row} key={idx}>
                        <Skeleton className={c.skeleton} variant="text" width="30%" />
                        <Skeleton className={c.skeleton} variant="text" width="45%" />
                    </div>
                ))}
            </div>
        </>
    )

    return (
        <div className={c.Overview}>
            {(hasViewable || isLoading || !isNarrow) && (
                <div className={c.viewerColumn}>
                    {isLoading ? (
                        <div className={`${c.viewerBody} ${c.loadingBody}`}>
                            <ViewerLoading label="record loading" />
                            <div className={c.captionCard} aria-hidden="true">
                                <div className={c.captionChips}>
                                    {['64px', '52px', '78px'].map((width) => (
                                        <Skeleton
                                            className={c.skeleton}
                                            variant="rounded"
                                            width={width}
                                            height={18}
                                            key={width}
                                        />
                                    ))}
                                </div>
                                <Skeleton
                                    className={c.skeleton}
                                    variant="text"
                                    width="45%"
                                    height={20}
                                />
                                <Skeleton className={c.skeleton} variant="text" width="80%" />
                            </div>
                        </div>
                    ) : hasViewable ? (
                        <>
                            {presentation.altText != null && (
                                <span className={c.srOnly}>{presentation.altText}</span>
                            )}
                            <div className={c.viewerBody}>
                                {Viewer}
                                {renderCaptionCard()}
                            </div>
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
                {isLoading ? (
                    renderSkeleton()
                ) : (
                    <>
                        {renderPanelActions()}
                        <div className={c.metadataScroll}>
                            {parsedFilename != null && <FilenameLegend parsed={parsedFilename} />}
                            {!isNarrow && presentation.description != null && (
                                <>
                                    <div className={c.heading}>About this product</div>
                                    <div className={c.description} aria-label="record description">
                                        {presentation.description}
                                    </div>
                                </>
                            )}
                            <div className={c.heading}>At a glance</div>
                            <div className={c.tiles}>
                                {tiles.map((tile, idx) => {
                                    const Icon = tileIcons[tile.icon]
                                    return (
                                        <div className={c.tile} key={idx}>
                                            <div className={c.tileLabel}>
                                                {Icon && <Icon />}
                                                <span
                                                    className={c.tileLabelText}
                                                    title={tile.label}
                                                >
                                                    {tile.shortLabel}
                                                </span>
                                            </div>
                                            <div
                                                className={tile.inline ? c.tileValueRow : undefined}
                                            >
                                                <div className={c.tileValue} title={tile.value}>
                                                    {tile.value}
                                                </div>
                                                {tile.sub != null && (
                                                    <div className={c.tileSub} title={tile.sub}>
                                                        {tile.sub}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className={`${c.heading} ${c.fieldsHeading}`}>Fields</div>
                            <div className={c.filter}>
                                <Input
                                    className={c.filterInput}
                                    value={filterString}
                                    placeholder={`Filter ${fieldCount} field${
                                        fieldCount === 1 ? '' : 's'
                                    }…`}
                                    inputProps={{ 'aria-label': 'filter record fields' }}
                                    startAdornment={
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    }
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <IconButton
                                                className={c.clearFilter}
                                                aria-label="clear field filter"
                                                size="small"
                                                style={{ opacity: filterString.length > 0 ? 1 : 0 }}
                                                onClick={() => setFilterString('')}
                                            >
                                                <CloseIcon fontSize="inherit" />
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                    onChange={(e) => setFilterString(e.target.value)}
                                />
                            </div>
                            {sections.length === 0 && (
                                <div className={c.noMatches}>No fields match “{filterString}”</div>
                            )}
                            {sections.map((section) => {
                                // Filtering expands everything so matches are never hidden.
                                const open =
                                    filter !== '' ||
                                    (collapsed[section.id] == null
                                        ? OPEN_SECTIONS.includes(section.id)
                                        : !collapsed[section.id])
                                return (
                                    <div className={c.section} key={section.id}>
                                        <button
                                            className={c.sectionHead}
                                            aria-expanded={open}
                                            onClick={() =>
                                                setCollapsed({ ...collapsed, [section.id]: open })
                                            }
                                        >
                                            <span>
                                                {open ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                                                {section.title}
                                            </span>
                                            <span className={c.sectionCount}>
                                                {section.rows.length}
                                            </span>
                                        </button>
                                        <Collapse in={open} unmountOnExit>
                                            {section.rows.map((row, idx) => (
                                                <div className={c.row} key={idx}>
                                                    <div className={c.rowLabel}>{row.label}</div>
                                                    <div className={c.rowValue}>
                                                        {row.value}
                                                        {row.node}
                                                        <Tooltip title="Copy value" arrow>
                                                            <IconButton
                                                                className={c.rowCopy}
                                                                aria-label={`copy ${row.label}`}
                                                                size="small"
                                                                onClick={() =>
                                                                    copy(
                                                                        row.value,
                                                                        'Copied value to clipboard!'
                                                                    )
                                                                }
                                                            >
                                                                <ContentCopyIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                            ))}
                                        </Collapse>
                                    </div>
                                )
                            })}
                            {presentation.citation != null &&
                                getAppConfig().enableRecordCitation && (
                                    <>
                                        <div className={c.citationHeading}>
                                            <span>Citation</span>
                                        </div>
                                        <div className={c.citation}>{presentation.citation}</div>
                                    </>
                                )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

Overview.propTypes = {
    recordData: PropTypes.object,
    versions: PropTypes.array,
    activeVersion: PropTypes.number,
    loading: PropTypes.bool,
}

export default Overview
