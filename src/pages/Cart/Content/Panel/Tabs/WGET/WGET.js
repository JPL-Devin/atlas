import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import { styled } from '@mui/material/styles'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'

import DownloadingCard from '../../../../../../components/DownloadingCard/DownloadingCard'
import { setSnackBarText } from '../../../../../../core/redux/actions/actions.js'
import { WGETCart } from '../../../../../../core/downloaders/WGET'

import Box from '@mui/material/Box'

const DownloadButton = styled(Button, {
    shouldForwardProp: (prop) => prop !== 'isDownloading',
})(({ theme, isDownloading }) => ({
    height: 30,
    width: '100%',
    margin: '7px 0px',
    background: theme.palette.primary.light,
    ...(isDownloading && {
        background: theme.palette.swatches.grey.grey300,
        color: theme.palette.text.primary,
        pointerEvents: 'none',
    }),
}))

const StyledP = styled(Typography)(({ theme }) => ({
    padding: `${theme.spacing(1.5)} 0px`,
}))

const StyledP2 = styled(Typography)(({ theme }) => ({
    fontWeight: 'bold',
    padding: `${theme.spacing(1.5)} 0px`,
}))

const StyledP3 = styled(Typography)(({ theme }) => ({
    color: theme.palette.swatches.blue.blue900,
    padding: `${theme.spacing(1.5)} 0px`,
    fontWeight: 'bold',
    fontSize: '13px',
}))

const CodeBlock = styled(Typography)(({ theme }) => ({
    background: theme.palette.swatches.grey.grey200,
    padding: theme.spacing(4),
    fontFamily: 'monospace',
    marginBottom: '5px',
}))

const DownloadingWrapper = styled('div')({
    bottom: '0px',
    position: 'sticky',
    width: '100%',
    padding: '12px',
    boxSizing: 'border-box',
})

const ErrorMessage = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isVisible',
})(({ theme, isVisible }) => ({
    display: 'none',
    fontSize: '16px',
    padding: '12px',
    background: theme.palette.swatches.red.red500,
    color: theme.palette.text.secondary,
    border: `1px solid ${theme.palette.swatches.red.red600}`,
    textAlign: 'center',
    ...(isVisible && {
        display: 'block',
    }),
}))

function WGETTab(props) {
    const { value, index, selectorRef, selectionCount, ...other } = props

    const dispatch = useDispatch()

    const [isDownloading, setIsDownloading] = useState(false)
    const [onStop, setOnStop] = useState(false)
    const [downloadId, setDownloadId] = useState(0)
    const [status, setStatus] = useState(null)
    const [error, setError] = useState(null)

    const [datestamp, setDatestamp] = useState('{datestamp}')

    const prevIsDownloadingRef = useRef(isDownloading)

    useEffect(() => {
        // Detect transition from downloading to not downloading
        if (prevIsDownloadingRef.current === true && isDownloading === false && status != null) {
            const nextStatus = {
                ...status,
                overall: {
                    ...status.overall,
                    percent: 100,
                    current: status.overall.total,
                },
            }
            setStatus(nextStatus)
        }
        prevIsDownloadingRef.current = isDownloading
    }, [isDownloading, status])

    return (
        <div
            role="wget-tab"
            hidden={value !== index}
            id={`scrollable-auto-wgettabpanel-${index}`}
            {...other}
        >
            {value === index && (
                <>
                    <Box p={3}>
                        <Typography variant="h5">WGET</Typography>
                        <Tooltip
                            title={selectionCount === 0 ? 'Select products above to download.' : ''}
                            arrow
                        >
                            <span>
                                <DownloadButton
                                    isDownloading={isDownloading}
                                    variant="contained"
                                    aria-label="wget download button"
                                    disabled={selectionCount === 0}
                                    onClick={() => {
                                        if (selectorRef && selectorRef.current) {
                                            const sel = selectorRef.current.getSelected() || {}
                                            if (sel.length == 0) {
                                                dispatch(
                                                    setSnackBarText(
                                                        'Please select products to download',
                                                        'warning'
                                                    )
                                                )
                                            } else {
                                                setIsDownloading(true)
                                                setDownloadId(downloadId + 1)
                                                setError(null)
                                                const datestamp = new Date()
                                                    .toISOString()
                                                    .replace(/:/g, '_')
                                                    .replace(/\./g, '_')
                                                    .replace(/Z/g, '')
                                                dispatch(
                                                    WGETCart(
                                                        setStatus,
                                                        setIsDownloading,
                                                        setOnStop,
                                                        sel,
                                                        datestamp
                                                    )
                                                )
                                                setDatestamp(datestamp)
                                            }
                                        }
                                    }}
                                >
                                    {isDownloading
                                        ? 'Download in Progress'
                                        : 'Download WGET Script'}
                                </DownloadButton>
                            </span>
                        </Tooltip>
                        <StyledP2>Download notes:</StyledP2>
                        <StyledP>
                            The downloaded script will contain a set of pre-configured WGET commands
                            that you can execute on your computer system.
                        </StyledP>
                        <StyledP3>WGET Software:</StyledP3>
                        <StyledP>
                            WGET is software that allows one to download internet content using a
                            command line interface. Availability and installation of wget varies
                            between operating systems. Please verify that wget is available for your
                            computer system and is installed.
                        </StyledP>
                        <StyledP3>WGET Script File Size Limit:</StyledP3>
                        <StyledP>
                            The downloaded script files max out at 500k lines. Multiple script files
                            may be downloaded to support the entire payload.
                        </StyledP>
                        <StyledP3>Downloaded Products Directory:</StyledP3>
                        <StyledP>
                            After script execution, you can find all the downloaded products in a
                            directory named:
                        </StyledP>
                        <CodeBlock>
                            ./pdsimg-atlas-wget_&#123;datestamp&#125;
                        </CodeBlock>
                        <StyledP>
                            This directory will be created in your shell's current working
                            directory. If you are using a Windows machine, you may need to run the
                            script in a Windows Subsystem for Linux (WSL) environment.
                        </StyledP>
                        <StyledP2>Operating System Instructions:</StyledP2>
                        <StyledP3>Mac / Linux / Windows (WSL):</StyledP3>
                        <StyledP>
                            After downloading, open a shell window and change directory to the
                            location where the script was downloaded and then execute the
                            "pdsimg-atlas-wget_{datestamp}.sh" script using the following command:
                            <br />
                        </StyledP>
                        <CodeBlock>
                            source pdsimg-atlas-wget_{datestamp}.sh
                        </CodeBlock>
                    </Box>
                    <DownloadingWrapper>
                        <ErrorMessage isVisible={error != null}>{error}</ErrorMessage>
                        <DownloadingCard
                            downloadId={'wget' + downloadId}
                            status={status}
                            hidePause={true}
                            onStop={onStop}
                        />
                    </DownloadingWrapper>
                </>
            )}
        </div>
    )
}

WGETTab.propTypes = {}

export default WGETTab
