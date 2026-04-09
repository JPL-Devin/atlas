import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import {
    setModal,
    setResultsTableColumns,
    clearResults,
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

import LabelsTree from './subcomponents/LabelsTree/LabelsTree'

const StyledDialog = styled(Dialog)(({ theme }) => ({
    margin: theme.headHeights[1],
    height: `calc(100% - ${theme.headHeights[1] * 2}px)`,
    [theme.breakpoints.down('sm')]: {
        margin: '6px',
        height: `calc(100% - 12px)`,
    },
}))

const Contents = styled('div')(({ theme }) => ({
    background: theme.palette.primary.main,
    height: '100%',
    maxWidth: '1500px',
    minWidth: '800px',
    overflow: 'hidden',
}))

const Heading = styled(DialogTitle)(({ theme }) => ({
    height: theme.headHeights[2],
    boxSizing: 'border-box',
    background: theme.palette.swatches.grey.grey150,
    padding: `0 ${theme.spacing(2)} 0 ${theme.spacing(4)}`,
}))

const Title = styled('div')(({ theme }) => ({
    padding: `${theme.spacing(2.5)} 0`,
    fontSize: theme.typography.pxToRem(16),
    fontWeight: 'bold',
}))

const Content = styled(DialogContent)(({ theme }) => ({
    padding: '0px',
    height: `calc(100% - ${theme.headHeights[2]}px)`,
}))

const CloseIconButton = styled(IconButton)(({ theme }) => ({
    padding: theme.spacing(1.5),
    height: '100%',
    margin: '4px 0px',
}))

const FlexBetween = styled('div')({
    display: 'flex',
    justifyContent: 'space-between',
})

const ActionButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontSize: '11px',
    lineHeight: '20px',
    margin: '3px 3px',
    background: theme.palette.accent.main,
}))

const ResetButton = styled(ActionButton)(({ theme }) => ({
    'background': theme.palette.swatches.grey.grey800,
    '&:hover': {
        background: theme.palette.swatches.black.black0,
    },
}))

const CancelButton = styled(ActionButton)(({ theme }) => ({
    'background': theme.palette.swatches.grey.grey800,
    '&:hover': {
        background: theme.palette.swatches.black.black0,
    },
}))

const EditColumnsModal = (props) => {
    const {} = props

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

    const dispatch = useDispatch()
    const open = useSelector((state) => {
        return state.getIn(['modals', 'editColumns'])
    })

    let resultsTable = useSelector((state) => {
        return state.getIn(['resultsTable'])
    })
    if (typeof resultsTable.toJS === 'function') resultsTable = resultsTable.toJS()

    const [columns, setColumns] = useState(resultsTable.columns || [])

    const handleReset = () => {
        dispatch(setResultsTableColumns(resultsTable.defaultColumns))
        setColumns(resultsTable.defaultColumns)
    }
    const handleClose = () => {
        setColumns(resultsTable.columns)
        // close modal
        dispatch(setModal(false))
    }
    const handleSubmit = () => {
        dispatch(setResultsTableColumns(columns))
        dispatch(clearResults())
        dispatch(search())
        // close modal
        dispatch(setModal(false))
    }

    return (
        <StyledDialog
            fullScreen={isMobile}
            open={open}
            onClose={handleClose}
            PaperProps={{
                component: Contents,
            }}
        >
            <Heading>
                <FlexBetween>
                    <Title>Edit Product Label Columns</Title>
                    <CloseIconButton
                        title="Close"
                        aria-label="close"
                        onClick={handleClose}
                        size="large"
                    >
                        <CloseSharpIcon fontSize="inherit" />
                    </CloseIconButton>
                </FlexBetween>
            </Heading>
            <Content>
                <LabelsTree columns={columns} setColumns={setColumns} />
            </Content>
            <DialogActions>
                <div>
                    <ResetButton
                        variant="contained"
                        onClick={handleReset}
                    >
                        Reset to Defaults
                    </ResetButton>
                </div>
                <div>
                    <CancelButton
                        variant="contained"
                        onClick={handleClose}
                    >
                        Cancel
                    </CancelButton>
                    <ActionButton variant="contained" onClick={handleSubmit}>
                        Apply Changes
                    </ActionButton>
                </div>
            </DialogActions>
        </StyledDialog>
    )
}

EditColumnsModal.propTypes = {}

export default EditColumnsModal
