import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'

import DownloadingCard from '../../../../../../components/DownloadingCard/DownloadingCard'
import { DownloadButton, StyledP, DownloadingWrapper, ErrorMessage } from '../../../../../../components/shared/CartDownloadComponents'
import { setSnackBarText } from '../../../../../../core/redux/actions/actions.js'
import { TXTCart } from '../../../../../../core/downloaders/TXT'

import Box from '@mui/material/Box'

function TXTTab(props) {
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
            role="txt-tab"
            hidden={value !== index}
            id={`scrollable-auto-txttabpanel-${index}`}
            {...other}
        >
            {value === index && (
                <>
                    <Box p={3}>
                        <Typography variant="h5">TXT</Typography>
                        <Tooltip
                            title={selectionCount === 0 ? 'Select products above to download.' : ''}
                            arrow
                        >
                            <span>
                                <DownloadButton
                                    isDownloading={isDownloading}
                                    variant="contained"
                                    aria-label="txt download button"
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
                                                    TXTCart(
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
                                    {isDownloading ? 'Download in Progress' : 'Download TXT'}
                                </DownloadButton>
                            </span>
                        </Tooltip>
                        <StyledP>
                            Downloads a .txt file named `./pdsimg-atlas_{datestamp}.txt` that simply
                            lists out all download urls.
                        </StyledP>
                        <StyledP>
                            The downloaded script files max out at 500k lines. Multiple script files
                            may be downloaded to support to entire payload.
                        </StyledP>
                        <DownloadingWrapper>
                            <ErrorMessage isVisible={error != null}>
                                {error}
                            </ErrorMessage>
                            <DownloadingCard
                                downloadId={'txt' + downloadId}
                                status={status}
                                hidePause={true}
                                onStop={onStop}
                            />
                        </DownloadingWrapper>
                    </Box>
                </>
            )}
        </div>
    )
}

TXTTab.propTypes = {}

export default TXTTab
