import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import Url from 'url-parse'

import Paper from '@mui/material/Paper'
import { styled, useTheme } from '@mui/material/styles'

import Heading from './subcomponents/Heading/Heading'
import ResultsStatus from './subcomponents/ResultsStatus/ResultsStatus'
import GridView from './subcomponents/GridView/GridView'
import ListView from './subcomponents/ListView/ListView'
import TableView from './subcomponents/TableView/TableView'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

import { search } from '../../../../core/redux/actions/actions.js'
import { abbreviateNumber } from '../../../../core/utils.js'

const ResultsPanelRoot = styled('div')({
    height: '100%',
    transition: 'width 0.4s ease-out',
    overflow: 'hidden',
})

const Contents = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
    margin: 0,
    display: 'flex',
    flexFlow: 'column',
    background: theme.palette.swatches.grey.grey150,
}))

const Content = styled('div')(({ theme }) => ({
    width: '100%',
    height: `calc(100% - ${theme.headHeights[1] + theme.headHeights[2]}px)`,
    position: 'relative',
}))

const TabsContainer = styled('div')(({ theme }) => ({
    width: '100%',
    height: theme.headHeights[2],
    background: theme.palette.swatches.grey.grey100,
    borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
    display: 'flex',
    justifyContent: 'space-between',
}))

const Footing = styled('div')(({ theme }) => ({
    width: '100%',
    height: theme.headHeights[3],
    position: 'relative',
    display: 'none',
    justifyContent: 'space-between',
    padding: '8px 12px',
    boxSizing: 'border-box',
    background: theme.palette.primary.main,
}))

const NumResults = styled('div')(({ theme }) => ({
    lineHeight: `${theme.headHeights[2]}px`,
    padding: '0px 20px',
    color: theme.palette.swatches.grey.grey700,
}))

const MaxPage = styled('div')(({ theme }) => ({
    marginLeft: theme.spacing(2),
    lineHeight: '24px',
    color: theme.palette.swatches.yellow.yellow700,
}))

const Gradient = styled('div')({
    position: 'absolute',
    left: 0,
    bottom: '100%',
    width: '100%',
    height: '10px',
    pointerEvents: 'none',
    background:
        'linear-gradient(to bottom, rgba(18, 24, 30, 0.1) 0%, rgba(18, 24, 30, 0.5) 100%)',
})

// HELPERS
function a11yProps(index) {
    return {
        'id': `record-view-tab-${index}`,
        'aria-controls': `record-view-tab-${index}`,
    }
}

const StyledTabs = styled(Tabs)(({ theme }) => ({
    '& .MuiTabs-indicator': {
        'display': 'flex',
        'justifyContent': 'center',
        'backgroundColor': 'transparent',
        'height': '5px',
        '& > span': {
            maxWidth: 124,
            width: '100%',
            backgroundColor: theme.palette.accent.main,
        },
    },
}))

const StyledTabsWrapper = (props) => <StyledTabs {...props} TabIndicatorProps={{ children: <span /> }} />

const StyledTab = styled(Tab)(({ theme }) => ({
    'color': theme.palette.text.primary,
    'fontSize': theme.typography.pxToRem(14),
    'marginRight': theme.spacing(1),
    'minWidth': 88,
    '&:focus': {
        opacity: 1,
    },
}))

// Don't rerender for this change
let firstSearch = false
// We want this evaluated only as soon as possible
const url = new Url(window.location, true)

const ResultsPanel = (props) => {
    const { mobile } = props

    const theme = useTheme()
    const dispatch = useDispatch()

    const activeViews = ['grid', 'list', 'table']
    const [activeView, setActiveView] = useState('grid')

    const atlasMapping = useSelector((state) => {
        return state.getIn(['mappings', 'atlas'])
    })

    useEffect(() => {
        // Runs after the first render() lifecycle
        if (!firstSearch && atlasMapping?.groups) {
            dispatch(search(null, true, null, url))
            firstSearch = true
        }
    }, [atlasMapping])

    const w = useSelector((state) => {
        return state.getIn(['workspace', 'main'])
    }).toJS()

    // 'basic' || 'advanced
    const filterType = useSelector((state) => {
        return state.getIn(['filterType'])
    })

    let results = useSelector((state) => {
        return state.getIn(['results'])
    })
    if (typeof results.toJS === 'function') results = results.toJS()

    const paging = useSelector((state) => state.getIn(['resultsPaging'])).toJS()

    let width = 0
    if (mobile) width = '100%'
    else if (w.results)
        width = `calc(100vw - ${w.secondary ? w.secondarySize : '0%'} - ${
            w.filters ? (filterType === 'basic' ? w.filtersSize : w.advancedFiltersSize) : '0%'
        } - ${theme.headHeights[1]}px)`
    const style = {
        width,
    }

    return (
        <ResultsPanelRoot style={style}>
            <Contents>
                <Heading activeView={activeView} />
                <TabsContainer>
                    <StyledTabsWrapper
                        value={activeViews.indexOf(activeView)}
                        onChange={(e, v) => {
                            setActiveView(activeViews[v])
                        }}
                        aria-label="results view tab"
                    >
                        {activeViews.map((v, i) => (
                            <StyledTab label={v} key={i} disableRipple {...a11yProps(i)} />
                        ))}
                    </StyledTabsWrapper>

                    <NumResults>
                        {results.length > 0 &&
                            `${abbreviateNumber(results.length)}
                                   of ${abbreviateNumber(paging.total)}`}
                    </NumResults>
                </TabsContainer>
                <Content>
                    {activeView === 'grid' ? <GridView results={results} paging={paging} /> : null}
                    {activeView === 'list' ? <ListView results={results} paging={paging} /> : null}
                    {activeView === 'table' ? (
                        <TableView results={results} paging={paging} />
                    ) : null}
                    <ResultsStatus />
                </Content>
                <Footing>
                    <div>
                        <MaxPage
                            style={{ display: paging.page == 99 ? 'inherit' : 'none' }}
                        >
                            - You've hit the end but there's still more! Try narrowing your search
                            on the left.
                        </MaxPage>
                    </div>
                    <div></div>
                    <Gradient />
                </Footing>
            </Contents>
        </ResultsPanelRoot>
    )
}

ResultsPanel.propTypes = {}

export default ResultsPanel
