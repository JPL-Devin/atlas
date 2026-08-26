import React, { useEffect } from 'react'
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
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        color: theme.palette.text.main,
    },
    tabs: {
        'minHeight': 0,
        'height': '100%',
        'width': '100%',
        '& .MuiTabs-scroller, & .MuiTabs-flexContainer': {
            height: '100%',
            alignItems: 'stretch',
        },
        // The tabs sit centred in the panel header rather than hugging its edge.
        '& .MuiTabs-flexContainer': {
            justifyContent: 'center',
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
        // Spans the whole tab, however long its label is.
        '& > span': {
            width: '100%',
            backgroundColor: theme.palette.accent.main,
        },
    },
}))((props) => <Tabs {...props} TabIndicatorProps={{ children: <span /> }} />)

// Bold labels and a lit surface on the active tab, so the row reads as the
// panel's primary navigation.
const StyledTab = withStyles((theme) => ({
    root: {
        'color': theme.palette.swatches.grey.grey600,
        'fontSize': theme.typography.pxToRem(14),
        'fontWeight': 'bold',
        'letterSpacing': '0.08em',
        'minWidth': 96,
        'minHeight': 0,
        'height': '100%',
        'justifyContent': 'center',
        'padding': `0 ${theme.spacing(2)}`,
        'whiteSpace': 'nowrap',
        '&:hover': {
            color: theme.palette.text.primary,
            background: theme.palette.swatches.grey.grey150,
        },
        '&.Mui-selected': {
            color: theme.palette.text.primary,
        },
        '&:focus': {
            opacity: 1,
        },
    },
}))((props) => <Tab disableRipple {...props} />)

const ViewTabs = (props) => {
    const { recordViewTab, VIEW_TABS } = props
    const c = useStyles()

    const dispatch = useDispatch()

    // Tabs place their indicator before the panel finishes resizing, so nudge
    // them to re-measure once the width transition ends.
    useEffect(() => {
        const t = setTimeout(() => window.dispatchEvent(new Event('resize')), 300)
        return () => clearTimeout(t)
    }, [recordViewTab])

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
