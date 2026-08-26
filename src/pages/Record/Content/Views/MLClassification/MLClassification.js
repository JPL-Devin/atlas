import React from 'react'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'

import { getIn, getPDSUrl, getRedirectedUrl } from '../../../../../core/utils.js'
import { getDataByURI, setData } from '../../../../../core/redux/actions/actions'
import { ES_PATHS } from '../../../../../core/constants.js'

import { useViewerOverlay } from '../../Viewer/RecordViewer'
import MLLayers from './subcomponents/MLLayers/MLLayers'
import PanelHeader from '../../PanelHeader/PanelHeader'

const useStyles = makeStyles((theme) => ({
    '@keyframes viewIn': {
        from: { opacity: 0 },
        to: { opacity: 1 },
    },
    panel: {
        width: 'var(--record-panel-width, 300px)',
        height: '100%',
        boxSizing: 'border-box',
        // Fades in with its tab, matching the other record panels.
        animation: '$viewIn 240ms ease-out both',
        display: 'flex',
        flexFlow: 'column',
        background: theme.palette.swatches.grey.grey100,
        color: theme.palette.text.primary,
        borderRight: `1px solid ${theme.palette.swatches.grey.grey200}`,
        [theme.breakpoints.down('lg')]: {
            width: '100%',
            height: 'unset',
            borderRight: 'none',
            borderTop: `2px solid ${theme.palette.swatches.grey.grey200}`,
        },
    },
    // The layers list collapses through the viewer's layers control; the header
    // above it stays put.
    layers: {
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
    },
}))

const MLClassification = (props) => {
    const { recordData } = props
    const c = useStyles()

    const dispatch = useDispatch()

    const [layersOpen, setLayersOpen] = useState(true)
    const toggleLayers = () => setLayersOpen(!layersOpen)
    const [checkedClasses, setCheckedClasses] = useState({})
    const [confidence, setConfidence] = useState([0, 1])

    const layerColors = [
        '#FFB74D',
        '#FFF176',
        '#77EBBD',
        '#4DD0E1',
        '#C39EF2',
        '#F48FB1',
        '#cc8f33',
        '#3387cc',
    ]

    const DATA_TAG = 'mlClassification'
    const mlClassificationData = useSelector((state) => {
        return state.getIn(['data', DATA_TAG])
    }).toJS()
    const release_id = getIn(recordData, ES_PATHS.release_id)

    useEffect(() => {
        const dataURI = getIn(
            recordData,
            'gather.machine_learning.classification.related.overlay.uri'
        )
        if (Object.keys(mlClassificationData).length === 0) {
            getRedirectedUrl(getPDSUrl(dataURI, release_id))
                .then((url) => {
                    dispatch(getDataByURI(DATA_TAG, url, release_id, true))
                })
                .catch((err) => {})
        }
        // On unmount
        return () => {
            dispatch(setData(DATA_TAG, {}))
        }
    }, [])

    useEffect(() => {
        const features = mlClassificationData.features
        if (features) {
            const nextCheckedClasses = {}
            features.forEach((feature) => {
                const className = getIn(feature, 'properties.predicted_class', null)
                if (className && nextCheckedClasses[className] == null)
                    nextCheckedClasses[className] = {
                        on: true,
                        color: layerColors[Object.keys(nextCheckedClasses).length],
                    }
            })
            setCheckedClasses(nextCheckedClasses)
        }
    }, [JSON.stringify(mlClassificationData)])

    let features = mlClassificationData.features
    let featuresOn = []
    if (features) {
        features = features.map((feature) => {
            if (feature.geometry.type != null)
                feature.geometry.coordinates[0] = feature.properties.pixel_coordinates
            return feature
        })
    }
    if (features) {
        featuresOn = features.filter((f) => {
            const featureClass = getIn(f, 'properties.predicted_class', null)
            const featureConfidence = getIn(f, 'properties.posterior_probability', 1)
            if (
                Object.keys(checkedClasses).includes(featureClass) &&
                checkedClasses[featureClass].on === true &&
                featureConfidence >= confidence[0] &&
                featureConfidence <= confidence[1]
            ) {
                f._color = checkedClasses[featureClass].color
                return f
            }
        })
    }

    // The viewer is shared with the other tabs, so hand it the overlay.
    useViewerOverlay({ features: featuresOn, onLayers: toggleLayers }, [
        featuresOn.length,
        JSON.stringify(checkedClasses),
        confidence[0],
        confidence[1],
        layersOpen,
    ])

    return (
        <div className={c.panel}>
            <PanelHeader recordData={recordData} />
            {layersOpen && (
                <div className={c.layers}>
                    <MLLayers
                        features={features}
                        classes={checkedClasses}
                        onChange={(type, state) => {
                            switch (type) {
                                case 'classes':
                                    setCheckedClasses(state)
                                    break
                                case 'confidence':
                                    setConfidence(state)
                                    break
                                default:
                            }
                        }}
                    />
                </div>
            )}
        </div>
    )
}

MLClassification.propTypes = {
    recordData: PropTypes.object,
}

export default MLClassification
