import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import Url from 'url-parse'
import clsx from 'clsx'

import { makeStyles, withStyles } from '@mui/styles'

import Heading from './subcomponents/Heading/Heading'
import ResultsStatus from './subcomponents/ResultsStatus/ResultsStatus'
import GridView from './subcomponents/GridView/GridView'
import ListView from './subcomponents/ListView/ListView'
import TableView from './subcomponents/TableView/TableView'
import SecondaryPanel from '../SecondaryPanel/SecondaryPanel'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Tooltip from '@mui/material/Tooltip'
import ToggleButton from '@mui/material/ToggleButton'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import VerticalSplitIcon from '@mui/icons-material/VerticalSplit'
import FilterListIcon from '@mui/icons-material/FilterList'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import PublicIcon from '@mui/icons-material/Public'

import { search, setWorkspace } from '../../../../core/redux/actions/actions.js'
import { abbreviateNumber } from '../../../../core/utils.js'
import { getAppConfig } from '../../../../core/appConfig'

const useStyles = makeStyles((theme) => ({
    ResultsPanel: {
        height: '100%',
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
    },
    contents: {
        width: '100%', //`calc(100% - ${theme.spacing(2)})`,
        height: '100%', //`calc(100% - ${theme.spacing(4)})`,
        margin: 0, //`${theme.spacing(2)} ${theme.spacing(1)}`,
        display: 'flex',
        flexFlow: 'column',
        background: theme.palette.swatches.grey.grey150,
    },
    content: {
        width: '100%',
        height: `calc(100% - ${theme.headHeights[1] + theme.headHeights[2]}px)`,
        display: 'flex',
    },
    contentMobile: {
        height: `calc(100% - ${theme.headHeights[1] + theme.headHeights[2] + 48}px)`,
    },
    bottomBar: {
        'width': '100%',
        'height': '48px',
        'flexShrink': 0,
        'background': theme.palette.swatches.grey.grey100,
        'borderTop': `1px solid ${theme.palette.swatches.grey.grey200}`,
        '& button': {
            color: theme.palette.swatches.grey.grey600,
            minWidth: 0,
        },
        '& button.Mui-selected': {
            color: theme.palette.text.primary,
        },
    },
    resultsViews: {
        flex: 1,
        minWidth: 0,
        height: '100%',
        position: 'relative',
    },
    tabsLeft: {
        display: 'flex',
        alignItems: 'center',
        minWidth: 0,
    },
    splitToggle: {
        'height': '26px',
        'marginLeft': theme.spacing(1),
        'padding': '0px 8px',
        'fontSize': '11px',
        'lineHeight': '11px',
        'color': theme.palette.swatches.grey.grey600,
        'whiteSpace': 'nowrap',
        '&.Mui-selected': {
            color: theme.palette.text.primary,
            background: theme.palette.swatches.grey.grey150,
        },
        '& svg': {
            fontSize: '16px',
            marginRight: '4px',
        },
    },
    viewSwitch: {
        'borderRadius': 0,
        'marginRight': theme.spacing(3),
        'border': `1px solid ${theme.palette.accent.main}`,
        '& button': {
            borderRadius: 0,
            width: '36px',
            height: '100%',
            color: theme.palette.accent.main,
        },
    },
    viewActive: {
        background: `${theme.palette.accent.main} !important`,
        color: `${theme.palette.swatches.grey.grey800} !important`,
    },
    tabs: {
        width: '100%',
        height: theme.headHeights[2],
        background: theme.palette.swatches.grey.grey100,
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
        display: 'flex',
        justifyContent: 'space-between',
        minWidth: 0,
        overflow: 'hidden',
    },
    footing: {
        width: '100%',
        height: theme.headHeights[3],
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 12px',
        boxSizing: 'border-box',
        background: theme.palette.primary.main,
        display: 'none', //!!!!!!!!!!!!!
    },
    numResults: {
        lineHeight: `${theme.headHeights[2]}px`,
        padding: '0px 20px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        color: theme.palette.swatches.grey.grey700,
    },
    maxPage: {
        marginLeft: theme.spacing(2),
        lineHeight: '24px',
        color: theme.palette.swatches.yellow.yellow700,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        bottom: '100%',
        width: '100%',
        height: '10px',
        pointerEvents: 'none',
        background:
            'linear-gradient(to bottom, rgba(18, 24, 30, 0.1) 0%, rgba(18, 24, 30, 0.5) 100%)',
    },
    addQueryCart: {
        color: theme.palette.text.secondary,
        fontSize: '11px',
        lineHeight: '11px',
        margin: '3px 10px 3px 3px',
        background: theme.palette.swatches.black.black0,
    },
}))

// HELPERS
function a11yProps(index) {
    return {
        'id': `record-view-tab-${index}`,
        'aria-controls': `record-view-tab-${index}`,
    }
}

const StyledTabs = withStyles((theme) => ({
    //height: theme.headHeights[2],
    indicator: {
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
}))((props) => <Tabs {...props} TabIndicatorProps={{ children: <span /> }} />)

const StyledTab = withStyles((theme) => ({
    root: {
        'color': theme.palette.text.primary,
        'fontSize': theme.typography.pxToRem(14),
        'marginRight': theme.spacing(1),
        'minWidth': 88,
        '&:focus': {
            opacity: 1,
        },
        // Four tabs have to fit a phone alongside the result count
        [theme.breakpoints.down('md')]: {
            minWidth: 60,
            marginRight: 0,
            padding: '12px 8px',
        },
    },
}))((props) => <Tab disableRipple {...props} />)

// Don't rerender for this change
let firstSearch = false
// We want this evaluated only as soon as possible
const url = new Url(window.location, true)

const ResultsPanel = (props) => {
    const { mobile } = props

    const c = useStyles()
    const dispatch = useDispatch()

    const mapEnabled = getAppConfig().enableMap
    // On phones the map is a bottom bar destination instead of a fourth tab
    const activeViews =
        mapEnabled && !mobile ? ['Grid', 'List', 'Table', 'Map'] : ['Grid', 'List', 'Table']
    const [activeView, setActiveView] = useState('Grid')
    const [split, setSplit] = useState(false)
    const [mobileMap, setMobileMap] = useState(false)

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

    let results = useSelector((state) => {
        return state.getIn(['results'])
    })
    if (typeof results.toJS === 'function') results = results.toJS()

    const paging = useSelector((state) => state.getIn(['resultsPaging'])).toJS()

    const mapView = activeView === 'Map'
    const showMap = mapView || (mobile && mobileMap)
    const mobileTab = w.mobileFilters ? 'filters' : mobileMap ? 'map' : 'results'
    // Full-bleed map, or the active view beside a half-width map
    let mapWidth = 0
    if (mapEnabled && showMap) mapWidth = '100%'
    else if (mapEnabled && split && !mobile) mapWidth = w.mapSize

    return (
        <div className={c.ResultsPanel}>
            <div className={c.contents}>
                <Heading activeView={activeView} mobile={mobile} />
                <div className={c.tabs}>
                    <div className={c.tabsLeft}>
                        <StyledTabs
                            value={activeViews.indexOf(activeView)}
                            onChange={(e, v) => {
                                setActiveView(activeViews[v])
                            }}
                            aria-label="results view tab"
                            variant="scrollable"
                            scrollButtons={false}
                        >
                            {activeViews.map((v, i) => (
                                <StyledTab label={v} key={i} {...a11yProps(i)} />
                            ))}
                        </StyledTabs>
                        {mapEnabled && !mobile && (
                            <Tooltip
                                title={
                                    mapView
                                        ? 'Pick Grid, List or Table to split with the map'
                                        : 'Show the map beside the results'
                                }
                                arrow
                            >
                                <ToggleButton
                                    className={c.splitToggle}
                                    value="split"
                                    size="small"
                                    aria-label="split map"
                                    selected={split}
                                    disabled={mapView}
                                    onChange={() => setSplit(!split)}
                                >
                                    <VerticalSplitIcon />
                                    Split
                                </ToggleButton>
                            </Tooltip>
                        )}
                    </div>

                    <div className={c.numResults}>
                        {results.length > 0 &&
                            `${abbreviateNumber(results.length)}
                                   of ${abbreviateNumber(paging.total)}`}
                    </div>
                </div>
                <div className={clsx(c.content, { [c.contentMobile]: mobile })}>
                    {mapEnabled && <SecondaryPanel width={mapWidth} />}
                    {!showMap && (
                        <div className={c.resultsViews}>
                            {activeView === 'Grid' ? (
                                <GridView results={results} paging={paging} />
                            ) : null}
                            {activeView === 'List' ? (
                                <ListView results={results} paging={paging} />
                            ) : null}
                            {activeView === 'Table' ? (
                                <TableView results={results} paging={paging} />
                            ) : null}
                            <ResultsStatus />
                        </div>
                    )}
                </div>
                {mobile && (
                    <BottomNavigation
                        className={c.bottomBar}
                        value={mobileTab}
                        showLabels
                        onChange={(e, v) => {
                            dispatch(setWorkspace({ ...w, mobileFilters: v === 'filters' }))
                            if (v !== 'filters') setMobileMap(v === 'map')
                        }}
                    >
                        <BottomNavigationAction
                            label="Filters"
                            value="filters"
                            aria-label="filters view"
                            icon={<FilterListIcon />}
                        />
                        <BottomNavigationAction
                            label="Results"
                            value="results"
                            aria-label="results view"
                            icon={<ViewModuleIcon />}
                        />
                        {mapEnabled && (
                            <BottomNavigationAction
                                label="Map"
                                value="map"
                                aria-label="map view"
                                icon={<PublicIcon />}
                            />
                        )}
                    </BottomNavigation>
                )}
                <div className={c.footing}>
                    <div className={c.left}>
                        <div
                            className={c.maxPage}
                            style={{ display: paging.page == 99 ? 'inherit' : 'none' }}
                        >
                            - You've hit the end but there's still more! Try narrowing your search
                            on the left.
                        </div>
                    </div>
                    <div className={c.right}></div>
                    <div className={c.gradient} />
                </div>
            </div>
        </div>
    )
}

ResultsPanel.propTypes = {
    mobile: PropTypes.bool,
}

export default ResultsPanel
