import React, { useState, useEffect } from 'react'
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
import { getVersionQuery, getVersionOptions } from '../../core/recordVersions'

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

    const recordData = useSelector((state) => {
        return state.get('recordData')
    }).toJS()

    useEffect(() => {
        if (Object.keys(recordData).length === 0) dispatch(searchRecordByURI())
        // On unmount
        return () => {
            dispatch(setRecordData({}))
        }
    }, [])

    // `uri` lives in the query string, so the record refetches when it changes.
    useEffect(() => {
        setLoading(true)
        Promise.resolve(dispatch(searchRecordByURI())).then(() => setLoading(false))
    }, [location.search])

    // Query for different product versions
    useEffect(() => {
        let cancelled = false
        setVersions([])
        setActiveVersion(null)
        const pds_standard = getIn(recordData, ES_PATHS.pds_standard)

        // Query Versions (Current PDS4 specific)
        if (pds_standard === 'pds4') {
            const lidvid = getIn(recordData, ES_PATHS.pds4_label.lidvid)
            const dsl = getVersionQuery(lidvid, recordData.uri)
            if (dsl) {
                axios
                    .post(`${domain}${endpoints.search}`, dsl, getHeader())
                    .then((response) => {
                        if (cancelled) {
                            return
                        }
                        const nextVersions = getVersionOptions(
                            response?.data?.hits?.hits,
                            lidvid,
                            recordData.uri
                        )
                        const currentVersion = lidvid.split('::')[1]
                        setActiveVersion(
                            nextVersions.findIndex((v) => v.versionRaw === currentVersion)
                        )
                        setVersions(nextVersions)
                    })
                    .catch(() => {
                        if (!cancelled) {
                            setVersions([])
                            setActiveVersion(null)
                        }
                    })
            }
        }
        return () => {
            cancelled = true
        }
    }, [JSON.stringify(recordData)])

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
