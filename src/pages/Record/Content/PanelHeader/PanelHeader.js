import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'

import { makeStyles } from '@mui/styles'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LinkIcon from '@mui/icons-material/Link'

import { HASH_PATHS, ES_PATHS } from '../../../../core/constants'
import { getIn, copyToClipboard, getPDSUrl, getFilename } from '../../../../core/utils'
import { streamDownloadFile } from '../../../../core/downloaders/ZipStream.js'
import { addToCart, setSnackBarText } from '../../../../core/redux/actions/actions'
import { getDownloadProducts } from '../../../../core/recordDownloads'
import { getAppConfig } from '../../../../core/appConfig'
import SplitButton from '../../../../components/SplitButton/SplitButton'
import ViewTabs from '../ViewTabs/ViewTabs'
import { getVisibleViewTabs } from '../../viewTabs'
import { useRecordFilename } from '../../../../core/recordPresentation'
import { useFilenameSelection, FilenameName, FilenameDetails } from './FilenameLegend'

const useStyles = makeStyles((theme) => ({
    PanelHeader: {
        flexShrink: 0,
        boxSizing: 'border-box',
        background: theme.palette.swatches.grey.grey100,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
        // Stacked, the identity, actions and tabs lead the page, above the image.
        [theme.breakpoints.down('lg')]: {
            order: -2,
        },
    },
    // Title and its filename details share one white surface, ruled off from
    // the actions below.
    titleBlock: {
        background: theme.palette.swatches.grey.grey0,
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
    },
    // Same height as the actions and tab rows.
    identity: {
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        minWidth: 0,
        height: `${theme.headHeights[2]}px`,
        padding: '0 8px 0 4px',
    },
    copyName: {
        'flexShrink': 0,
        'padding': '4px',
        'color': theme.palette.swatches.grey.grey500,
        'transition': 'color 0.15s ease-out, background 0.15s ease-out',
        '&:hover': {
            color: theme.palette.swatches.grey.grey900,
            background: theme.palette.swatches.grey.grey150,
        },
        '& .MuiSvgIcon-root': {
            fontSize: '16px',
        },
    },
    name: {
        flex: 1,
        minWidth: 0,
    },
    // Missions without a filename spec fall back to plain text.
    plainName: {
        fontSize: '16px',
        fontWeight: 'bold',
        textAlign: 'center',
        wordBreak: 'break-all',
    },
    // Aligned with the panel body's gutters; the block itself carries the
    // bottom space so it can animate open and closed.
    details: {
        padding: '0 20px',
    },
    // Every control shares one compact size so the row fits the panel width.
    actions: {
        'display': 'flex',
        'alignItems': 'stretch',
        'justifyContent': 'center',
        'gap': '4px',
        'boxSizing': 'border-box',
        'height': `${theme.headHeights[2]}px`,
        'padding': '6px 8px',
        'borderBottom': `1px solid ${theme.palette.swatches.grey.grey200}`,
        '& .MuiButton-root': {
            fontSize: '12px',
            lineHeight: '16px',
            minWidth: 0,
            padding: '4px 8px',
            borderRadius: '2px',
            textTransform: 'none',
            whiteSpace: 'nowrap',
            transition: 'background 0.15s ease-out, border-color 0.15s ease-out',
        },
        '& .MuiButton-startIcon': {
            marginRight: '4px',
        },
        '& .MuiSvgIcon-root': {
            fontSize: '16px',
        },
    },
    cart: {
        flexShrink: 0,
    },
    download: {
        flexShrink: 0,
    },
    // Matches the label controls so the whole row reads as one set.
    copyAction: {
        'flexShrink': 0,
        'color': theme.palette.swatches.grey.grey700,
        'transition': 'background 0.15s ease-out, border-color 0.15s ease-out',
        'background': theme.palette.swatches.grey.grey0,
        'borderColor': theme.palette.swatches.grey.grey300,
        '&:hover': {
            borderColor: theme.palette.swatches.grey.grey500,
            background: theme.palette.swatches.grey.grey150,
        },
    },
    tabs: {
        height: `${theme.headHeights[2]}px`,
        background: theme.palette.swatches.grey.grey0,
    },
}))

const PanelHeader = (props) => {
    const { recordData, extraActions } = props

    const c = useStyles()

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const recordViewTab = useSelector((state) => state.get('recordViewTab'))

    // Missions with no filename spec have nothing to explain.
    const parsedFilename = useRecordFilename(getIn(recordData, ES_PATHS.file_name), recordData)
    const filenameSelection = useFilenameSelection(parsedFilename)

    // Hidden Feature: Ctrl-Z to quickly go back to search.
    useEffect(() => {
        const toSearch = (e) => {
            if (e.ctrlKey && e.key === 'z') navigate(HASH_PATHS.search)
        }
        document.addEventListener('keydown', toSearch)
        return () => {
            document.removeEventListener('keydown', toSearch)
        }
    }, [])

    const filename = getIn(recordData, ES_PATHS.file_name, '--')

    return (
        <div className={c.PanelHeader}>
            <div className={c.titleBlock}>
                <div className={c.identity}>
                    <div className={c.name}>
                        {parsedFilename != null ? (
                            <FilenameName selection={filenameSelection} />
                        ) : (
                            <div className={c.plainName} title={filename}>
                                {filename}
                            </div>
                        )}
                    </div>
                    <Tooltip title="Copy filename" arrow>
                        <IconButton
                            className={c.copyName}
                            aria-label="copy record filename"
                            size="small"
                            onClick={() => {
                                copyToClipboard(filename)
                                dispatch(setSnackBarText('Copied filename to clipboard!', 'success'))
                            }}
                        >
                            <ContentCopyIcon />
                        </IconButton>
                    </Tooltip>
                </div>
                {parsedFilename != null && (
                    <div className={c.details}>
                        <FilenameDetails parsed={parsedFilename} selection={filenameSelection} />
                    </div>
                )}
            </div>
            <div className={c.actions} aria-label="record actions">
                {extraActions}
                {getAppConfig().enableCart && (
                    <Button
                        className={c.cart}
                        variant="contained"
                        color="primary"
                        size="small"
                        aria-label="add record to cart"
                        startIcon={<AddShoppingCartIcon fontSize="small" />}
                        onClick={() => {
                            dispatch(
                                addToCart('image', {
                                    uri: getIn(recordData, ES_PATHS.uri),
                                    related: getIn(recordData, ES_PATHS.related),
                                    release_id: getIn(recordData, ES_PATHS.release_id),
                                })
                            )
                            dispatch(setSnackBarText('Added to Cart!', 'success'))
                        }}
                    >
                        Add to cart
                    </Button>
                )}
                <SplitButton
                    className={c.download}
                    forceName="Download"
                    ariaLabel="download record products"
                    type="checklist"
                    items={getDownloadProducts(recordData)}
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
                <Tooltip title="Copy link to this record" arrow>
                    <Button
                        className={c.copyAction}
                        variant="outlined"
                        size="small"
                        aria-label="copy link to record page"
                        startIcon={<LinkIcon fontSize="small" />}
                        onClick={() => {
                            copyToClipboard(window.location.href)
                            dispatch(setSnackBarText('Copied URL to clipboard!', 'success'))
                        }}
                    >
                        Copy Link
                    </Button>
                </Tooltip>
            </div>
            <div className={c.tabs}>
                <ViewTabs
                    recordViewTab={recordViewTab}
                    VIEW_TABS={getVisibleViewTabs(recordData)}
                />
            </div>
        </div>
    )
}

PanelHeader.propTypes = {
    recordData: PropTypes.object.isRequired,
    extraActions: PropTypes.node,
}

export default PanelHeader
