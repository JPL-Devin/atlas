import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import ReactMarkdown from 'react-markdown'

import { setModal } from '../../../../core/redux/actions/actions.js'

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

import { StyledDialog, ContentsMobile, Heading, ModalTitle as Title, CloseIconButton, FlexBetween } from '../../../../components/shared/ModalComponents'

const Contents = styled('div')(({ theme }) => ({
    background: theme.palette.primary.main,
    width: '480px',
    borderRadius: 0,
}))

const Content = styled(DialogContent)(({ theme }) => ({
    padding: `${theme.spacing(2)} ${theme.spacing(4)}`,
    height: `calc(100% - ${theme.headHeights[2]}px)`,
}))

const AdvancedFilterModal = (props) => {
    const {} = props

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

    const dispatch = useDispatch()
    const modal = useSelector((state) => {
        const m = state.getIn(['modals', 'advancedFilter'])
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
                        {modal?.filter?.display_name || modal?.filterKey} Advanced Filter Help
                    </Title>
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
                <ReactMarkdown>
                    {[
                        `Atlas' Advanced Filtering uses Elasticsearch's Query String (Apache's Lucene) query syntax:  \n`,
                        `https://www.elastic.co/guide/en/elasticsearch/reference/7.10/query-dsl-query-string-query.html#query-string-syntax  \n`,
                        `#### Shortcuts`,
                        `Submit Query: *ctrl/cmd + enter*  \n`,
                        `Autocomplete: *ctrl/cmd + shift*`,
                    ].join('\n')}
                </ReactMarkdown>
            </Content>
        </StyledDialog>
    )
}

AdvancedFilterModal.propTypes = {}

export default AdvancedFilterModal
