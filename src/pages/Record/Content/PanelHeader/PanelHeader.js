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

const useStyles = makeStyles((theme) => ({
    PanelHeader: {
        flexShrink: 0,
        boxSizing: 'border-box',
        background: theme.palette.swatches.grey.grey100,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
    },
    // The record's own surface, so the header reads as part of the panel.
    dark: {
        'background': theme.palette.swatches.grey.grey800,
        'color': theme.palette.swatches.grey.grey0,
        'borderBottom': `1px solid ${theme.palette.swatches.grey.grey700}`,
        '& .MuiTab-root': {
            color: theme.palette.swatches.grey.grey300,
        },
        '& .MuiTab-root.Mui-selected': {
            color: theme.palette.swatches.grey.grey0,
        },
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
    actions: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'nowrap',
        gap: '6px',
        overflowX: 'auto',
        padding: '6px 8px',
    },
    cart: {
        fontSize: '13px',
        textTransform: 'none',
        whiteSpace: 'nowrap',
    },
    copyLink: {
        'fontSize': '12px',
        'textTransform': 'none',
        'color': 'inherit',
        'opacity': 0.7,
        '&:hover': {
            opacity: 1,
            background: 'transparent',
        },
    },
    tabs: {
        height: `${theme.headHeights[2]}px`,
    },
}))

const PanelHeader = (props) => {
    const { recordData, dark, name, extraActions } = props

    const c = useStyles()

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const recordViewTab = useSelector((state) => state.get('recordViewTab'))

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
        <div className={`${c.PanelHeader} ${dark ? c.dark : ''}`}>
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
                    {name || (
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
                    <Button
                        className={c.copyLink}
                        aria-label="copy link to record page"
                        size="small"
                        startIcon={<LinkIcon fontSize="small" />}
                        onClick={() => {
                            copyToClipboard(window.location.href)
                            dispatch(setSnackBarText('Copied URL to clipboard!', 'success'))
                        }}
                    >
                        Copy link
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
    dark: PropTypes.bool,
    name: PropTypes.node,
    extraActions: PropTypes.node,
}

export default PanelHeader
