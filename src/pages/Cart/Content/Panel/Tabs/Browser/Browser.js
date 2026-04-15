import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'

import { ZipStreamCart } from '../../../../../../core/downloaders/ZipStream'
import { setSnackBarText } from '../../../../../../core/redux/actions/actions.js'

import DownloadingCard from '../../../../../../components/DownloadingCard/DownloadingCard'
import { DownloadButton, DownloadingWrapper, ErrorMessage } from '../../../../../../components/shared/CartDownloadComponents'

function BrowserTab(props) {
    const { value, index, selectorRef, selectionCount, ...other } = props

    const [isDownloading, setIsDownloading] = useState(false)
    const [downloadId, setDownloadId] = useState(0)
    const [status, setStatus] = useState(null)
    const [zipController, setZipController] = useState(null)
    const [error, setError] = useState(null)

    const dispatch = useDispatch()

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
            role="browser-tab"
            hidden={value !== index}
            id={`scrollable-auto-browsertabpanel-${index}`}
            {...other}
        >
            {value === index && (
                <>
                    <Box p={3}>
                        <Typography variant="h5">Browser ZIP</Typography>
                        <Tooltip
                            title={selectionCount === 0 ? 'Select products above to download.' : ''}
                            arrow
                        >
                            <span>
                                <DownloadButton
                                    isDownloading={isDownloading}
                                    variant="contained"
                                    aria-label="browser zip download button"
                                    disabled={selectionCount === 0}
                                    onClick={() => {
                                        if (selectorRef && selectorRef.current) {
                                            const sel = selectorRef.current.getSelected() || []
                                            if (sel.length === 0) {
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
                                                dispatch(
                                                    ZipStreamCart(
                                                        setStatus,
                                                        setIsDownloading,
                                                        setZipController,
                                                        sel,
                                                        (err) => {
                                                            setError(err)
                                                            setIsDownloading(false)
                                                        }
                                                    )
                                                )
                                            }
                                        }
                                    }}
                                >
                                    {isDownloading ? 'Download in Progress' : 'Download ZIP'}
                                </DownloadButton>
                            </span>
                        </Tooltip>
                    </Box>
                    <DownloadingWrapper>
                        <ErrorMessage isVisible={error != null}>{error}</ErrorMessage>
                        <DownloadingCard
                            downloadId={'zip' + downloadId}
                            status={status}
                            controller={zipController}
                            controllerType="zip"
                        />
                    </DownloadingWrapper>
                </>
            )}
        </div>
    )
}

BrowserTab.propTypes = {}

export default BrowserTab
