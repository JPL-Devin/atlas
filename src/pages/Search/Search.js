import React, { useEffect } from 'react'

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
    useEffect(() => {
        document.title = `${getAppConfig().appTitle} - Search | PDS-IMG`
    }, [])

    const c = useStyles()

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    return (
        <div className={c.Search}>
            <div className={`${c.mainWorkspace} ${c.workspace}`}>
                <FiltersPanel mobile={isMobile} />
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
