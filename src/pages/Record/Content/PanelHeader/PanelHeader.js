import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'

import { makeStyles } from '@mui/styles'

import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
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
import { parseRecordFilename } from '../../../../core/recordPresentation'
import { useFilenameSelection, FilenameName, FilenameDetails } from './FilenameLegend'

const useStyles = makeStyles((theme) => ({
    PanelHeader: {
        flexShrink: 0,
        boxSizing: 'border-box',
        background: theme.palette.swatches.grey.grey100,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
    },
    identity: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        minWidth: 0,
        padding: '4px 8px 0 4px',
    },
    backButton: {
        padding: 2,
        borderRadius: 0,
        color: 'inherit',
        flexShrink: 0,
    },
    backIcon: {
        fontSize: 30,
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
    chips: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flexShrink: 0,
    },
    mlChip: {
        'height': '22px',
        'background': theme.palette.swatches.orange.orange600,
        'color': theme.palette.swatches.grey.grey800,
        'fontWeight': 'bold',
        'fontSize': '11px',
        '& .MuiChip-label': {
            padding: '0px 8px',
        },
    },
    details: {
        padding: '0 8px',
    },
    // Every control shares one compact size so the row fits the panel width.
    actions: {
        'display': 'flex',
        'alignItems': 'stretch',
        'justifyContent': 'center',
        'gap': '4px',
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
    cart: {
        flexShrink: 0,
    },
    download: {
        flexShrink: 0,
    },
    copyLink: {
        'padding': '2px',
        'borderRadius': '2px',
        'color': 'inherit',
        'opacity': 0.7,
        'flexShrink': 0,
        '&:hover': {
            opacity: 1,
        },
        '& .MuiSvgIcon-root': {
            fontSize: '18px',
        },
    },
    tabs: {
        height: `${theme.headHeights[2]}px`,
    },
}))

const PanelHeader = (props) => {
    const { recordData, extraActions } = props

    const c = useStyles()

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const recordViewTab = useSelector((state) => state.get('recordViewTab'))

    // Missions with no filename spec have nothing to explain.
    const parsedFilename = parseRecordFilename(getIn(recordData, ES_PATHS.file_name), recordData)
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

    const back = new URLSearchParams(window.location.search).get('back')

    // Only confident classifications are worth a chip.
    const mlChips = []
    const classifications = getIn(recordData, ES_PATHS.ml_classifications, [])
    if (Array.isArray(classifications)) {
        classifications.forEach((classification) => {
            const className = classification.class
            if (
                className &&
                classification.confidence > 0.5 &&
                !mlChips.some((chip) => chip.class === className)
            )
                mlChips.push({ class: className, confidence: classification.confidence })
        })
        mlChips.sort((a, b) => b.confidence - a.confidence)
    }

    return (
        <div className={c.PanelHeader}>
            <div className={c.identity}>
                <Tooltip title={back === 'page' ? 'Back' : 'Back to Search'} arrow>
                    <IconButton
                        className={c.backButton}
                        aria-label={back === 'page' ? 'go back a page' : 'return to search'}
                        onClick={() => {
                            if (back === 'page') navigate(-1)
                            else navigate(HASH_PATHS.search)
                        }}
                    >
                        <ChevronLeftIcon className={c.backIcon} />
                    </IconButton>
                </Tooltip>
                <div className={c.name}>
                    {parsedFilename != null ? (
                        <FilenameName selection={filenameSelection} />
                    ) : (
                        <div
                            className={c.plainName}
                            title={getIn(recordData, ES_PATHS.file_name, '--')}
                        >
                            {getIn(recordData, ES_PATHS.file_name, '--')}
                        </div>
                    )}
                </div>
                {mlChips.length > 0 && (
                    <div className={c.chips}>
                        {mlChips.map((chip, idx) => (
                            <Chip
                                key={idx}
                                className={c.mlChip}
                                label={`ML - ${chip.class}`}
                                size="small"
                            />
                        ))}
                    </div>
                )}
            </div>
            <div className={c.actions} aria-label="record actions">
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
                {extraActions}
                <Tooltip title="Copy link to this record" arrow>
                    <IconButton
                        className={c.copyLink}
                        aria-label="copy link to record page"
                        size="small"
                        onClick={() => {
                            copyToClipboard(window.location.href)
                            dispatch(setSnackBarText('Copied URL to clipboard!', 'success'))
                        }}
                    >
                        <LinkIcon />
                    </IconButton>
                </Tooltip>
            </div>
            {parsedFilename != null && (
                <div className={c.details}>
                    <FilenameDetails parsed={parsedFilename} selection={filenameSelection} />
                </div>
            )}
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
