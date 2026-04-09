import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { HASH_PATHS, ES_PATHS, RELATED_MAPPINGS } from '../../../core/constants'

import {
    getIn,
    copyToClipboard,
    humanFileSize,
    getExtension,
    sortRelatedKeys,
    getPDSUrl,
    getFilename,
} from '../../../core/utils'

import { streamDownloadFile } from '../../../core/downloaders/ZipStream.js'
import { addToCart, setSnackBarText } from '../../../core/redux/actions/actions'
import SplitButton from '../../../components/SplitButton/SplitButton'

import { styled } from '@mui/material/styles'

import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import LinkIcon from '@mui/icons-material/Link'
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart'

const TitleRoot = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    height: theme.headHeights[1],
    boxSizing: 'border-box',
    background: theme.palette.swatches.grey.grey100,
    color: theme.palette.text.primary,
}))

const LeftSection = styled('div')({
    display: 'flex',
    justifyContent: 'space-between',
})

const RightSection = styled('div')({
    display: 'flex',
    justifyContent: 'space-between',
    padding: '2px 8px 4px 4px',
})

const BackWrapper = styled('div')({})

const BackButton = styled(IconButton)({
    padding: 2,
    borderRadius: 0,
})

const BackIcon = styled(ChevronLeftIcon)(({ theme }) => ({
    fontSize: 36,
    color: theme.palette.text.primary,
}))

const NameWrapper = styled('div')(({ theme }) => ({
    margin: `0px ${theme.spacing(1)}`,
}))

const NameTitle = styled(Typography)(({ theme }) => ({
    fontSize: 16,
    lineHeight: `${theme.headHeights[1]}px`,
    fontWeight: 'bold',
}))

const CopyLinkWrapper = styled('div')({})

const CopyButton = styled(IconButton)({
    'padding': 10,
    'borderRadius': 0,
    'opacity': 0.5,
    'transition': 'opacity 0.2s ease-out',
    '&:hover': {
        opacity: 1,
    },
})

const CopyIcon = styled(LinkIcon)(({ theme }) => ({
    fontSize: 20,
    color: theme.palette.text.primary,
}))

const StyledSplitButton = styled(SplitButton)(({ theme }) => ({
    margin: '4px 5px 3px 5px',
    [theme.breakpoints.down('md')]: {
        display: 'none',
    },
}))

const StyledDivider = styled(Divider)(({ theme }) => ({
    background: theme.palette.swatches.grey.grey200,
    margin: `${theme.spacing(0.5)} ${theme.spacing(2)}`,
}))

const AddToCartButton = styled(IconButton)(({ theme }) => ({
    width: 34,
    height: 34,
    padding: 6,
    borderRadius: 0,
    color: theme.palette.accent.main,
}))

const Title = (props) => {
    const { mobile, recordData } = props

    const navigate = useNavigate()

    const dispatch = useDispatch()

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

    const [snackbar, setSnackbar] = useState({ open: false, message: '' })

    const handleOpenSnackbar = (message) => {
        setSnackbar({ open: true, message: message })
    }

    const handleCloseSnackbar = (e, reason) => {
        if (reason === 'clickaway') return
        setSnackbar({ open: false, message: '' })
    }
    const release_id = getIn(recordData, ES_PATHS.release_id)

    let availableDownloadProducts = []
    const related = getIn(recordData, ES_PATHS.related, {})
    if (related.src == null) related.src = {}

    const ml_classification_related = getIn(recordData, ES_PATHS.ml_classification_related, {})
    if (ml_classification_related.overlay)
        related.ml_classifier_features = ml_classification_related.overlay
    if (ml_classification_related.label)
        related.ml_classifier_label = ml_classification_related.label

    sortRelatedKeys(Object.keys(related)).forEach((key) => {
        const uri = key === 'src' ? getIn(recordData, ES_PATHS.source) : related[key].uri
        const size = humanFileSize(related[key].size)
        availableDownloadProducts.push({
            name: RELATED_MAPPINGS[key] || key,
            subname: `.${getExtension(uri)}${size ? ` (${size})` : ''}`,
            uri,
            checked: key === 'src' ? true : false,
            release_id: release_id,
        })
    })

    const urlParams = new URLSearchParams(window.location.search)
    const back = urlParams.get('back')

    if (mobile) {
        return (
            <TitleRoot>
                <div className="left"></div>
                <div className="right"></div>
            </TitleRoot>
        )
    }

    return (
        <TitleRoot>
            <LeftSection>
                <BackWrapper>
                    <Tooltip title={back == 'page' ? 'Back' : 'Back to Search'} arrow>
                        <BackButton
                            aria-label={back === 'page' ? 'go back a page' : 'return to search'}
                            onClick={() => {
                                if (back === 'page') navigate(-1)
                                else navigate(HASH_PATHS.search)
                            }}
                            size="large">
                            <BackIcon />
                        </BackButton>
                    </Tooltip>
                </BackWrapper>
                <NameWrapper>
                    <NameTitle variant="h2">
                        {getIn(recordData, ES_PATHS.file_name, '--')}
                    </NameTitle>
                </NameWrapper>
                <CopyLinkWrapper>
                    <Tooltip title="Copy Link" arrow>
                        <CopyButton
                            aria-label="copy link to record page"
                            onClick={() => {
                                copyToClipboard(window.location.href)
                                handleOpenSnackbar('Copied URL to clipboard!')
                            }}
                            size="large">
                            <CopyIcon />
                        </CopyButton>
                    </Tooltip>
                </CopyLinkWrapper>
            </LeftSection>
            <RightSection>
                <StyledSplitButton
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
                <StyledDivider orientation="vertical" flexItem />
                <Tooltip title="Add to Cart" arrow>
                    <AddToCartButton
                        aria-label="add current image to cart button"
                        size="small"
                        onClick={() => {
                            dispatch(
                                addToCart('image', {
                                    uri: getIn(recordData, ES_PATHS.source),
                                    related: getIn(recordData, ES_PATHS.related),
                                    release_id: getIn(recordData, ES_PATHS.release_id),
                                })
                            )
                            dispatch(setSnackBarText('Added to Cart!', 'success'))
                        }}
                    >
                        <AddShoppingCartIcon size="small" />
                    </AddToCartButton>
                </Tooltip>
            </RightSection>
        </TitleRoot>
    );
}

Title.propTypes = {
    mobile: PropTypes.bool,
    recordData: PropTypes.object.isRequired,
}

export default Title
