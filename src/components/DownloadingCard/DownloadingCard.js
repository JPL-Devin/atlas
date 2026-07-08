import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { styled } from '@mui/material/styles'

import moment from 'moment'

import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import LinearProgress from '@mui/material/LinearProgress'
import PauseIcon from '@mui/icons-material/Pause'
import PlayIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import Box from '@mui/material/Box'

import { abbreviateNumber } from '../../core/utils.js'

const DownloadingLinearProgress = styled(LinearProgress)(({ theme }) => ({
    '&.MuiLinearProgress-colorPrimary': {
        backgroundColor: theme.palette.swatches.grey.grey1500,
    },
    '& .MuiLinearProgress-bar': {
        backgroundColor: theme.palette.accent.main,
    },
    '& .MuiLinearProgress-bar2Buffer': {
        backgroundColor: theme.palette.swatches.blue.blue200,
    },
    '& .MuiLinearProgress-dashed': {
        backgroundImage: `radial-gradient(${theme.palette.swatches.grey.grey400} 0%, ${theme.palette.swatches.grey.grey400} 16%, transparent 42%)`,
    },
}))

const StatusPaper = styled(Paper)(({ theme }) => ({
    border: `1px solid ${theme.palette.swatches.grey.grey300}`,
}))

const StatusInner = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    padding: `${theme.spacing(1.5)} 0px`,
    height: '48px',
}))

const StatusLeft = styled('div')({
    width: '108px',
    position: 'relative',
    paddingLeft: 10,
    cursor: 'pointer',
})

const StatusProgress = styled('div')({
    'lineHeight': '48px',
    '&:hover': {
        opacity: 0,
    },
})

const StatusCount = styled('div')({
    'fontSize': 18,
    'position': 'absolute',
    'top': '0px',
    'lineHeight': '48px',
    'width': '100%',
    'background': 'white',
    'opacity': 0,
    '&:hover': {
        opacity: 1,
    },
})

const StatusRight = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isDone' && prop !== 'isHidden',
})(({ isDone, isHidden }) => ({
    width: '108px',
    display: 'flex',
    justifyContent: 'end',
    ...(isDone && {
        opacity: 0.5,
        pointerEvents: 'none',
    }),
    ...(isHidden && {
        display: 'none',
    }),
}))

const BlueButton = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'isHidden',
})(({ theme, isHidden }) => ({
    'fontSize': 30,
    'transition': 'color 0.2s ease-in-out',
    '&:hover': {
        color: theme.palette.accent.main,
    },
    ...(isHidden && {
        display: 'none',
    }),
}))

const RedButton = styled(IconButton)(({ theme }) => ({
    'fontSize': 30,
    'transition': 'color 0.2s ease-in-out',
    '&:hover': {
        color: theme.palette.swatches.red.red500,
    },
}))

const StoppedBar = styled('div')(({ theme }) => ({
    height: '4px',
    width: '100%',
    background: theme.palette.swatches.red.red500,
}))

const DoneBar = styled('div')(({ theme }) => ({
    height: '4px',
    width: '100%',
    background: theme.palette.swatches.green.green500,
}))

function DownloadingCard(props) {
    const { downloadId, status, controller, controllerType, onStop, hideActions, hidePause } = props

    const modes = {
        running: 'running',
        paused: 'paused',
        stopped: 'stopped',
        done: 'done',
    }
    const [mode, setMode] = useState(modes.running)

    // Restart mode when download id changes
    useEffect(() => {
        setMode(modes.running)
    }, [downloadId])

    // Transition to done mode when progress reaches 100%
    useEffect(() => {
        if (mode === modes.running && status?.overall.percent >= 100) {
            setMode(modes.done)
        }
    }, [status, mode])

    const pause = () => {
        if (controller) {
            switch (controllerType) {
                case 'zip':
                    controller.pause()
                    break
                default:
                    break
            }
            setMode(modes.paused)
        }
    }
    const resume = () => {
        if (controller) {
            switch (controllerType) {
                case 'zip':
                    controller.resume()
                    break
                default:
                    break
            }
            setMode(modes.running)
        }
    }
    const stop = () => {
        if (controller) {
            switch (controllerType) {
                case 'zip':
                    controller.closeWithMetadata()
                    break
                default:
                    break
            }
        }
        setMode(modes.stopped)
        if (typeof onStop === 'function') onStop()
    }

    if (status == null) return null

    let progressText
    let progressFontSize = 30
    switch (mode) {
        case modes.running:
            progressText = `${status.overall.percent.toFixed(2)}%`
            break
        case modes.paused:
            progressText = 'Paused'
            progressFontSize = 26
            break
        case modes.stopped:
            progressText = 'Stopped'
            progressFontSize = 22
            break
        case modes.done:
            progressText = 'Done'
            break
        default:
            progressText = mode
            break
    }

    let remaining = moment
        .utc(moment.duration(status.overall.estimatedTimeRemaining).as('milliseconds'))
        .format('HH:mm:ss')
    if (isNaN(status.overall.estimatedTimeRemaining)) remaining = 'Calculating'
    else if (status.overall.estimatedTimeRemaining < 0) remaining = '00:00:00'

    return (
        <StatusPaper elevation={0}>
            {mode === modes.running && (
                <DownloadingLinearProgress
                    variant="buffer"
                    value={status.overall.percent}
                    valueBuffer={status.overall.buffer}
                />
            )}
            {mode === modes.stopped && <StoppedBar />}
            {mode === modes.done && <DoneBar />}
            <StatusInner>
                <StatusLeft>
                    <StatusProgress style={{ fontSize: progressFontSize }}>
                        {progressText}
                    </StatusProgress>
                    <StatusCount>
                        {`${abbreviateNumber(status.overall.current)} / ${abbreviateNumber(
                            status.overall.total
                        )}`}
                    </StatusCount>
                </StatusLeft>
                <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ fontSize: 14, marginTop: '7px' }}>{`Elapsed: ${moment
                        .utc(moment.duration(status.overall.elapsedTime).as('milliseconds'))
                        .format('HH:mm:ss')}`}</Box>
                    <Box sx={{ fontSize: 14 }}>{`Remaining: ${
                        remaining == 'Invalid date' ? 'Calculating' : remaining
                    }`}</Box>
                </Box>
                <StatusRight
                    isDone={mode === modes.done || mode === modes.stopped}
                    isHidden={hideActions === true}
                >
                    <Tooltip title={`${mode === modes.paused ? 'Resume' : 'Pause'} Download`} arrow>
                        <BlueButton
                            isHidden={hidePause === true}
                            onClick={() => {
                                if (mode === modes.running) {
                                    pause()
                                } else if (mode === modes.paused) {
                                    resume()
                                }
                            }}
                            size="large"
                        >
                            {mode === modes.paused ? (
                                <PlayIcon fontSize="inherit" />
                            ) : (
                                <PauseIcon fontSize="inherit" />
                            )}
                        </BlueButton>
                    </Tooltip>

                    <Tooltip title="Stop Download" arrow>
                        <RedButton onClick={stop} size="large">
                            <StopIcon fontSize="inherit" />
                        </RedButton>
                    </Tooltip>
                </StatusRight>
            </StatusInner>
        </StatusPaper>
    )
}

DownloadingCard.propTypes = {}

export default DownloadingCard
