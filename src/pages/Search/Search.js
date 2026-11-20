import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import useMediaQuery from '@mui/material/useMediaQuery'
import { makeStyles } from '@mui/styles'
import { useTheme } from '@mui/material/styles'

import FiltersPanel from './Panels/FiltersPanel/FiltersPanel'
import ResultsPanel from './Panels/ResultsPanel/ResultsPanel'

import AddFilterModal from './Modals/AddFilterModal/AddFilterModal'
import FilterHelpModal from './Modals/FilterHelpModal/FilterHelpModal'
import EditColumnsModal from './Modals/EditColumnsModal/EditColumnsModal'
import AdvancedFilterModal from './Modals/AdvancedFilterModal/AdvancedFilterModal'
import AdvancedFilterReturnModal from './Modals/AdvancedFilterReturnModal/AdvancedFilterReturnModal'

import { getAppConfig } from '../../core/appConfig'
import { initializeSearchEntry } from '../../core/redux/actions/actions'

const useStyles = makeStyles((theme) => ({
    Search: {
        width: '100%',
        height: '100%',
        display: 'flex',
        minWidth: 0,
        overflow: 'hidden',
        color: theme.palette.text.primary,
    },
    mainWorkspace: {
        padding: 0,
        height: '100%',
        position: 'relative',
    },
    workspace: {
        display: 'flex',
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
    },
}))

const Search = () => {
    const location = useLocation()
    const dispatch = useDispatch()
    const mappingReady = useSelector((state) => Boolean(state.getIn(['mappings', 'atlas'])?.groups))
    const initializedEntry = useSelector((state) => state.get('initializedSearchEntry'))
    const [entry] = useState(() => ({
        key: location.key,
        query: Object.fromEntries(new URLSearchParams(location.search)),
        fromHome: location.state?.fromHome === true,
    }))
    const ready = initializedEntry != null && (!entry.fromHome || initializedEntry === entry.key)

    useEffect(() => {
        if (mappingReady && !ready) {
            dispatch(initializeSearchEntry(entry))
        }
    }, [dispatch, entry, mappingReady, ready])

    useEffect(() => {
        document.title = `${getAppConfig().appTitle} - Search | PDS-IMG`
    }, [])

    const c = useStyles()

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    return (
        <div className={c.Search}>
            <div className={`${c.mainWorkspace} ${c.workspace}`}>
                <FiltersPanel mobile={isMobile} ready={ready} />
                <ResultsPanel mobile={isMobile} />
            </div>
            <AddFilterModal />
            <FilterHelpModal />
            <EditColumnsModal />
            <AdvancedFilterModal />
            <AdvancedFilterReturnModal />
        </div>
    )
}

Search.propTypes = {}

export default Search
