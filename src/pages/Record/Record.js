import React, { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'
import axios from 'axios'

import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import useMediaQuery from '@mui/material/useMediaQuery'
import { makeStyles } from '@mui/styles'

import { searchRecordByURI, setRecordData } from '../../core/redux/actions/actions'
import { ES_PATHS, domain, endpoints } from '../../core/constants'
import { getIn, getHeader } from '../../core/utils'
import { getAppConfig } from '../../core/appConfig'

import Content from './Content/Content'
import Footer from './Footer/Footer'

const useStyles = makeStyles((theme) => ({
    Record: {
        width: '100%',
        height: '100%',
        color: theme.palette.text.primary,
    },
}))

const Record = (props) => {
    const { width } = props

    useEffect(() => {
        document.title = `${getAppConfig().appTitle} - Record | PDS-IMG`
    }, [])

    const c = useStyles()

    const location = useLocation()
    const dispatch = useDispatch()

    const [versions, setVersions] = useState([])
    const [activeVersion, setActiveVersion] = useState(null)
    const [loading, setLoading] = useState(true)

    const recordDataImm = useSelector((state) => {
        return state.get('recordData')
    })
    const recordData = useMemo(() => recordDataImm.toJS(), [recordDataImm])

    useEffect(() => {
        // On unmount
        return () => {
            dispatch(setRecordData({}))
        }
    }, [])

    // `uri` lives in the query string, so the record refetches when it changes.
    // Runs on mount too, so no separate initial fetch is needed.
    useEffect(() => {
        setLoading(true)
        Promise.resolve(dispatch(searchRecordByURI())).then(() => setLoading(false))
    }, [location.search])

    const pds_standard = getIn(recordData, ES_PATHS.pds_standard)
    const lidvid = getIn(recordData, ES_PATHS.pds4_label.lidvid)

    // Query for different product versions
    useEffect(() => {
        // Query Versions (Current PDS4 specific)
        if (pds_standard === 'pds4' && lidvid) {
            let [lid, vid] = lidvid.split('::')
            lid = lid
                .replaceAll('/', '\\/')
                .replaceAll(':', '\\:')
                .replace(/\.[^/.]+$/, '')
            const dsl = {
                query: {
                    bool: {
                        must: [
                            {
                                regexp: {
                                    [ES_PATHS.pds4_label.lidvid.join('.')]: {
                                        value: `${lid}.*`,
                                    },
                                },
                            },
                        ],
                    },
                },
                _source: ['uri', ES_PATHS.pds4_label.lidvid.join('.')],
            }

            axios
                .post(`${domain}${endpoints.search}`, dsl, getHeader())
                .then((response) => {
                    const nextVersions = []
                    if (response?.data?.hits?.hits?.[0] != null) {
                        response.data.hits.hits.forEach((r) => {
                            if (r._source?.pds4_label?.lidvid != null) {
                                let [rlid, rvid] = r._source.pds4_label.lidvid.split('::')
                                nextVersions.push({
                                    uri: r._source.uri,
                                    name: r._source.uri.split('/').pop(),
                                    version: `Version ${rvid}`,
                                    versionRaw: rvid,
                                    versionNum: parseFloat(rvid),
                                })
                            }
                        })
                        nextVersions.sort(function (a, b) {
                            return b.versionNum - a.versionNum
                        })
                    }

                    if (nextVersions.length > 0) {
                        const [flid, fvid] = lidvid.split('::')
                        for (let i = 0; i < nextVersions.length; i++) {
                            if (nextVersions[i].versionRaw == fvid) {
                                setActiveVersion(i)
                                break
                            }
                        }
                    }

                    setVersions(nextVersions)
                })
                .catch((err) => {
                    setVersions([])
                })
        } else {
            setVersions([])
        }
    }, [pds_standard, lidvid])

    return (
        <div className={c.Record}>
            <Content
                recordData={recordData}
                versions={versions}
                activeVersion={activeVersion}
                loading={loading}
            />
            {/*<Footer />*/}
        </div>
    )
}

Record.propTypes = {}

export default Record
