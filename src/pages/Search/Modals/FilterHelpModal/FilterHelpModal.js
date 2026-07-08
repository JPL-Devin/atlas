import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import {
    setModal,
    addActiveFilters,
    removeActiveFilters,
    search,
} from '../../../../core/redux/actions/actions.js'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import CloseSharpIcon from '@mui/icons-material/CloseSharp'

import { styled, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import FilterHelp from '../../../../components/FilterHelp/FilterHelp'
import { StyledDialog, ContentsMobile, Heading, ModalTitle as Title, CloseIconButton, FlexBetween } from '../../../../components/shared/ModalComponents'

const Contents = styled('div')(({ theme }) => ({
    background: theme.palette.primary.main,
    height: '100%',
    width: '800px',
    borderRadius: 0,
}))

const Content = styled(DialogContent)(({ theme }) => ({
    padding: '0px',
    height: `calc(100% - ${theme.headHeights[2]}px)`,
}))

const FilterHelpModal = (props) => {
    const {} = props

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

    const dispatch = useDispatch()
    const modal = useSelector((state) => {
        const m = state.getIn(['modals', 'filterHelp'])
        if (typeof m.toJS === 'function') return m.toJS()
        return m
    })
    const open = modal !== false
    const handleClose = () => {
        // close modal
        dispatch(setModal(false))
    }

    return (
        <StyledDialog
            fullScreen={isMobile}
            open={open}
            onClose={handleClose}
            aria-labelledby="responsive-dialog-title"
            PaperProps={{
                component: isMobile ? ContentsMobile : Contents,
            }}
        >
            <Heading>
                <FlexBetween>
                    <Title>
                        {modal?.filter?.display_name || modal?.filterKey} Filter Details
                    </Title>
                    <CloseIconButton
                        title="Close"
                        aria-label="close"
                        onClick={handleClose}
                        size="large">
                        <CloseSharpIcon fontSize="inherit" />
                    </CloseIconButton>
                </FlexBetween>
            </Heading>
            <Content>
                {open ? (
                    <FilterHelp
                        filter={modal.filter}
                        filterKey={modal.filterKey}
                    />
                ) : null}
            </Content>
        </StyledDialog>
    );
}

FilterHelpModal.propTypes = {}

export default FilterHelpModal
