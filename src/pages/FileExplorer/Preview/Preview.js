import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import clsx from 'clsx'
import axios from 'axios'

import {
    getIn,
    getHeader,
    getExtension,
    prettify,
    humanFileSize,
    getPDSUrl,
    getFilename,
    copyToClipboard,
} from '../../../core/utils'

import {
    updateFilexColumn,
    goToFilexURI,
    addToCart,
    setSnackBarText,
} from '../../../core/redux/actions/actions'
import { ES_PATHS, HASH_PATHS, IMAGE_EXTENSIONS, domain, endpoints } from '../../../core/constants'
import { streamDownloadFile } from '../../../core/downloaders/ZipStream.js'

import ProductIcons from '../../../components/ProductIcons/ProductIcons'
import SisResources from '../../../components/SisResources/SisResources'

import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'

import PageviewIcon from '@mui/icons-material/Pageview'
import GetAppIcon from '@mui/icons-material/GetApp'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import LaunchIcon from '@mui/icons-material/Launch'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import WarningIcon from '@mui/icons-material/Warning'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'

import Image from 'mui-image'

import { makeStyles } from '@mui/styles'

import './Preview.css'

const TAIL_CHARS = 8
const BROWSE_SIZES = [
    ['Full', undefined],
    ['Large', 'lg'],
    ['Medium', 'md'],
    ['Small', 'sm'],
    ['Tiny', 'xs'],
]

const useStyles = makeStyles((theme) => ({
    Preview: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexFlow: 'column',
        background: theme.palette.swatches.grey.grey100,
        borderLeft: `1px solid ${theme.palette.swatches.grey.grey200}`,
        color: theme.palette.text.primary,
        zIndex: 2,
    },
    PreviewMobile: {
        zIndex: 999,
        display: 'flex',
        flexFlow: 'column',
        borderLeft: 'none',
        background: theme.palette.swatches.grey.grey100,
        color: theme.palette.text.primary,
    },
    header: {
        width: '100%',
        boxSizing: 'border-box',
        background: theme.palette.swatches.grey.grey0,
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
    },
    headerMobile: {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        boxSizing: 'border-box',
        background: theme.palette.swatches.grey.grey0,
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
    },
    headerTitle: {},
    // Same faint-amber notice the record's Product Label uses.
    headerBanner: {
        'fontSize': '13px',
        'lineHeight': 1.4,
        'padding': '8px 12px',
        'background': 'rgba(240, 173, 78, 0.16)',
        'borderTop': '1px solid rgba(240, 173, 78, 0.5)',
        'color': theme.palette.text.primary,
        'display': 'flex',
        'alignItems': 'center',
        'justifyContent': 'space-between',
        'cursor': 'pointer',
        '& > div': {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
        },
        '& svg': {
            color: theme.palette.swatches.orange.orange500,
            flexShrink: 0,
        },
    },
    icon: {
        fontSize: '24px',
    },
    iconMobile: {
        fontSize: '30px',
        padding: '5px',
    },
    title: {
        fontSize: '14px',
        fontWeight: 'bold',
        margin: '10px 12px 0px 12px',
        fontFamily: 'inherit',
        wordBreak: 'break-all',
    },
    titleMobile: {
        fontSize: '16px',
        margin: '0px',
        fontFamily: 'inherit',
        lineHeight: `${theme.headHeights[2]}px`,
    },
    headerRight: {
        flex: 1,
        display: 'flex',
        justifyContent: 'space-between',
    },
    buttonIcon: {},
    // Labelled, filled controls matching the record page's action row.
    actions: {
        'display': 'flex',
        'alignItems': 'stretch',
        'justifyContent': 'center',
        'flexWrap': 'wrap',
        'gap': '4px',
        'boxSizing': 'border-box',
        'padding': '6px 8px',
        '& .MuiButton-root': {
            fontSize: '12px',
            lineHeight: '16px',
            minWidth: 0,
            padding: '4px 8px',
            borderRadius: '2px',
            textTransform: 'none',
            whiteSpace: 'nowrap',
        },
        '& .MuiButton-startIcon': {
            marginRight: '4px',
        },
        '& .MuiSvgIcon-root': {
            fontSize: '16px',
        },
    },
    action: {
        flexShrink: 0,
    },
    // A slim scrollbar keeps the gutter from cutting into the heading rules.
    body: {
        'flex': 1,
        'overflowY': 'auto',
        'overflowX': 'hidden',
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
    bodyInner: {
        padding: '16px 20px 20px 20px',
    },
    bodyMobile: {},
    properties: {},
    // The record panel's section heading: gold, uppercase, with a rule pulled
    // out to the panel edges.
    heading: {
        fontSize: '12px',
        fontWeight: 'bold',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: theme.palette.swatches.yellow.yellow800,
        borderTop: `1px solid ${theme.palette.swatches.grey.grey200}`,
        margin: '0 -20px 10px -20px',
        padding: '12px 20px 0 20px',
    },
    sectionBody: {
        marginBottom: '20px',
    },
    // The record Overview's Files cards, reused for the product's own assets.
    fileCards: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
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
        'transition': 'border-color 0.15s ease-out, box-shadow 0.15s ease-out',
        '&:hover': {
            borderColor: theme.palette.swatches.grey.grey300,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        },
    },
    // Cards whose actions don't fit beside the name put them on a second row.
    fileCardStacked: {
        'gridTemplateColumns': 'auto minmax(0, 1fr)',
        'rowGap': '8px',
        '& > $fileActions': {
            gridColumn: '1 / -1',
        },
    },
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
        fontSize: '14px',
        fontWeight: 'bold',
        color: theme.palette.text.primary,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    fileExt: {
        flexShrink: 0,
        fontSize: '12px',
        fontWeight: 'bold',
        letterSpacing: '0.04em',
        lineHeight: '17px',
        padding: '0 5px',
        borderRadius: '2px',
        background: theme.palette.swatches.grey.grey150,
        color: theme.palette.swatches.grey.grey600,
    },
    fileMeta: {
        display: 'flex',
        fontSize: '12px',
        fontFamily: 'monospace',
        color: theme.palette.swatches.grey.grey500,
        whiteSpace: 'nowrap',
        minWidth: 0,
    },
    fileMetaHead: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    fileMetaTail: {
        flexShrink: 0,
    },
    fileActions: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        gap: '4px',
    },
    fileOpen: {
        '&.MuiIconButton-root': {
            color: theme.palette.swatches.blue.blue600,
        },
    },
    relatedButton: {
        'background': theme.palette.swatches.grey.grey0,
        'color': theme.palette.swatches.blue.blue700,
        'border': `1px solid ${theme.palette.swatches.grey.grey200}`,
        'borderRadius': '3px',
        'fontSize': '11px',
        'fontWeight': 'bold',
        'letterSpacing': '0.04em',
        '&:hover': {
            background: theme.palette.swatches.grey.grey0,
            border: `1px solid ${theme.palette.swatches.grey.grey300}`,
        },
        '& .MuiButton-label': {
            lineHeight: '20px',
        },
        '& .MuiButton-endIcon': {
            marginLeft: '6px',
        },
        '& .MuiButton-endIcon > svg': {
            fontSize: '14px',
        },
    },
    // Fields sit on their own white surface, as they do on the record page.
    card: {
        boxSizing: 'border-box',
        padding: '2px 12px',
        borderRadius: '3px',
        border: `1px solid ${theme.palette.swatches.grey.grey200}`,
        background: theme.palette.swatches.grey.grey0,
    },
    propertiesList: {
        'listStyleType': 'none',
        'margin': `0px`,
        'padding': '0px',
        '& > li': {
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 11em) minmax(0, 1fr)',
            columnGap: '16px',
            fontSize: '13px',
            lineHeight: '19px',
            padding: '4px 0',
            wordBreak: 'break-all',
        },
        '& > li + li': {
            borderTop: `1px solid ${theme.palette.swatches.grey.grey150}`,
        },
    },
    key: {
        color: theme.palette.swatches.grey.grey500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    value: {
        minWidth: 0,
        textAlign: 'right',
        overflowWrap: 'anywhere',
        cursor: 'pointer',
    },
    image: {
        width: '100%',
        height: '400px',
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
        background: theme.palette.swatches.grey.grey0,
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
    },
    previewImage: {
        'overflow': 'hidden',
        'position': 'static !important',
        'objectFit': 'cover !important',
        'transition': 'filter 0.15s ease-in-out !important',
        '&:hover': {
            filter: 'brightness(1.25)',
        },
    },
    imageCover: {
        position: 'absolute',
        pointerEvents: 'none',
        top: 0,
        width: '100%',
        height: '100%',
        boxShadow: 'inset 0px 1px 4px 0px rgba(0,0,0,0.10)',
    },
    imageless: {
        'width': '100%',
        'height': '100%',
        'poisition': 'relative',
        '& > div': {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-50%)',
        },
    },
    description: {},
    navHeader: {
        'height': `${theme.headHeights[2]}px`,
        'minHeight': `${theme.headHeights[2]}px`,
        'background': theme.palette.swatches.grey.grey0,
        'boxSizing': 'border-box',
        'display': 'flex',
        'justifyContent': 'space-between',
        'borderBottom': `1px solid ${theme.palette.swatches.grey.grey200}`,
        '& > div': {
            display: 'flex',
            justifyContent: 'space-between',
        },
        '& > div:last-child': {
            flex: 1,
        },
    },
    backButton: {
        lineHeight: '28px',
        borderRadius: 0,
        color: theme.palette.swatches.grey.grey700,
    },
    emptyPreview: {
        textAlign: 'center',
        margin: `${theme.spacing(10)} 0px`,
        color: theme.palette.swatches.grey.grey500,
        fontSize: '16px',
    },
    formControl: {
        minWidth: 125,
        margin: '0px',
    },
    select: {
        'fontSize': '13px',
        'color': theme.palette.text.primary,
        'background': theme.palette.swatches.grey.grey50,
        'border': `1px solid ${theme.palette.swatches.grey.grey200}`,
        'borderRadius': '3px',
        'paddingLeft': '4px',
        '&:before, &:after': {
            display: 'none',
        },
        '& > div:first-child': {
            padding: '2px 20px 2px 6px',
            textAlign: 'left',
        },
        '& > svg': {
            color: theme.palette.swatches.grey.grey500,
            right: '2px',
        },
    },
    // Keeps the version control on the value column's right edge.
    versionSelect: {
        display: 'flex',
        justifyContent: 'flex-end',
        minWidth: 0,
    },
    versionSelectItem: {},
}))

const ButtonBar = (props) => {
    const { preview, related } = props
    const c = useStyles()
    const dispatch = useDispatch()
    const navigate = useNavigate()

    return (
        <div className={c.actions} aria-label="product actions">
            <Tooltip title="View this product's record page" arrow>
                <span>
                    <Button
                        className={c.action}
                        variant="contained"
                        color="primary"
                        size="small"
                        aria-label="view"
                        startIcon={<PageviewIcon fontSize="small" />}
                        disabled={
                            preview.fs_type !== 'file' || related == null || related.uri == null
                        }
                        onClick={() => {
                            if (related && related.uri)
                                navigate(`${HASH_PATHS.record}?uri=${related.uri}&back=page`)
                        }}
                    >
                        View
                    </Button>
                </span>
            </Tooltip>
            <Tooltip title="Open at the PDS archive" arrow>
                <span>
                    <Button
                        className={c.action}
                        variant="contained"
                        color="primary"
                        size="small"
                        aria-label="open"
                        startIcon={<LaunchIcon fontSize="small" />}
                        disabled={preview.fs_type !== 'file'}
                        onClick={() => {
                            if (preview.uri)
                                window.open(
                                    getPDSUrl(preview.uri, getIn(preview, ES_PATHS.release_id)),
                                    '_blank'
                                )
                        }}
                    >
                        Open
                    </Button>
                </span>
            </Tooltip>
            <Tooltip title="Download this file" arrow>
                <span>
                    <Button
                        className={c.action}
                        variant="contained"
                        color="primary"
                        size="small"
                        aria-label="quick download"
                        startIcon={<GetAppIcon fontSize="small" />}
                        disabled={preview.fs_type !== 'file'}
                        onClick={() => {
                            if (preview.uri != null) {
                                streamDownloadFile(
                                    getPDSUrl(preview.uri, getIn(preview, ES_PATHS.release_id)),
                                    getFilename(preview.uri)
                                )
                            }
                        }}
                    >
                        Download
                    </Button>
                </span>
            </Tooltip>
            <Tooltip title="Add to Cart" arrow>
                <span>
                    <Button
                        className={c.action}
                        variant="contained"
                        color="primary"
                        size="small"
                        aria-label="add to cart"
                        startIcon={<AddShoppingCartIcon fontSize="small" />}
                        disabled={preview.fs_type !== 'file' && preview.fs_type !== 'directory'}
                        onClick={() => {
                            dispatch(
                                addToCart(preview.fs_type === 'directory' ? 'directory' : 'file', {
                                    uri: preview.uri,
                                    related: related,
                                    size: preview.size,
                                    release_id: getIn(preview, ES_PATHS.release_id),
                                })
                            )
                            dispatch(setSnackBarText('Added to Cart!', 'success'))
                        }}
                    >
                        Add to cart
                    </Button>
                </span>
            </Tooltip>
        </div>
    )
}

const Preview = (props) => {
    const { isMobile, showMobilePreview, setShowMobilePreview, forcedPreview } = props

    const c = useStyles()
    const navigate = useNavigate()

    const dispatch = useDispatch()

    const [related, setRelated] = useState(null)
    const [versions, setVersions] = useState([])
    const [activeVersion, setActiveVersion] = useState(null)
    const [hasBrowse, setHasBrowse] = useState(null)

    let preview = useSelector((state) => {
        const filexPreview = state.get('filexPreview')
        return typeof filexPreview.toJS === 'function' ? {} : filexPreview
    })
    preview = forcedPreview || preview

    // The drilled-to mission, so the panel can offer the product's SIS.
    const mission = useSelector((state) => {
        const cols = state.get('columns')
        if (typeof cols.toJS === 'function') return null
        const column = cols.find(
            (col) =>
                col.type === 'filter' &&
                String(col.value).split('.').pop() === 'mission' &&
                col.active != null
        )
        return column ? column.active.key : null
    })

    useEffect(() => {
        // Query Related
        if (preview.uri && preview.fs_type === 'file') {
            let uri = preview.uri
            uri = uri
                .replaceAll('/', '\\/')
                .replaceAll(':', '\\:')
                .replace(/\.[^/.]+$/, '')
            const dsl = {
                query: {
                    bool: {
                        must: [
                            { query_string: { query: `${uri}.*`, default_field: '*uri' } },
                            { exists: { field: 'gather.common' } },
                        ],
                    },
                },
                size: 1,
                _source: ['uri', 'gather.pds_archive.related', ES_PATHS.release_id.join('.')],
                sort: [{ [ES_PATHS.release_id.join('.')]: 'desc' }],
                collapse: {
                    field: 'uri',
                },
            }

            axios
                .post(`${domain}${endpoints.search}`, dsl, getHeader())
                .then((response) => {
                    const hit = response?.data?.hits?.hits?.[0]?._source
                    if (hit) {
                        setHasBrowse(true)
                        setRelated(hit)
                    } else setRelated(null)
                })
                .catch((err) => {
                    setRelated(null)
                })
        } else {
            setRelated(null)
        }

        // Query Versions (Current PDS4 specific)
        if (preview.uri && preview.fs_type === 'file' && preview.lidvid) {
            let [lid, vid] = preview.lidvid.split('::')
            lid = lid
                .replaceAll('/', '\\/')
                .replaceAll(':', '\\:')
                .replace(/\.[^/.]+$/, '')
            const dsl = {
                query: {
                    bool: {
                        must: [
                            {
                                regexp: {
                                    [ES_PATHS.pds4_label.lidvid.join('.')]: {
                                        value: `${lid}.*`,
                                    },
                                },
                            },
                        ],
                    },
                },
                _source: [
                    'uri',
                    ES_PATHS.pds4_label.lidvid.join('.'),
                    ES_PATHS.release_id.join('.'),
                ],
            }

            axios
                .post(`${domain}${endpoints.search}`, dsl, getHeader())
                .then((response) => {
                    const nextVersions = []
                    if (response?.data?.hits?.hits?.[0] != null) {
                        response.data.hits.hits.forEach((r) => {
                            if (r._source?.pds4_label?.lidvid != null) {
                                let [rlid, rvid] = r._source.pds4_label.lidvid.split('::')
                                nextVersions.push({
                                    uri: r._source.uri,
                                    name: r._source.uri.split('/').pop(),
                                    version: `Version ${rvid}`,
                                    versionRaw: rvid,
                                    versionNum: parseFloat(rvid),
                                })
                            }
                        })
                        nextVersions.sort(function (a, b) {
                            return b.versionNum - a.versionNum
                        })
                    }

                    if (nextVersions.length > 0) {
                        const [flid, fvid] = preview.lidvid.split('::')
                        for (let i = 0; i < nextVersions.length; i++) {
                            if (nextVersions[i].versionRaw == fvid) {
                                setActiveVersion(i)
                                break
                            }
                        }
                    }

                    setVersions(nextVersions)
                })
                .catch((err) => {
                    setVersions([])
                })
        } else {
            setVersions([])
        }
    }, [JSON.stringify(preview)])

    if (!showMobilePreview && isMobile && (preview == null || preview.fs_type != 'file'))
        return null

    let imageUrl = 'null'
    const browseUri = getIn(related, 'gather.pds_archive.related.browse.uri')
    const release_id = getIn(related, ES_PATHS.release_id)

    if (browseUri && IMAGE_EXTENSIONS.includes(getExtension(browseUri, true)))
        imageUrl = getPDSUrl(browseUri, release_id, 'md')

    if (Object.keys(preview).length == 0) {
        return (
            <div className={c.Preview}>
                <div className={c.emptyPreview}>No File Object Selected</div>
            </div>
        )
    }

    const openPDS = (uri, size) => {
        if (uri) window.open(getPDSUrl(uri, release_id, size), '_blank')
    }

    // Matches the record Overview's Files card: badge, name + extension, path, actions.
    const renderRelatedCard = (label, Icon, uri, actions, stacked) => {
        const filename = getFilename(uri) || ''
        const extension = getExtension(uri)
        return (
            <div className={`${c.fileCard} ${stacked ? c.fileCardStacked : ''}`} key={label}>
                <div className={c.fileBadge}>
                    <Icon />
                </div>
                <div className={c.fileText}>
                    <div className={c.fileNameRow}>
                        <span className={c.fileName}>{label}</span>
                        {extension && <span className={c.fileExt}>{extension.toUpperCase()}</span>}
                    </div>
                    <div className={c.fileMeta} title={filename}>
                        <span className={c.fileMetaHead}>{filename.slice(0, -TAIL_CHARS)}</span>
                        <span className={c.fileMetaTail}>{filename.slice(-TAIL_CHARS)}</span>
                    </div>
                </div>
                <div className={c.fileActions}>{actions}</div>
            </div>
        )
    }

    const openAction = (uri, size) => {
        const filename = getFilename(uri)
        return (
            <Tooltip title={`Open ${filename}`} arrow>
                <IconButton
                    className={c.fileOpen}
                    aria-label={`open ${filename}`}
                    size="small"
                    onClick={() => openPDS(uri, size)}
                >
                    <OpenInNewIcon />
                </IconButton>
            </Tooltip>
        )
    }

    return (
        <div className={clsx(c.Preview, { [c.PreviewMobile]: isMobile, ['fade-in']: isMobile })}>
            {isMobile && (
                <>
                    <div className={clsx(c.navHeader)}>
                        <div>
                            <IconButton
                                className={c.backButton}
                                aria-label="back"
                                onClick={() => {
                                    if (showMobilePreview && setShowMobilePreview)
                                        setShowMobilePreview(false)
                                    // If preview was not forced (i.e. a final file)
                                    if (!showMobilePreview)
                                        dispatch(
                                            updateFilexColumn(null, {
                                                removePreview: true,
                                                active: null,
                                            })
                                        )
                                }}
                                size="large"
                            >
                                <ArrowBackIcon fontSize="small" />
                            </IconButton>
                        </div>
                        <div>
                            <Typography
                                noWrap
                                className={c.titleMobile}
                                title={preview.key}
                                variant="h5"
                            >
                                {preview.key}
                            </Typography>
                        </div>
                    </div>

                    {activeVersion != 0 && activeVersion != null && versions.length > 0 ? (
                        <div
                            className={c.headerBanner}
                            aria-label="go to latest version"
                            onClick={() => {
                                dispatch(goToFilexURI(versions[0].uri))
                            }}
                        >
                            <div>
                                <WarningIcon fontSize="small" />
                                <div>A newer version of this data product is available.</div>
                            </div>
                            <ArrowForwardIcon fontSize="small" />
                        </div>
                    ) : null}
                </>
            )}
            {!isMobile && (
                <div className={c.header}>
                    <div className={c.headerTitle}>
                        <div>
                            <Typography className={c.title} title={preview.key} variant="h5">
                                {preview.key}
                            </Typography>
                        </div>
                    </div>
                    <div className={c.headerRight}>
                        <ButtonBar preview={preview} related={related} />
                    </div>
                    {activeVersion != 0 && activeVersion != null && versions.length > 0 ? (
                        <div
                            className={c.headerBanner}
                            aria-label="go to latest version"
                            onClick={() => {
                                dispatch(goToFilexURI(versions[0].uri))
                            }}
                        >
                            <div>
                                <WarningIcon fontSize="small" />
                                <div>A newer version of this data product is available.</div>
                            </div>
                            <ArrowForwardIcon fontSize="small" />
                        </div>
                    ) : null}
                </div>
            )}
            <div className={clsx(c.body, { [c.bodyMobile]: isMobile })}>
                <div
                    className={c.image}
                    style={imageUrl == 'null' ? { height: '100px' } : {}}
                    onClick={() => {
                        if (imageUrl != null && preview.uri)
                            navigate(`${HASH_PATHS.record}?uri=${preview.uri}&back=page`)
                    }}
                >
                    {imageUrl != 'null' && hasBrowse !== false ? (
                        <Image
                            className={c.previewImage}
                            wrapperStyle={{
                                height: '100%',
                                paddingTop: 'unset',
                                position: 'initial',
                            }}
                            duration={250}
                            src={imageUrl}
                            alt={imageUrl}
                            errorIcon={
                                <ProductIcons
                                    filename={imageUrl}
                                    type={preview.fs_type}
                                    color="dark"
                                />
                            }
                            onLoad={() => {
                                setHasBrowse(true)
                            }}
                            onError={() => {
                                setHasBrowse(false)
                            }}
                        />
                    ) : (
                        <div className={c.imageless}>
                            <ProductIcons filename={imageUrl} type={preview.fs_type} color="dark" />
                        </div>
                    )}
                    <div className={c.imageCover}></div>
                </div>
                {isMobile && (
                    <div className={c.headerMobile}>
                        <div className={c.headerTop}>
                            <ButtonBar preview={preview} related={related} isMobile={true} />
                        </div>
                    </div>
                )}
                <div className={c.bodyInner}>
                    {/*
                        <div className={c.description}>
                            <div className={c.heading}>
                                <Typography noWrap className={c.title2} variant="subtitle2">
                                    Description
                                </Typography>
                                <Divider />
                            </div>
                            <div className={c.sectionBody}>
                                <Typography>
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce
                                    volutpat mi tincidunt nisi gravida tincidunt. Pellentesque a mattis
                                    purus. Sed rutrum, lectus at aliquet dapibus, ligula risus aliquet
                                    mi, id efficitur ex nulla quis augue. Fusce ultrices lectus in dui
                                    scelerisque maximus. Quisque id tristique arcu.
                                </Typography>
                            </div>
                        </div>
                    */}

                    {related && (
                        <>
                            <div className={c.heading}>Files</div>
                            <div className={c.fileCards}>
                                {getIn(related, 'uri') &&
                                    renderRelatedCard(
                                        'Product',
                                        InsertDriveFileOutlinedIcon,
                                        getIn(related, 'uri'),
                                        openAction(getIn(related, 'uri'))
                                    )}
                                {getIn(related, 'gather.pds_archive.related.label.uri') &&
                                    renderRelatedCard(
                                        'Label',
                                        DescriptionOutlinedIcon,
                                        getIn(related, 'gather.pds_archive.related.label.uri'),
                                        openAction(
                                            getIn(related, 'gather.pds_archive.related.label.uri')
                                        )
                                    )}
                                {hasBrowse === true &&
                                    getIn(related, 'gather.pds_archive.related.browse.uri') &&
                                    renderRelatedCard(
                                        'Browse',
                                        ImageOutlinedIcon,
                                        getIn(related, 'gather.pds_archive.related.browse.uri'),
                                        BROWSE_SIZES.map(([label, size]) => (
                                            <Button
                                                key={label}
                                                className={c.relatedButton}
                                                size="small"
                                                variant="outlined"
                                                endIcon={<LaunchIcon className={c.buttonIcon} />}
                                                onClick={() =>
                                                    openPDS(
                                                        getIn(
                                                            related,
                                                            'gather.pds_archive.related.browse.uri'
                                                        ),
                                                        size
                                                    )
                                                }
                                            >
                                                {label}
                                            </Button>
                                        )),
                                        true
                                    )}
                            </div>
                        </>
                    )}

                    <div className={c.properties}>
                        <div className={c.heading}>Properties</div>
                        <div className={clsx(c.sectionBody, c.card)}>
                            <ul className={c.propertiesList}>
                                {Object.keys(preview)
                                    .sort((a, b) => a.localeCompare(b))
                                    .map((key, idx) => {
                                        let value = preview[key]
                                        switch (key) {
                                            case 'size':
                                                value = humanFileSize(value, true)
                                                break
                                            default:
                                                break
                                        }
                                        let versionSelector = null
                                        if (
                                            key.toLowerCase().endsWith('version_id') &&
                                            versions.length > 0
                                        ) {
                                            versionSelector = (
                                                <div className={c.versionSelect}>
                                                    <FormControl
                                                        className={c.formControl}
                                                        size="small"
                                                    >
                                                        <Select
                                                            className={c.select}
                                                            onChange={(e) => {
                                                                dispatch(
                                                                    goToFilexURI(
                                                                        versions[e.target.value].uri
                                                                    )
                                                                )
                                                            }}
                                                            value={
                                                                activeVersion == null
                                                                    ? ''
                                                                    : activeVersion
                                                            }
                                                        >
                                                            {versions.map((v, idx) => {
                                                                return (
                                                                    <MenuItem
                                                                        className={
                                                                            c.versionSelectItem
                                                                        }
                                                                        key={idx}
                                                                        value={idx}
                                                                    >
                                                                        <div>{v.version}</div>
                                                                    </MenuItem>
                                                                )
                                                            })}
                                                        </Select>
                                                    </FormControl>
                                                </div>
                                            )
                                        }
                                        return (
                                            <li key={idx}>
                                                <div className={c.key}>{prettify(key)}</div>
                                                {versionSelector || (
                                                    <div
                                                        className={c.value}
                                                        title={`Click to copy: ${value}`}
                                                        onClick={() => {
                                                            copyToClipboard(value)
                                                        }}
                                                    >
                                                        {value}
                                                    </div>
                                                )}
                                            </li>
                                        )
                                    })}
                            </ul>
                        </div>
                    </div>

                    <SisResources
                        mission={mission}
                        instruments={preview.instrument}
                        headingClassName={c.heading}
                    />
                </div>
            </div>
        </div>
    )
}

Preview.propTypes = {}

export default Preview
