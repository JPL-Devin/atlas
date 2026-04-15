import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { styled } from '@mui/material/styles'
import { prettify } from '../../../../core/utils.js'

import { setRecordViewTab } from '../../../../core/redux/actions/actions.js'

const ViewTabsRoot = styled('div')(({ theme }) => ({
    height: theme.headHeights[2],
    boxSizing: 'border-box',
    background: theme.palette.swatches.grey.grey100,
    borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
    color: theme.palette.text.primary,
}))

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

const StyledTab = styled(Tab)(({ theme }) => ({
    'color': theme.palette.text.primary,
    'fontSize': theme.typography.pxToRem(14),
    'marginRight': theme.spacing(1),
    'minWidth': 88,
    '&:focus': {
        opacity: 1,
    },
}))

const ViewTabs = (props) => {
    const { recordViewTab, VIEW_TABS } = props

    const dispatch = useDispatch()

    const handleChange = (event, newTabIndex) => {
        // eslint-disable-next-line security/detect-object-injection
        dispatch(setRecordViewTab(VIEW_TABS[newTabIndex]))
    }

    return (
        <ViewTabsRoot>
            <StyledTabs
                value={VIEW_TABS.indexOf(recordViewTab)}
                onChange={handleChange}
                aria-label="record view tab"
                TabIndicatorProps={{ children: <span /> }}
            >
                {VIEW_TABS.map((v, i) => (
                    <StyledTab disableRipple label={prettify(v)} key={i} {...a11yProps(i)} />
                ))}
            </StyledTabs>
        </ViewTabsRoot>
    )
}

ViewTabs.propTypes = {
    recordViewTab: PropTypes.string.isRequired,
    VIEW_TABS: PropTypes.array.isRequired,
}

export default ViewTabs
