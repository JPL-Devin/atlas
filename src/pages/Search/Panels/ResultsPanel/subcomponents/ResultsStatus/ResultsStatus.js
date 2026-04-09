import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { setFieldState } from '../../../../../../core/redux/actions/actions'

import { getIn, capitalize, prettify, isObject, objectToString } from '../../../../../../core/utils'
import { resultsStatuses } from '../../../../../../core/constants'

import { styled } from '@mui/material/styles'

import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Tooltip from '@mui/material/Tooltip'

import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const ResultsStatusRoot = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isHidden',
})(({ isHidden }) => ({
    'position': 'absolute',
    'top': 0,
    'width': '100%',
    'height': '100%',
    'transition': 'all 0.2s ease-out',
    '& > div': {
        transition: 'background 0.4s ease-out',
    },
    '& > div > div': {
        transition: 'background 0.4s ease-out',
    },
    ...(isHidden && {
        pointerEvents: 'none',
        opacity: 0,
    }),
}))

const StatusPaper = styled(Paper)(({ theme }) => ({
    'position': 'absolute',
    'top': '50%',
    'left': '50%',
    'transform': 'translateX(-50%) translateY(-50%)',
    'background': theme.palette.primary.main,
    '& > div': {
        padding: `${theme.spacing(4)} ${theme.spacing(6)}`,
    },
}))

const Waiting = styled('div')(({ theme }) => ({
    background: theme.palette.swatches.grey.grey100,
    fontSize: '16px',
    paddingBottom: theme.spacing(0.5),
}))

const WaitingTitle = styled('div')(({ theme }) => ({
    'display': 'flex',
    'justifyContent': 'center',
    'fontSize': '16px',
    'fontWeight': 'bold',
    'marginBottom': theme.spacing(1.5),
    '& > div': {
        marginLeft: theme.spacing(1.5),
    },
}))

const WaitingMessage = styled('div')({
    textAlign: 'center',
    margin: '0px 5%',
    maxWidth: '340px',
})

const Searching = styled('div')(({ theme }) => ({
    background: theme.palette.accent.main,
    fontSize: '16px',
    color: theme.palette.text.secondary,
    paddingBottom: theme.spacing(0.5),
}))

const SearchingProgress = styled('div')(({ theme }) => ({
    'display': 'flex',
    'justifyContent': 'center',
    'marginTop': theme.spacing(1),
    'marginBottom': theme.spacing(4),
    '& .MuiCircularProgress-colorPrimary': {
        color: theme.palette.text.secondary,
    },
}))

const SearchingMessage = styled('div')({
    fontWeight: 'bold',
    fontSize: '16px',
    textTransform: 'uppercase',
})

const Loading = styled('div')(({ theme }) => ({
    position: 'absolute',
    top: `-${theme.headHeights[1] * 2 + 1}px`,
    width: '100%',
}))

const LoadingProgress = styled('div')(({ theme }) => ({
    'width': '100%',
    'height': '2px',
    'overflow': 'hidden',
    '& .MuiLinearProgress-colorPrimary': {
        background: 'transparent',
    },
    '& .MuiLinearProgress-barColorPrimary': {
        background: theme.palette.accent.main,
    },
}))

const None = styled('div')(({ theme }) => ({
    background: theme.palette.swatches.yellow.yellow700,
    fontSize: '16px',
    paddingBottom: theme.spacing(0.5),
}))

const NoneTitle = styled('div')(({ theme }) => ({
    'display': 'flex',
    'justifyContent': 'center',
    'fontSize': '24px',
    'fontWeight': 'bold',
    'marginBottom': theme.spacing(1.5),
    '& > div': {
        marginLeft: theme.spacing(1.5),
    },
}))

const NoneMessage = styled('div')({
    textAlign: 'center',
    margin: '0px 5%',
    maxWidth: '500px',
})

const ErrorStatus = styled('div')(({ theme }) => ({
    background: theme.palette.swatches.red.red500,
    fontSize: '16px',
    color: theme.palette.text.primary,
    paddingBottom: theme.spacing(0.5),
}))

const ErrorTitle = styled('div')(({ theme }) => ({
    'display': 'flex',
    'justifyContent': 'center',
    'fontSize': '24px',
    'fontWeight': 'bold',
    'marginBottom': theme.spacing(1.5),
    '& > div': {
        marginLeft: theme.spacing(1.5),
    },
}))

const ErrorMessage = styled('div')({
    textAlign: 'center',
    margin: '0px 5%',
    maxWidth: '600px',
})

const ResultsStatus = (props) => {
    const dispatch = useDispatch()

    const resultsStatus = useSelector((state) => {
        return state.getIn(['resultsStatus'])
    }).toJS()

    let inner = null
    let outer = null
    let isHidden = false

    switch (resultsStatus.status) {
        case resultsStatuses.WAITING:
            inner = (
                <Waiting>
                    <WaitingTitle>
                        <ArrowBackIcon />
                        <div>Search for Imagery</div>
                    </WaitingTitle>
                    <WaitingMessage>
                        To begin, narrow your query down using the filters provided on the left.
                    </WaitingMessage>
                </Waiting>
            )
            break
        case resultsStatuses.SEARCHING:
            inner = (
                <Searching>
                    <SearchingProgress>
                        <CircularProgress size={36} />
                    </SearchingProgress>
                    <SearchingMessage>Searching</SearchingMessage>
                </Searching>
            )
            break
        case resultsStatuses.LOADING:
            outer = (
                <Loading>
                    <LoadingProgress>
                        <LinearProgress />
                    </LoadingProgress>
                </Loading>
            )
            break
        case resultsStatuses.NONE:
            inner = (
                <None>
                    <NoneTitle>
                        <ReportProblemOutlinedIcon fontSize="large" />
                        <div>No Records Found</div>
                    </NoneTitle>
                    <NoneMessage>
                        If you were expecting to see some records, review your query or remove
                        filters to broaden the search.
                    </NoneMessage>
                </None>
            )
            break
        case resultsStatuses.SUCCESSFUL:
            isHidden = true
            break
        case resultsStatuses.ERROR:
            inner = (
                <ErrorStatus>
                    <ErrorTitle>
                        <Tooltip title={resultsStatus.message?.error} arrow placement="left-end">
                            <ErrorOutlineOutlinedIcon fontSize="large" />
                        </Tooltip>
                        <div>Search Error</div>
                    </ErrorTitle>
                    <ErrorMessage>
                        We encountered an error while trying to search our imaging archive, please
                        try again. If the issue persists, please contact a site administrator.
                    </ErrorMessage>
                </ErrorStatus>
            )
            break
        default:
            break
    }

    return (
        <ResultsStatusRoot isHidden={isHidden}>
            {outer}
            <StatusPaper elevation={2}>
                {inner}
            </StatusPaper>
        </ResultsStatusRoot>
    )
}

ResultsStatus.propTypes = {}

export default ResultsStatus
