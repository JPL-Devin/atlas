import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { makeStyles, withStyles } from '@mui/styles'
import { prettify } from '../../../../core/utils.js'

import { setRecordViewTab } from '../../../../core/redux/actions/actions.js'

const useStyles = makeStyles((theme) => ({
    // Sits in the record title row, so it inherits that bar's surface.
    ViewTabs: {
        display: 'flex',
        alignItems: 'stretch',
        height: '100%',
        boxSizing: 'border-box',
        color: theme.palette.text.main,
    },
    tabs: {
        'minHeight': 0,
        'height': '100%',
        '& .MuiTabs-scroller, & .MuiTabs-flexContainer': {
            height: '100%',
            alignItems: 'stretch',
        },
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
        'color': theme.palette.text.main,
        'fontSize': theme.typography.pxToRem(14),
        'minWidth': 0,
        'minHeight': 0,
        'height': '100%',
        'justifyContent': 'center',
        'padding': `0 ${theme.spacing(1.5)}`,
        'whiteSpace': 'nowrap',
        '&:focus': {
            opacity: 1,
        },
    },
}))((props) => <Tab disableRipple {...props} />)

const ViewTabs = (props) => {
    const { recordViewTab, VIEW_TABS } = props
    const c = useStyles()

    const dispatch = useDispatch()

    const handleChange = (event, newTabIndex) => {
        // eslint-disable-next-line security/detect-object-injection
        dispatch(setRecordViewTab(VIEW_TABS[newTabIndex]))
    }

    return (
        <div className={c.ViewTabs}>
            <StyledTabs
                className={c.tabs}
                variant="scrollable"
                scrollButtons="auto"
                value={VIEW_TABS.indexOf(recordViewTab)}
                onChange={handleChange}
                aria-label="record view tab"
            >
                {VIEW_TABS.map((v, i) => (
                    <StyledTab label={prettify(v)} key={i} {...a11yProps(i)} />
                ))}
            </StyledTabs>
        </div>
    )
}

ViewTabs.propTypes = {
    recordViewTab: PropTypes.string.isRequired,
    VIEW_TABS: PropTypes.array.isRequired,
}

export default ViewTabs
