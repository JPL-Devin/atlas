import React from 'react'
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'

import ContentCopyIcon from '@mui/icons-material/ContentCopy'

import { getIn, getPDSUrl, getRedirectedUrl, copyToClipboard } from '../../../../../core/utils.js'
import { getDataByURI, setData, setSnackBarText } from '../../../../../core/redux/actions/actions'
import { ES_PATHS } from '../../../../../core/constants.js'

import { useViewerOverlay } from '../../Viewer/RecordViewer'
import MLLayers from './subcomponents/MLLayers/MLLayers'
import PanelHeader from '../../PanelHeader/PanelHeader'

const useStyles = makeStyles((theme) => ({
    panel: {
        width: 'var(--record-panel-width, 770px)',
        height: '100%',
        boxSizing: 'border-box',
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
    // A slim scrollbar keeps the gutter from cutting into the heading rules.
    body: {
        'flex': 1,
        'minHeight': 0,
        'overflowY': 'auto',
        'padding': '16px 20px 20px 20px',
        'scrollbarWidth': 'thin',
        'scrollbarColor': `${theme.palette.swatches.grey.grey300} transparent`,
        '&::-webkit-scrollbar': {
            width: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
            background: theme.palette.swatches.grey.grey300,
            borderRadius: '4px',
        },
        [theme.breakpoints.down('lg')]: {
            flex: 'unset',
            overflowY: 'unset',
        },
    },
    // Matches the header's other outlined controls.
    copyAction: {
        'flexShrink': 0,
        'color': theme.palette.swatches.grey.grey700,
        'background': theme.palette.swatches.grey.grey0,
        'borderColor': theme.palette.swatches.grey.grey300,
        '&:hover': {
            borderColor: theme.palette.swatches.grey.grey500,
            background: theme.palette.swatches.grey.grey150,
        },
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

    const model = {
        name: getIn(recordData, 'gather.machine_learning.classification.ml_model_name'),
        version: getIn(recordData, 'gather.machine_learning.classification.ml_model_version_id'),
    }

    return (
        <div className={c.panel}>
            <PanelHeader
                recordData={recordData}
                extraActions={
                    <Tooltip title="Copy the classifier features as JSON" arrow>
                        <Button
                            className={c.copyAction}
                            variant="outlined"
                            size="small"
                            aria-label="copy ML features"
                            startIcon={<ContentCopyIcon fontSize="small" />}
                            onClick={() => {
                                copyToClipboard(
                                    JSON.stringify({ ml_features: features }, null, 2)
                                )
                                dispatch(
                                    setSnackBarText(
                                        'Copied ML Features JSON to Clipboard!',
                                        'success'
                                    )
                                )
                            }}
                        >
                            Copy Features
                        </Button>
                    </Tooltip>
                }
            />
            <div className={c.body}>
                <MLLayers
                    features={features}
                    featuresOn={featuresOn}
                    classes={checkedClasses}
                    model={model}
                    layersOpen={layersOpen}
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
        </div>
    )
}

MLClassification.propTypes = {
    recordData: PropTypes.object,
}

export default MLClassification
