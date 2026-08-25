import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { HASH_PATHS, ES_PATHS } from '../../../core/constants'

import { getIn, copyToClipboard, getPDSUrl, getFilename } from '../../../core/utils'

import { streamDownloadFile } from '../../../core/downloaders/ZipStream.js'
import { setSnackBarText } from '../../../core/redux/actions/actions'
import { getDownloadProducts } from '../../../core/recordDownloads'
import SplitButton from '../../../components/SplitButton/SplitButton'
import ViewTabs from '../Content/ViewTabs/ViewTabs'
import { getVisibleViewTabs } from '../viewTabs'

import { makeStyles } from '@mui/styles'

import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import LinkIcon from '@mui/icons-material/Link'

const useStyles = makeStyles((theme) => ({
    Title: {
        display: 'flex',
        justifyContent: 'space-between',
        height: theme.headHeights[1],
        boxSizing: 'border-box',
        background: theme.palette.swatches.grey.grey100,
        color: theme.palette.text.primary,
    },
    // The name is the only elastic item, so it yields space to the tabs.
    left: {
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
    },
    right: {
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        paddingLeft: '8px',
    },
    back: {},
    backButton: {
        padding: 2,
        borderRadius: 0,
    },
    backIcon: {
        fontSize: 36,
        color: theme.palette.text.primary,
    },
    name: {
        margin: `0px ${theme.spacing(1)}`,
        minWidth: 0,
    },
    nameTitle: {
        fontSize: 16,
        lineHeight: `${theme.headHeights[1]}px`,
        fontWeight: 'bold',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    copyLink: {},
    copyButton: {
        'padding': 10,
        'borderRadius': 0,
        'opacity': 0.65,
        'transition': 'opacity 0.2s ease-out',
        '&:hover': {
            opacity: 1,
        },
    },
    copyIcon: {
        fontSize: 20,
        color: theme.palette.text.primary,
    },
    downloadButton1: {
        height: 30,
        margin: '2px 3px',
        background: theme.palette.primary.light,
    },
    downloadButton2: {
        height: 30,
        margin: '2px 3px',
        color: theme.palette.text.secondary,
    },
    // Only the tabs without their own action row need a download here.
    splitButton: {
        margin: '4px 5px 3px 5px',
    },
    mlChip: {
        'height': '24px',
        'marginLeft': theme.spacing(1),
        'background': theme.palette.swatches.orange.orange600,
        'color': theme.palette.swatches.grey.grey800,
        'fontWeight': 'bold',
        'fontSize': '11px',
        '& .MuiChip-label': {
            padding: '0px 8px',
        },
    },
    mlChipsContainer: {
        display: 'flex',
        alignItems: 'center',
        minWidth: 0,
        gap: theme.spacing(0.5),
    },
}))

const Title = (props) => {
    const { mobile, recordData } = props

    const c = useStyles()

    const navigate = useNavigate()

    const dispatch = useDispatch()

    const recordViewTab = useSelector((state) => state.get('recordViewTab'))

    // Hidden Feature: Ctrl-Z to quickly go back to search. Could just use Alt <-
    useEffect(() => {
        const toSearch = (e) => {
            if (e.ctrlKey && e.key === 'z') navigate(HASH_PATHS.search)
        }
        document.addEventListener('keydown', toSearch)
        return () => {
            document.removeEventListener('keydown', toSearch)
        }
    }, [])

    // Extract unique ML classifications from ES data
    const mlClassifications = []
    const classificationsArray = getIn(recordData, ES_PATHS.ml_classifications, [])
    if (Array.isArray(classificationsArray) && classificationsArray.length > 0) {
        const uniqueClasses = new Set()
        classificationsArray.forEach((classification) => {
            const className = classification.class
            const confidence = classification.confidence
            // Only include classes with confidence > 0.5
            if (className && confidence > 0.5 && !uniqueClasses.has(className)) {
                uniqueClasses.add(className)
                mlClassifications.push({ class: className, confidence: confidence })
            }
        })
        // Sort by confidence descending
        mlClassifications.sort((a, b) => b.confidence - a.confidence)
    }

    // The Overview carries its own action row, so this bar only needs the
    // download and link affordances for the other tabs.
    const showActions = recordViewTab !== 'overview'
    const availableDownloadProducts = getDownloadProducts(recordData)

    const urlParams = new URLSearchParams(window.location.search)
    const back = urlParams.get('back')

    // The name and actions live in the metadata panel at phone width, so the
    // bar carries only the tabs.
    if (mobile) {
        return (
            <div className={c.Title}>
                <div className={c.left}></div>
                <div className={c.right}>
                    <ViewTabs
                        recordViewTab={recordViewTab}
                        VIEW_TABS={getVisibleViewTabs(recordData)}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className={c.Title}>
            <div className={c.left}>
                <div className={c.back}>
                    <Tooltip title={back == 'page' ? 'Back' : 'Back to Search'} arrow>
                        <IconButton
                            className={c.backButton}
                            aria-label={back === 'page' ? 'go back a page' : 'return to search'}
                            onClick={() => {
                                if (back === 'page') navigate(-1)
                                else navigate(HASH_PATHS.search)
                            }}
                            size="large"
                        >
                            <ChevronLeftIcon className={c.backIcon} />
                        </IconButton>
                    </Tooltip>
                </div>
                <div className={c.name}>
                    <div className={c.mlChipsContainer}>
                        <Typography
                            className={c.nameTitle}
                            variant="h2"
                            title={getIn(recordData, ES_PATHS.file_name, '--')}
                        >
                            {getIn(recordData, ES_PATHS.file_name, '--')}
                        </Typography>
                        {mlClassifications.length > 0 &&
                            mlClassifications.map((classification, idx) => (
                                <Chip
                                    key={idx}
                                    className={c.mlChip}
                                    label={`ML - ${classification.class}`}
                                    size="small"
                                />
                            ))}
                    </div>
                </div>
            </div>
            <div className={c.right}>
                {showActions && (
                    <>
                        <Tooltip title="Copy Link" arrow>
                            <IconButton
                                className={c.copyButton}
                                aria-label="copy link to record page"
                                onClick={() => {
                                    copyToClipboard(window.location.href)
                                    dispatch(setSnackBarText('Copied URL to clipboard!', 'success'))
                                }}
                                size="large"
                            >
                                <LinkIcon className={c.copyIcon} />
                            </IconButton>
                        </Tooltip>
                        <SplitButton
                            className={c.splitButton}
                            forceName="Download"
                            type="checklist"
                            items={availableDownloadProducts}
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
                    </>
                )}
                <ViewTabs
                    recordViewTab={recordViewTab}
                    VIEW_TABS={getVisibleViewTabs(recordData)}
                />
            </div>
        </div>
    )
}

Title.propTypes = {
    mobile: PropTypes.bool,
    recordData: PropTypes.object.isRequired,
}

export default Title
