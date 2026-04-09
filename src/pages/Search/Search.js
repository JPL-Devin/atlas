import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'

import FiltersPanel from './Panels/FiltersPanel/FiltersPanel'
import SecondaryPanel from './Panels/SecondaryPanel/SecondaryPanel'
import ResultsPanel from './Panels/ResultsPanel/ResultsPanel'

import AddFilterModal from './Modals/AddFilterModal/AddFilterModal'
import FilterHelpModal from './Modals/FilterHelpModal/FilterHelpModal'
import EditColumnsModal from './Modals/EditColumnsModal/EditColumnsModal'
import AdvancedFilterModal from './Modals/AdvancedFilterModal/AdvancedFilterModal'
import AdvancedFilterReturnModal from './Modals/AdvancedFilterReturnModal/AdvancedFilterReturnModal'

const SearchRoot = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
    display: 'flex',
    color: theme.palette.text.primary,
}))

const MainWorkspace = styled('div')({
    padding: 0,
    height: '100%',
    display: 'flex',
    flex: 1,
})

const Workspace = styled('div')({
    display: 'flex',
    flex: 1,
})

const Search = (props) => {
    useEffect(() => {
        document.title = 'Atlas - Search | PDS-IMG'
    }, [])

    const mobileWorkspace = useSelector((state) => {
        return state.getIn(['workspace', 'mobile'])
    })

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))

    // If mobile
    if (isMobile) {
        let panel
        switch (mobileWorkspace) {
            case 'filters':
                panel = <FiltersPanel mobile={true} />
                break
            case 'secondary':
                panel = <SecondaryPanel mobile={true} />
                break
            default:
                panel = <ResultsPanel mobile={true} />
        }

        return (
            <SearchRoot>
                <Workspace>{panel}</Workspace>
                <AddFilterModal />
                <FilterHelpModal />
                <EditColumnsModal />
                <AdvancedFilterModal />
                <AdvancedFilterReturnModal />
            </SearchRoot>
        )
    }
    return (
        <SearchRoot>
            <MainWorkspace>
                <FiltersPanel />
                <Workspace>
                    <SecondaryPanel />
                    <ResultsPanel />
                </Workspace>
            </MainWorkspace>
            <AddFilterModal />
            <FilterHelpModal />
            <EditColumnsModal />
            <AdvancedFilterModal />
            <AdvancedFilterReturnModal />
        </SearchRoot>
    )
}

Search.propTypes = {}

export default Search
