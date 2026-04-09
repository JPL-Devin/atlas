import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import { styled } from '@mui/material/styles'

import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'

import DownloadingCard from '../../../../../../components/DownloadingCard/DownloadingCard'
import { setSnackBarText } from '../../../../../../core/redux/actions/actions.js'
import { CSVCart } from '../../../../../../core/downloaders/CSV'

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

const CodeBlock = styled(Typography)(({ theme }) => ({
    background: theme.palette.swatches.grey.grey200,
    padding: theme.spacing(3),
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

function CSVTab(props) {
    const { value, index, selectorRef, selectionCount, ...other } = props

    const dispatch = useDispatch()

    const [isDownloading, setIsDownloading] = useState(false)
    const [onStop, setOnStop] = useState(false)
    const [downloadId, setDownloadId] = useState(0)
    const [status, setStatus] = useState(null)
    const [error, setError] = useState(null)

    const [datestamp, setDatestamp] = useState()

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
            role="csv-tab"
            hidden={value !== index}
            id={`scrollable-auto-csvtabpanel-${index}`}
            {...other}
        >
            {value === index && (
                <>
                    <Box p={3}>
                        <Typography variant="h5">CSV</Typography>
                        <Tooltip
                            title={selectionCount === 0 ? 'Select products above to download.' : ''}
                            arrow
                        >
                            <span>
                                <DownloadButton
                                    isDownloading={isDownloading}
                                    variant="contained"
                                    aria-label="csv download button"
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
                                                    CSVCart(
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
                                    {isDownloading ? 'Download in Progress' : 'Download CSV'}
                                </DownloadButton>
                            </span>
                        </Tooltip>
                        <StyledP>
                            Downloads a .csv named `./pdsimg-atlas_{datestamp}.csv` with the
                            following header:
                        </StyledP>
                        <CodeBlock>filename,size,uri,download_url</CodeBlock>
                        <StyledP>
                            The downloaded script files max out at 500k lines. Multiple script files
                            may be downloaded to support to entire payload.
                        </StyledP>
                    </Box>
                    <DownloadingWrapper>
                        <ErrorMessage isVisible={error != null}>{error}</ErrorMessage>
                        <DownloadingCard
                            downloadId={'csv' + downloadId}
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

CSVTab.propTypes = {}

export default CSVTab
