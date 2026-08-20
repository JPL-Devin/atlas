import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import flat from 'flat'

import { makeStyles } from '@mui/styles'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Input from '@mui/material/Input'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import Tooltip from '@mui/material/Tooltip'

import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LinkIcon from '@mui/icons-material/Link'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import SearchIcon from '@mui/icons-material/Search'

import {
    copyToClipboard,
    getIn,
    getPDSUrl,
    getExtension,
    getFilename,
} from '../../../../../core/utils.js'
import { HASH_PATHS, ES_PATHS, IMAGE_EXTENSIONS } from '../../../../../core/constants.js'
import { getAppConfig, getAppInstanceKey } from '../../../../../core/appConfig.js'
import { getDownloadProducts } from '../../../../../core/recordDownloads.js'
import { resolvePresentation } from '../../../../../core/recordPresentation'
import { emptyStates } from '../../../../../config/recordDetail'
import { streamDownloadFile } from '../../../../../core/downloaders/ZipStream.js'
import {
    addToCart,
    setRecordViewTab,
    setSnackBarText,
} from '../../../../../core/redux/actions/actions.js'

import tileIcons from './tileIcons.js'
import SplitButton from '../../../../../components/SplitButton/SplitButton'
import OpenSeadragonViewer from '../../../../../components/OpenSeadragonViewer/OpenSeadragonViewer'
import ThreeViewer from '../../../../../components/ThreeViewer/ThreeViewer'

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
    viewerBody: {
        position: 'relative',
        flex: 1,
        minHeight: 0,
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
        background: 'rgba(16,16,19,0.88)',
        backdropFilter: 'blur(2px)',
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
    chipLead: {
        background: theme.palette.swatches.blue.blue700,
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
        marginTop: '6px',
    },
    smallAction: {
        'fontSize': '11px',
        'minWidth': 0,
        'padding': '0 4px',
        'color': theme.palette.swatches.grey.grey300,
        '&:hover': {
            color: theme.palette.swatches.grey.grey0,
            background: 'transparent',
        },
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
    metadataScroll: {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '16px 20px 20px 20px',
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
        color: theme.palette.swatches.grey.grey400,
        marginBottom: '10px',
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
        'color': theme.palette.swatches.grey.grey400,
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
        color: theme.palette.swatches.grey.grey300,
        wordBreak: 'break-word',
    },
    filter: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: '20px 0 8px 0',
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
            color: theme.palette.swatches.grey.grey400,
        },
        '& input::placeholder': {
            color: theme.palette.swatches.grey.grey400,
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
        'color': theme.palette.swatches.grey.grey0,
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
        color: theme.palette.swatches.grey.grey400,
    },
    row: {
        'display': 'flex',
        'justifyContent': 'space-between',
        'gap': '16px',
        'padding': '4px 0',
        'fontSize': '12px',
        'lineHeight': '18px',
        '&:hover $rowCopy': {
            opacity: 1,
        },
    },
    rowLabel: {
        color: theme.palette.swatches.grey.grey400,
        overflowWrap: 'anywhere',
    },
    rowValue: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '4px',
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
        color: theme.palette.swatches.grey.grey400,
        padding: '8px 0',
    },
    citation: {
        marginTop: '16px',
        fontSize: '12px',
        lineHeight: '18px',
        color: theme.palette.swatches.grey.grey400,
        overflowWrap: 'anywhere',
    },
    labelButton: {
        'color': theme.palette.swatches.grey.grey0,
        'borderColor': theme.palette.swatches.grey.grey500,
        '&:hover': {
            borderColor: theme.palette.swatches.grey.grey300,
            background: theme.palette.swatches.grey.grey700,
        },
    },
    actions: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        padding: '10px 20px',
        borderTop: `1px solid ${theme.palette.swatches.grey.grey700}`,
        background: theme.palette.swatches.grey.grey850,
    },
    actionButton: {
        'flexShrink': 0,
        'color': theme.palette.swatches.grey.grey0,
        'borderColor': theme.palette.swatches.grey.grey500,
        '&:hover': {
            borderColor: theme.palette.swatches.grey.grey300,
            background: theme.palette.swatches.grey.grey700,
        },
    },
    actionIcon: {
        color: theme.palette.swatches.grey.grey200,
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
        color: theme.palette.swatches.grey.grey400,
    },
    select: {
        'fontSize': '14px',
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

const RAW_SECTION_ID = 'raw'

const matches = (row, filter) =>
    filter === '' ||
    String(row.label).toLowerCase().includes(filter) ||
    String(row.value).toLowerCase().includes(filter)

const Overview = (props) => {
    const { recordData, versions, activeVersion } = props
    const c = useStyles()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const theme = useTheme()
    const isNarrow = useMediaQuery(theme.breakpoints.down('md'))
    const [viewerFailed, setViewerFailed] = useState(false)
    const [filterString, setFilterString] = useState('')
    const [collapsed, setCollapsed] = useState({})

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
                    settings={{ defaultZoomLevel: 0.5 }}
                    onOpenFailed={() => setViewerFailed(true)}
                />
            )

    // Phones show only the priority tiles; wider viewports show the configured
    // maximum in the same configured order.
    const tiles = isNarrow
        ? presentation.tiles.slice(0, presentation.priorityTiles)
        : presentation.tiles
    const caption = isNarrow ? presentation.shortCaption : presentation.caption

    // The raw label, flattened, is the last section: the only place field names
    // appear as the archive spells them.
    const rawRows = useMemo(() => {
        const labelData = getIn(
            recordData,
            pds_standard === 'pds4' ? ES_PATHS.pds4_label : ES_PATHS.pds3_label,
            {}
        )
        const flattened = flat.flatten(labelData, { delimiter: ' · ' })
        return Object.keys(flattened)
            .sort()
            .map((key) => ({ label: key, value: String(flattened[key]) }))
            .filter((row) => row.value !== '' && row.value !== 'null')
    }, [recordData, pds_standard])

    const filter = filterString.trim().toLowerCase()
    const sections = [
        ...presentation.sections,
        { id: RAW_SECTION_ID, title: 'All label fields', rows: rawRows },
    ]
        .map((section) => ({
            ...section,
            rows: section.rows.filter((row) => matches(row, filter)),
        }))
        .filter((section) => section.rows.length > 0)

    const downloadProducts = getDownloadProducts(recordData)
    const showVersions = pds_standard === 'pds4' && versions.length > 0

    const copy = (text, message) => {
        copyToClipboard(text)
        dispatch(setSnackBarText(message, 'success'))
    }

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
                {!isNarrow && caption != null && (
                    <div className={c.captionFoot}>
                        <Button
                            className={c.smallAction}
                            size="small"
                            startIcon={<ContentCopyIcon style={{ fontSize: '13px' }} />}
                            onClick={() => copy(caption, 'Copied caption to clipboard!')}
                        >
                            Copy caption
                        </Button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={c.Overview}>
            {(hasViewable || !isNarrow) && (
                <div className={c.viewerColumn}>
                    {hasViewable ? (
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
                <div className={c.metadataScroll}>
                    {showVersions && (
                        <div className={c.versionRow}>
                            <div className={c.versionLabel}>Version</div>
                            <FormControl size="small">
                                <Select
                                    className={c.select}
                                    MenuProps={{ className: c.selectMenu }}
                                    aria-label="record version"
                                    onChange={(e) => {
                                        navigate(
                                            `${HASH_PATHS.record}?uri=${
                                                versions[e.target.value].uri
                                            }`
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
                                        <span className={c.tileLabelText} title={tile.label}>
                                            {tile.shortLabel}
                                        </span>
                                    </div>
                                    <div className={c.tileValue}>{tile.value}</div>
                                    {tile.sub != null && (
                                        <div className={c.tileSub}>{tile.sub}</div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                    <div className={c.filter}>
                        <Input
                            className={c.filterInput}
                            value={filterString}
                            placeholder="Filter fields…"
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
                        const open = filter !== '' || collapsed[section.id] !== true
                        return (
                            <div className={c.section} key={section.id}>
                                <button
                                    className={c.sectionHead}
                                    aria-expanded={open}
                                    onClick={() =>
                                        setCollapsed({
                                            ...collapsed,
                                            [section.id]: !collapsed[section.id],
                                        })
                                    }
                                >
                                    <span>
                                        {open ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                                        {section.title}
                                    </span>
                                    <span className={c.sectionCount}>{section.rows.length}</span>
                                </button>
                                <Collapse in={open} unmountOnExit>
                                    {section.rows.map((row, idx) => (
                                        <div className={c.row} key={idx}>
                                            <div className={c.rowLabel}>{row.label}</div>
                                            <div className={c.rowValue}>
                                                {row.value}
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
                    {presentation.citation != null && getAppConfig().enableRecordCitation && (
                        <div className={c.citation}>{presentation.citation}</div>
                    )}
                </div>
                <div className={c.actions}>
                    <SplitButton
                        forceName="Download"
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
                    {getAppConfig().enableCart && (
                        <Button
                            className={c.actionButton}
                            size="small"
                            variant="outlined"
                            startIcon={<AddShoppingCartIcon />}
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
                            Add to cart
                        </Button>
                    )}
                    {presentation.citation != null && getAppConfig().enableRecordCitation && (
                        <Button
                            className={c.actionButton}
                            size="small"
                            variant="outlined"
                            onClick={() =>
                                copy(presentation.citation, 'Copied citation to clipboard!')
                            }
                        >
                            Copy citation
                        </Button>
                    )}
                    <Button
                        className={c.actionButton}
                        size="small"
                        variant="outlined"
                        onClick={() => dispatch(setRecordViewTab('product label'))}
                    >
                        View full label
                    </Button>
                    <Tooltip title="Copy link" arrow>
                        <IconButton
                            className={c.actionIcon}
                            aria-label="copy link to record page"
                            size="small"
                            onClick={() => copy(window.location.href, 'Copied URL to clipboard!')}
                        >
                            <LinkIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </div>
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
