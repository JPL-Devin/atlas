import React, { useState } from 'react'
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
import DownloadIcon from '@mui/icons-material/Download'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined'
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined'

import {
    copyToClipboard,
    getIn,
    getPDSUrl,
    getFilename,
} from '../../../../../core/utils.js'
import { getDownloadProducts } from '../../../../../core/recordDownloads.js'
import { streamDownloadFile } from '../../../../../core/downloaders/ZipStream.js'
import { HASH_PATHS, ES_PATHS } from '../../../../../core/constants.js'
import { getAppConfig, getAppInstanceKey } from '../../../../../core/appConfig.js'
import { resolvePresentation } from '../../../../../core/recordPresentation'
import { setRecordViewTab, setSnackBarText } from '../../../../../core/redux/actions/actions.js'

import tileIcons from './tileIcons.js'
import PanelHeader from '../../PanelHeader/PanelHeader'
import LabelActions from '../../PanelHeader/LabelActions'

// File cards read by type: rasters, text/label formats, tilesets, then binary.
const FILE_ICONS = {
    image: ImageOutlinedIcon,
    markup: CodeOutlinedIcon,
    text: DescriptionOutlinedIcon,
    tiles: GridOnOutlinedIcon,
    binary: MemoryOutlinedIcon,
}
const FILE_KINDS = {
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    gif: 'image',
    tif: 'image',
    tiff: 'image',
    webp: 'image',
    xml: 'markup',
    json: 'markup',
    lbl: 'text',
    txt: 'text',
    cat: 'text',
    fmt: 'text',
    csv: 'text',
    dzi: 'tiles',
    img: 'binary',
    dat: 'binary',
    bin: 'binary',
    cub: 'binary',
    qub: 'binary',
    raw: 'binary',
}

const fileIconFor = (file) => {
    const kind = FILE_KINDS[(file.extension || '').toLowerCase()]
    return FILE_ICONS[kind] || InsertDriveFileOutlinedIcon
}

const useStyles = makeStyles((theme) => ({
    // The caption leads the panel body rather than floating over the image.
    captionCard: {
        boxSizing: 'border-box',
        padding: '10px 12px 8px 12px',
        marginBottom: '20px',
        borderRadius: '3px',
        border: `1px solid ${theme.palette.swatches.grey.grey200}`,
        background: theme.palette.swatches.grey.grey0,
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
        background: theme.palette.swatches.grey.grey150,
        color: theme.palette.swatches.grey.grey800,
        whiteSpace: 'nowrap',
    },
    captionTitle: {
        fontSize: '14px',
        fontWeight: 'bold',
        lineHeight: '20px',
        color: theme.palette.text.primary,
    },
    captionText: {
        fontSize: '13px',
        lineHeight: '19px',
        color: theme.palette.swatches.grey.grey600,
        marginTop: '2px',
    },
    captionFoot: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        marginTop: '6px',
    },
    captionCopy: {
        'padding': '2px',
        'color': theme.palette.swatches.grey.grey500,
        '&:hover': {
            color: theme.palette.swatches.grey.grey900,
            background: theme.palette.swatches.grey.grey150,
        },
        '& .MuiSvgIcon-root': {
            fontSize: '15px',
        },
    },
    captionAuthor: {
        fontSize: '11px',
        color: theme.palette.swatches.grey.grey500,
        whiteSpace: 'nowrap',
    },
    // A strip of the product's timestamps: a node per time, with the elapsed
    // span named on the connector between them.
    timeline: {
        display: 'flex',
        alignItems: 'flex-start',
        margin: '4px 0 20px 0',
    },
    timelineNode: {
        display: 'flex',
        flexFlow: 'column',
        alignItems: 'center',
        flexShrink: 0,
        gap: '3px',
    },
    timelineDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: theme.palette.swatches.grey.grey400,
    },
    // Swatches a timeline entry can name, so each timestamp reads as its own step.
    timelineDotBlue: {
        background: theme.palette.swatches.blue.blue700,
    },
    timelineDotGreen: {
        background: theme.palette.swatches.green.green500,
    },
    timelineDotLightblue: {
        background: theme.palette.swatches.blue.blue300,
    },
    timelineDotPurple: {
        background: theme.palette.swatches.purple.purple500,
    },
    timelineLabel: {
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: theme.palette.swatches.grey.grey500,
        whiteSpace: 'nowrap',
    },
    timelineValue: {
        fontSize: '11px',
        color: theme.palette.swatches.grey.grey700,
        whiteSpace: 'nowrap',
    },
    // The connector carries the gap label, centred on the rule between nodes.
    timelineSpan: {
        flex: 1,
        minWidth: '24px',
        display: 'flex',
        flexFlow: 'column',
        alignItems: 'center',
        gap: '3px',
    },
    timelineRule: {
        width: '100%',
        height: '1px',
        marginTop: '4px',
        background: theme.palette.swatches.grey.grey300,
    },
    timelineGap: {
        fontSize: '10px',
        color: theme.palette.swatches.grey.grey500,
        whiteSpace: 'nowrap',
    },
    skeleton: {
        backgroundColor: theme.palette.swatches.grey.grey150,
    },
    metadata: {
        width: 'var(--record-panel-width, 770px)',
        height: '100%',
        color: theme.palette.text.primary,
        boxSizing: 'border-box',
        display: 'flex',
        flexFlow: 'column',
        background: theme.palette.swatches.grey.grey100,
        borderRight: `1px solid ${theme.palette.swatches.grey.grey200}`,
        [theme.breakpoints.down('md')]: {
            width: '100%',
            height: 'unset',
            borderRight: 'none',
            borderTop: `1px solid ${theme.palette.swatches.grey.grey200}`,
        },
    },
    // A slim scrollbar keeps the gutter from cutting into the heading rules.
    metadataScroll: {
        'flex': 1,
        'minHeight': 0,
        'overflowY': 'auto',
        'padding': '16px 20px 20px 20px',
        'scrollbarWidth': 'thin',
        'scrollbarColor': `${theme.palette.swatches.grey.grey300} transparent`,
        '&::-webkit-scrollbar': {
            width: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
            background: theme.palette.swatches.grey.grey300,
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
        // The site titlebar's goldenrod, which reads on the light panel.
        color: theme.palette.swatches.yellow.yellow800,
        borderTop: `1px solid ${theme.palette.swatches.grey.grey200}`,
        // Negative margins pull the rule out to the panel edges.
        margin: '0 -20px 10px -20px',
        padding: '12px 20px 0 20px',
    },
    tiles: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '8px',
        marginBottom: '20px',
        [theme.breakpoints.down('lg')]: {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        },
        [theme.breakpoints.down('sm')]: {
            gridTemplateColumns: 'minmax(0, 1fr)',
        },
    },
    tile: {
        background: theme.palette.swatches.grey.grey0,
        border: `1px solid ${theme.palette.swatches.grey.grey200}`,
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
        'color': theme.palette.swatches.grey.grey500,
        'whiteSpace': 'nowrap',
        'overflow': 'hidden',
        '& > svg': {
            fontSize: '15px',
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
    // A paired tile splits into two equal halves, so both fields read at full
    // size with only a rule between them.
    tileHalves: {
        display: 'flex',
        alignItems: 'stretch',
        minWidth: 0,
    },
    tileHalf: {
        flex: 1,
        minWidth: 0,
    },
    tileHalfPaired: {
        paddingLeft: '10px',
        marginLeft: '10px',
        borderLeft: `1px solid ${theme.palette.swatches.grey.grey200}`,
    },
    fieldsHeading: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        marginTop: '20px',
        marginBottom: '10px',
        paddingBottom: '4px',
    },
    allFields: {
        'fontFamily': 'inherit',
        'fontSize': '11px',
        'fontWeight': 'bold',
        'letterSpacing': '0.04em',
        'textTransform': 'none',
        'padding': '6px 10px',
        'borderRadius': '2px',
        'border': 'none',
        // blue800 rather than blue700: white on blue700 is only 4.2:1.
        'background': theme.palette.swatches.blue.blue800,
        'color': theme.palette.swatches.grey.grey0,
        'cursor': 'pointer',
        '&:hover': {
            background: theme.palette.swatches.blue.blue900,
        },
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
        'color': theme.palette.text.primary,
        '&:before': {
            borderBottom: `1px solid ${theme.palette.swatches.grey.grey300}`,
        },
        '& .MuiSvgIcon-root': {
            fontSize: '18px',
            color: theme.palette.swatches.grey.grey500,
        },
        '& input::placeholder': {
            color: theme.palette.swatches.grey.grey500,
            opacity: 1,
        },
    },
    clearFilter: {
        color: theme.palette.swatches.grey.grey500,
        transition: 'opacity 0.2s ease-out',
    },
    // Fields sit on their own surface, like the caption and At-a-glance cards.
    fieldsCard: {
        boxSizing: 'border-box',
        padding: '2px 12px 8px 12px',
        marginBottom: '20px',
        borderRadius: '3px',
        border: `1px solid ${theme.palette.swatches.grey.grey200}`,
        background: theme.palette.swatches.grey.grey0,
    },
    // The archive object is flat, so its rows need no collapsible grouping.
    archiveRows: {
        padding: '4px 0',
    },
    section: {
        // The app's global Collapse styling adds a left rule that reads as a
        // stray vertical line here.
        'borderTop': `1px solid ${theme.palette.swatches.grey.grey200}`,
        '& .MuiCollapse-wrapper': {
            borderLeft: 'none',
        },
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
        // Gold marks the panel's top-level headings; a group inside `Fields` is
        // a level down, so it stays grey.
        'color': theme.palette.swatches.grey.grey700,
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
            color: theme.palette.swatches.grey.grey500,
        },
    },
    archiveHeading: {
        'display': 'flex',
        'alignItems': 'center',
        'gap': '4px',
        'width': 'calc(100% + 40px)',
        'background': 'none',
        'border': 'none',
        'borderTop': `1px solid ${theme.palette.swatches.grey.grey200}`,
        'cursor': 'pointer',
        'fontFamily': 'inherit',
        '& .MuiSvgIcon-root': {
            fontSize: '18px',
        },
    },
    fileCards: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '8px',
        marginBottom: '20px',
    },
    fileCard: {
        'boxSizing': 'border-box',
        'display': 'grid',
        'gridTemplateColumns': 'auto minmax(0, 1fr) auto',
        'alignItems': 'center',
        'columnGap': '10px',
        'padding': '10px',
        'borderRadius': '3px',
        'border': `1px solid ${theme.palette.swatches.grey.grey200}`,
        'background': theme.palette.swatches.grey.grey0,
        '&:hover': {
            borderColor: theme.palette.swatches.grey.grey300,
        },
    },
    // A tinted square keeps the type icon legible at card scale.
    fileBadge: {
        'display': 'flex',
        'alignItems': 'center',
        'justifyContent': 'center',
        'width': '34px',
        'height': '34px',
        'borderRadius': '3px',
        'background': theme.palette.swatches.grey.grey150,
        'color': theme.palette.swatches.grey.grey600,
        '& > svg': {
            fontSize: '20px',
        },
    },
    fileText: {
        minWidth: 0,
    },
    fileNameRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        minWidth: 0,
    },
    fileName: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: theme.palette.text.primary,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    fileExt: {
        flexShrink: 0,
        fontSize: '10px',
        fontWeight: 'bold',
        letterSpacing: '0.04em',
        lineHeight: '15px',
        padding: '0 5px',
        borderRadius: '2px',
        background: theme.palette.swatches.grey.grey150,
        color: theme.palette.swatches.grey.grey600,
    },
    fileMeta: {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: theme.palette.swatches.grey.grey500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    fileSize: {
        flexShrink: 0,
        fontSize: '12px',
        color: theme.palette.swatches.grey.grey600,
        whiteSpace: 'nowrap',
    },
    fileActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    fileDownload: {
        '&.MuiIconButton-root': {
            color: theme.palette.swatches.blue.blue600,
        },
    },
    sectionCount: {
        fontSize: '11px',
        fontWeight: 'normal',
        color: theme.palette.swatches.grey.grey500,
    },
    // One grid, so every label and every value share a column edge instead of
    // meeting at a ragged gutter.
    row: {
        'display': 'grid',
        'gridTemplateColumns': 'minmax(0, 11em) minmax(0, 1fr)',
        'columnGap': '16px',
        'padding': '4px 0',
        'fontSize': '13px',
        'lineHeight': '19px',
        '&:hover $rowCopy': {
            opacity: 1,
        },
    },
    rowLabel: {
        color: theme.palette.swatches.grey.grey500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    rowValue: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        gap: '4px',
        minWidth: 0,
        color: theme.palette.text.primary,
        textAlign: 'right',
        overflowWrap: 'anywhere',
    },
    rowCopy: {
        'opacity': 0,
        'padding': '1px',
        'color': theme.palette.swatches.grey.grey500,
        'transition': 'opacity 0.15s ease-out',
        '& .MuiSvgIcon-root': {
            fontSize: '13px',
        },
    },
    noMatches: {
        fontSize: '12px',
        color: theme.palette.swatches.grey.grey500,
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
        color: theme.palette.swatches.yellow.yellow800,
        borderTop: `1px solid ${theme.palette.swatches.grey.grey200}`,
        margin: '0 -20px 10px -20px',
        padding: '12px 20px 6px 20px',
    },
    // Same surface as the caption, At-a-glance and field cards.
    citation: {
        boxSizing: 'border-box',
        fontSize: '13px',
        lineHeight: '19px',
        color: theme.palette.text.primary,
        overflowWrap: 'anywhere',
        padding: '12px',
        marginBottom: '20px',
        borderRadius: '3px',
        border: `1px solid ${theme.palette.swatches.grey.grey200}`,
        background: theme.palette.swatches.grey.grey0,
    },
    select: {
        'fontSize': '12px',
        'marginLeft': '4px',
        'color': theme.palette.text.primary,
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.swatches.grey.grey300,
        },
        '& .MuiSvgIcon-root': {
            color: theme.palette.swatches.grey.grey500,
        },
    },
    selectMenu: {
        '& .MuiPaper-root': {
            background: theme.palette.swatches.grey.grey0,
            color: theme.palette.text.primary,
        },
        '& .MuiMenuItem-root.Mui-selected, & .MuiMenuItem-root:hover': {
            background: theme.palette.swatches.grey.grey150,
        },
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
    const [filterString, setFilterString] = useState('')
    const [collapsed, setCollapsed] = useState({})
    // Archival provenance is secondary, so it starts closed.
    const [archiveExpanded, setArchiveExpanded] = useState(false)

    const pds_standard = getIn(recordData, ES_PATHS.pds_standard)

    // A pending record isn't a product without a browse image, so it shows the
    // loading state rather than the empty state.
    const isLoading = loading === true && Object.keys(recordData || {}).length === 0

    const presentation = resolvePresentation(recordData, { instance: getAppInstanceKey() })

    // Phones show only the priority tiles; wider viewports show the configured
    // maximum in the same configured order. Either way the grid keeps whole
    // rows, so no row is left partly filled.
    const available = isNarrow
        ? presentation.tiles.slice(0, presentation.priorityTiles)
        : presentation.tiles
    const tiles = available.slice(0, Math.floor(available.length / tileColumns) * tileColumns)
    const caption = presentation.caption || presentation.shortCaption

    // Both fields of a paired tile render identically; only the second gets a
    // dividing rule.
    const renderTileHalf = (part, paired = false) => {
        const Icon = tileIcons[part.icon]
        return (
            <div className={`${c.tileHalf} ${paired ? c.tileHalfPaired : ''}`}>
                <div className={c.tileLabel}>
                    {Icon && <Icon />}
                    <span className={c.tileLabelText} title={part.label}>
                        {part.shortLabel}
                    </span>
                </div>
                <div className={c.tileValue} title={part.value}>
                    {part.value}
                </div>
            </div>
        )
    }

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

    const archiveRows = presentation.archiveRows.filter((row) => matches(row, filter))
    const fieldCount = sections.reduce((total, section) => total + section.rows.length, 0)
    const files = getDownloadProducts(recordData).filter((file) => file.uri)
    // Filtering reveals matching archival rows even while the section is closed.
    const archiveOpen = filter !== '' || archiveExpanded

    const copy = (text, message) => {
        copyToClipboard(text)
        dispatch(setSnackBarText(message, 'success'))
    }

    const renderRow = (row, idx) => (
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
                        onClick={() => copy(row.value, 'Copied value to clipboard!')}
                    >
                        <ContentCopyIcon />
                    </IconButton>
                </Tooltip>
            </div>
        </div>
    )

    // One card per downloadable product: source plus its related assets.
    const renderFiles = () => {
        if (files.length === 0) return null
        return (
            <>
                <div className={c.heading}>Files</div>
                <div className={c.fileCards}>
                    {files.map((file) => {
                        const filename = getFilename(file.uri)
                        const FileIcon = fileIconFor(file)
                        return (
                            <div className={c.fileCard} key={file.uri}>
                                <div className={c.fileBadge}>
                                    <FileIcon />
                                </div>
                                <div className={c.fileText}>
                                    <div className={c.fileNameRow}>
                                        <span className={c.fileName} title={file.name}>
                                            {file.name}
                                        </span>
                                        {file.extension && (
                                            <span className={c.fileExt}>
                                                {file.extension.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className={c.fileMeta} title={filename}>
                                        {filename}
                                    </div>
                                </div>
                                <div className={c.fileActions}>
                                    {file.size && <span className={c.fileSize}>{file.size}</span>}
                                    <Tooltip title={`Download ${file.name}`} arrow>
                                        <IconButton
                                            className={c.fileDownload}
                                            aria-label={`download ${file.name}`}
                                            size="small"
                                            onClick={() =>
                                                streamDownloadFile(
                                                    getPDSUrl(file.uri, file.release_id),
                                                    filename
                                                )
                                            }
                                        >
                                            <DownloadIcon />
                                        </IconButton>
                                    </Tooltip>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </>
        )
    }

    const renderTimeline = () => {
        if (presentation.timeline.length === 0) return null
        const dotColors = {
            blue: c.timelineDotBlue,
            green: c.timelineDotGreen,
            lightblue: c.timelineDotLightblue,
            purple: c.timelineDotPurple,
        }
        return (
            <>
                <div className={c.heading}>Timeline</div>
                <div className={c.timeline} aria-label="record timeline">
                    {presentation.timeline.map((point, idx) => (
                        <React.Fragment key={idx}>
                            {idx > 0 && (
                                <div className={c.timelineSpan}>
                                    <div className={c.timelineRule} />
                                    <div className={c.timelineGap}>{point.gap}</div>
                                </div>
                            )}
                            <div className={c.timelineNode}>
                                <div
                                    className={`${c.timelineDot} ${dotColors[point.color] || ''}`}
                                />
                                <div className={c.timelineLabel}>{point.label}</div>
                                <div className={c.timelineValue}>{point.value}</div>
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            </>
        )
    }

    const renderCaptionCard = () => {
        if (presentation.captionTitle == null && caption == null) return null
        return (
            <div className={c.captionCard} aria-label="record caption">
                {presentation.captionChips.length > 0 && (
                    <div className={c.captionChips}>
                        {presentation.captionChips.map((chip, idx) => (
                            <span className={c.chip} key={idx}>
                                {chip}
                            </span>
                        ))}
                    </div>
                )}
                {presentation.captionTitle != null && (
                    <div className={c.captionTitle}>{presentation.captionTitle}</div>
                )}
                {caption != null && <div className={c.captionText}>{caption}</div>}
                {(caption != null || presentation.citationAuthor != null) && (
                    <div className={c.captionFoot}>
                        {caption != null ? (
                            <Tooltip title="Copy caption" arrow>
                                <IconButton
                                    className={c.captionCopy}
                                    aria-label="copy record caption"
                                    size="small"
                                    onClick={() => copy(caption, 'Copied caption to clipboard!')}
                                >
                                    <ContentCopyIcon />
                                </IconButton>
                            </Tooltip>
                        ) : (
                            <span />
                        )}
                        {presentation.citationAuthor != null && (
                            <div className={c.captionAuthor}>{presentation.citationAuthor}</div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    // The panel keeps its shape while the record resolves, so nothing shifts
    // once the real values arrive.
    const renderSkeleton = () => (
        <>
            <div className={c.metadataScroll} aria-hidden="true">
                <Skeleton className={c.skeleton} variant="text" width="90%" />
                <div className={c.captionCard}>
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
                    <Skeleton className={c.skeleton} variant="text" width="45%" height={20} />
                    <Skeleton className={c.skeleton} variant="text" width="80%" />
                </div>
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
                <div className={`${c.heading} ${c.fieldsHeading}`}>General Fields</div>
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
        <div className={c.metadata}>
            <PanelHeader
                recordData={recordData}
                extraActions={!isNarrow ? <LabelActions recordData={recordData} /> : null}
            />
            {isLoading ? (
                renderSkeleton()
            ) : (
                <>
                    <div className={c.metadataScroll}>
                        {renderCaptionCard()}
                        <div className={c.heading}>At a glance</div>
                        <div className={c.tiles}>
                            {tiles.map((tile, idx) => (
                                <div className={c.tile} key={idx}>
                                    <div className={c.tileHalves}>
                                        {renderTileHalf(tile)}
                                        {tile.pair != null && renderTileHalf(tile.pair, true)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {renderTimeline()}
                        <div className={`${c.heading} ${c.fieldsHeading}`}>
                            <span>General Fields</span>
                            <Tooltip title="Open the full product label" arrow>
                                <button
                                    className={c.allFields}
                                    aria-label="see all fields"
                                    onClick={() => dispatch(setRecordViewTab('product label'))}
                                >
                                    See all fields
                                </button>
                            </Tooltip>
                        </div>
                        <div className={c.fieldsCard}>
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
                                            {section.rows.map(renderRow)}
                                        </Collapse>
                                    </div>
                                )
                            })}
                        </div>
                        {renderFiles()}
                        {archiveRows.length > 0 && (
                            <>
                                <button
                                    className={`${c.heading} ${c.archiveHeading}`}
                                    aria-expanded={archiveOpen}
                                    onClick={() => setArchiveExpanded(!archiveExpanded)}
                                >
                                    {archiveOpen ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                                    <span>Archival Fields</span>
                                    <span className={c.sectionCount}>{archiveRows.length}</span>
                                </button>
                                <Collapse in={archiveOpen} unmountOnExit>
                                    <div className={c.fieldsCard}>
                                        <div className={c.archiveRows}>
                                            {archiveRows.map(renderRow)}
                                        </div>
                                    </div>
                                </Collapse>
                            </>
                        )}
                        {presentation.citation != null && getAppConfig().enableRecordCitation && (
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
    )
}

Overview.propTypes = {
    recordData: PropTypes.object,
    versions: PropTypes.array,
    activeVersion: PropTypes.number,
    loading: PropTypes.bool,
}

export default Overview
