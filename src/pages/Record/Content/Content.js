import React, { useCallback, useEffect, useState } from 'react'
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
import RecordViewer, { RecordViewerOverlayProvider } from './Viewer/RecordViewer'

const VIEW_COMPONENTS = {
    'overview': Overview,
    'product label': ProductLabel,
    'ml classification': MLClassification,
}

// Each tab's panel width, so switching tabs animates the panel instead of
// snapping to its new size.
const PANEL_WIDTHS = {
    'overview': { md: 770, lg: 770 },
    'product label': { md: 770, lg: 770 },
    'ml classification': { md: 300, lg: 300 },
}

const useStyles = makeStyles((theme) => ({
    Content: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexFlow: 'column',
        transition: '--record-panel-width 240ms ease-in-out',
    },
    component: {
        flex: 1,
        minHeight: 0,
        overflowY: 'hidden',
    },
    // The panel and the viewer sit side by side, so the viewer survives a tab
    // switch instead of reloading the image.
    body: {
        width: '100%',
        height: '100%',
        display: 'flex',
        [theme.breakpoints.down('md')]: {
            flexFlow: 'column',
            overflowY: 'auto',
        },
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

    const theme = useTheme()
    const isLarge = useMediaQuery(theme.breakpoints.up('lg'))
    const isNarrow = useMediaQuery(theme.breakpoints.down('md'))
    const widths = PANEL_WIDTHS[recordViewTab] || PANEL_WIDTHS.overview
    const panelWidth = `${isLarge ? widths.lg : widths.md}px`

    // A tab can hand overlay features and a layers control to the shared viewer.
    const [overlay, setOverlay] = useState({})
    const registerOverlay = useCallback((next) => setOverlay(next || {}), [])

    // The label tree takes the whole width on a phone.
    const showViewer = !(isNarrow && recordViewTab === 'product label')

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
                <div className={c.body}>
                    <RecordViewerOverlayProvider value={registerOverlay}>
                        <ViewComponent
                            recordData={recordData}
                            versions={versions}
                            activeVersion={activeVersion}
                            loading={loading}
                        />
                    </RecordViewerOverlayProvider>
                    {showViewer && (
                        <RecordViewer recordData={recordData} loading={loading} overlay={overlay} />
                    )}
                </div>
            </div>
        </div>
    )
}

Content.propTypes = {
    recordData: PropTypes.object.isRequired,
    loading: PropTypes.bool,
}

export default Content
