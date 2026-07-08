import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'

import { styled } from '@mui/material/styles'

import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

import { BackButton, BackIcon } from '../../../components/shared/PageComponents'

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

const TitleRight = styled('div')({
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 8px 4px 4px',
})


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
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
                <NameWrapper>
                    <NameTitle variant="h2">
                        Bulk Download Cart
                    </NameTitle>
                </NameWrapper>
            </Box>
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
