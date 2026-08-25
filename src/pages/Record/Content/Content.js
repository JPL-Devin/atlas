import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

import { setRecordViewTab, setRecordFilenamePart } from '../../../core/redux/actions/actions.js'
import { VIEW_TABS } from '../viewTabs'

// View components
import Overview from './Views/Overview/Overview'
import ProductLabel from './Views/ProductLabel/ProductLabel'
import MLClassification from './Views/MLClassification/MLClassification'

const VIEW_COMPONENTS = {
    'overview': Overview,
    'product label': ProductLabel,
    'ml classification': MLClassification,
}

// Each tab's panel width, so switching tabs animates the panel instead of
// snapping to its new size.
const PANEL_WIDTHS = {
    'overview': { md: 700, lg: 700 },
    'product label': { md: 660, lg: 960 },
    'ml classification': { md: 300, lg: 300 },
}

const useStyles = makeStyles(() => ({
    Content: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexFlow: 'column',
        transition: '--record-panel-width 240ms ease-in-out',
    },
    component: {
        flex: 1,
        overflowY: 'hidden',
    },
}))

const Content = (props) => {
    const { recordData, versions, activeVersion, loading } = props
    const c = useStyles()

    const dispatch = useDispatch()

    const recordViewTab = useSelector((state) => {
        return state.get('recordViewTab')
    })

    // When navigating away, reset the view tab to the overview tab
    useEffect(() => {
        return () => {
            // eslint-disable-next-line security/detect-object-injection
            dispatch(setRecordViewTab(VIEW_TABS[0].id))
            dispatch(setRecordFilenamePart(null, false))
        }
    }, [])

    const ViewComponent = VIEW_COMPONENTS[recordViewTab] || null

    const isLarge = useMediaQuery(useTheme().breakpoints.up('lg'))
    const widths = PANEL_WIDTHS[recordViewTab] || PANEL_WIDTHS.overview
    const panelWidth = `${isLarge ? widths.lg : widths.md}px`

    return (
        <div
            className={c.Content}
            style={{
                'height': `calc(100% - ${
                    activeVersion != 0 && activeVersion != null && versions.length > 0 ? 29.5 : 0
                }px)`,
                '--record-panel-width': panelWidth,
            }}
        >
            <div className={c.component}>
                <ViewComponent
                    recordData={recordData}
                    versions={versions}
                    activeVersion={activeVersion}
                    loading={loading}
                />
            </div>
        </div>
    )
}

Content.propTypes = {
    recordData: PropTypes.object.isRequired,
    loading: PropTypes.bool,
}

export default Content
