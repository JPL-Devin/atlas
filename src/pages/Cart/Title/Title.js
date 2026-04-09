import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'

import { styled } from '@mui/material/styles'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'

import { removeFromCart, setModal } from '../../../core/redux/actions/actions.js'

const TitleRoot = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    height: theme.headHeights[1],
    boxSizing: 'border-box',
    background: theme.palette.swatches.grey.grey100,
    color: theme.palette.text.primary,
    borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
}))

const TitleLeft = styled('div')({
    display: 'flex',
    justifyContent: 'space-between',
})

const TitleRight = styled('div')({
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 8px 4px 4px',
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

const NameTitle = styled(Typography)({
    fontSize: 18,
    lineHeight: '39px',
    fontWeight: 'bold',
})

const ActionButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontSize: '11px',
    lineHeight: '11px',
    margin: '3px 3px 3px 3px',
    background: theme.palette.accent.main,
}))

const Title = (props) => {
    const { mobile } = props

    const navigate = useNavigate()

    const dispatch = useDispatch()

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
            <TitleLeft>
                <BackWrapper>
                    <Tooltip title="Back" arrow>
                        <BackButton
                            aria-label="return"
                            onClick={() => {
                                navigate(-1)
                            }}
                            size="large"
                        >
                            <BackIcon />
                        </BackButton>
                    </Tooltip>
                </BackWrapper>
                <NameWrapper>
                    <NameTitle variant="h2">
                        Bulk Download Cart
                    </NameTitle>
                </NameWrapper>
            </TitleLeft>
            <TitleRight>
                <ActionButton
                    variant="contained"
                    aria-label="remove selected items button"
                    size="small"
                    onClick={() =>
                        dispatch(setModal('removeFromCart', { type: 'selected', index: 'checked' }))
                    }
                >
                    Remove Selected Items
                </ActionButton>
                <ActionButton
                    variant="contained"
                    aria-label="empty cart button"
                    size="small"
                    onClick={() =>
                        dispatch(setModal('removeFromCart', { type: 'all', index: 'all' }))
                    }
                >
                    Empty Cart
                </ActionButton>
            </TitleRight>
        </TitleRoot>
    )
}

Title.propTypes = {
    mobile: PropTypes.bool,
}

export default Title
