import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'
import { useTheme } from '@mui/material/styles'

import { setRecordViewTab } from '../../../core/redux/actions/actions.js'
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

const useStyles = makeStyles((theme) => ({
    Content: {
        width: '100%',
        height: `calc(100% - ${theme.headHeights[1]}px)`,
        display: 'flex',
        flexFlow: 'column',
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
    const theme = useTheme()

    const recordViewTab = useSelector((state) => {
        return state.get('recordViewTab')
    })

    // When navigating away, reset the view tab to the overview tab
    useEffect(() => {
        return () => {
            // eslint-disable-next-line security/detect-object-injection
            dispatch(setRecordViewTab(VIEW_TABS[0].id))
        }
    }, [])

    const ViewComponent = VIEW_COMPONENTS[recordViewTab] || null

    return (
        <div
            className={c.Content}
            style={{
                height: `calc(100% - ${theme.headHeights[1]}px - ${
                    activeVersion != 0 && activeVersion != null && versions.length > 0 ? 29.5 : 0
                }px)`,
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
