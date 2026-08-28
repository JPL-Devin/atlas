import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { makeStyles } from '@mui/styles'
import Checkbox from '@mui/material/Checkbox'
import Input from '@mui/material/Input'
import Slider from '@mui/material/Slider'

import { getIn, prettify } from '../../../../../../../core/utils.js'

const useStyles = makeStyles((theme) => ({
    MLLayers: {
        color: theme.palette.text.primary,
    },
    heading: {
        fontSize: '12px',
        fontWeight: 'bold',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: theme.palette.swatches.yellow.yellow800,
        borderTop: `1px solid ${theme.palette.swatches.grey.grey200}`,
        // Negative margins pull the rule out to the panel edges.
        margin: '0 -20px 10px -20px',
        padding: '12px 20px 0 20px',
    },
    tiles: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '8px',
        marginBottom: '20px',
        [theme.breakpoints.down('md')]: {
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        },
        [theme.breakpoints.down('sm')]: {
            gridTemplateColumns: 'minmax(0, 1fr)',
        },
    },
    tile: {
        background: theme.palette.swatches.grey.grey0,
        border: `1px solid ${theme.palette.swatches.grey.grey200}`,
        borderRadius: '2px',
        padding: '8px 10px',
        minWidth: 0,
    },
    tileLabel: {
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: theme.palette.swatches.grey.grey500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    tileValue: {
        fontSize: '14px',
        lineHeight: '20px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    // Layers and filters sit on the same white surface as the other panels.
    card: {
        boxSizing: 'border-box',
        marginBottom: '20px',
        borderRadius: '3px',
        border: `1px solid ${theme.palette.swatches.grey.grey200}`,
        background: theme.palette.swatches.grey.grey0,
    },
    cardPad: {
        padding: '12px',
    },
    layerRow: {
        'display': 'flex',
        'alignItems': 'center',
        'gap': '8px',
        'width': '100%',
        'boxSizing': 'border-box',
        'padding': '6px 12px',
        'background': 'none',
        'border': 'none',
        'borderTop': `1px solid ${theme.palette.swatches.grey.grey150}`,
        'textAlign': 'left',
        'cursor': 'pointer',
        'color': 'inherit',
        'font': 'inherit',
        'transition': 'background 0.15s ease-out',
        '&:first-child': {
            borderTop: 'none',
        },
        '&:hover': {
            background: theme.palette.swatches.grey.grey50,
        },
    },
    layerCheckbox: {
        padding: 0,
    },
    // The overlay colour, so the list keys the boxes on the image.
    swatch: {
        width: '12px',
        height: '12px',
        borderRadius: '2px',
        flexShrink: 0,
        border: `1px solid ${theme.palette.swatches.grey.grey300}`,
    },
    swatchOff: {
        background: theme.palette.swatches.grey.grey200,
    },
    layerName: {
        flex: 1,
        minWidth: 0,
        fontSize: '13px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    layerNameOff: {
        color: theme.palette.swatches.grey.grey500,
        fontWeight: 'normal',
    },
    layerMeta: {
        fontSize: '12px',
        color: theme.palette.swatches.grey.grey600,
        whiteSpace: 'nowrap',
        flexShrink: 0,
    },
    layerCount: {
        fontSize: '12px',
        fontWeight: 'bold',
        color: theme.palette.swatches.grey.grey700,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        minWidth: '28px',
        textAlign: 'right',
    },
    showing: {
        fontSize: '12px',
        color: theme.palette.swatches.grey.grey600,
        margin: '-10px 0 20px 0',
    },
    filterLabel: {
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: theme.palette.swatches.grey.grey500,
        marginBottom: '2px',
    },
    // The thumbs reach past the track, so the row pads for them and clips the rest.
    sliderWrapper: {
        boxSizing: 'border-box',
        padding: '0 10px',
        overflowX: 'hidden',
    },
    sliderMarks: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: theme.palette.swatches.grey.grey600,
        marginTop: '-6px',
    },
    inputs: {
        display: 'flex',
        gap: '12px',
        marginTop: '10px',
    },
    inputField: {
        flex: 1,
        minWidth: 0,
    },
    // Quiet inset fields, matching the General Fields filter.
    input: {
        'width': '100%',
        'fontSize': '13px',
        'padding': '2px 6px',
        'borderRadius': '3px',
        'border': `1px solid ${theme.palette.swatches.grey.grey200}`,
        'background': theme.palette.swatches.grey.grey50,
        'transition': 'border-color 0.15s ease-out, background 0.15s ease-out',
        '&:before, &:after': {
            display: 'none',
        },
        '&:hover': {
            borderColor: theme.palette.swatches.grey.grey300,
        },
        '&.Mui-focused': {
            borderColor: theme.palette.swatches.blue.blue700,
            background: theme.palette.swatches.grey.grey0,
        },
    },
    empty: {
        fontSize: '13px',
        color: theme.palette.swatches.grey.grey500,
        padding: '12px',
    },
}))

const MIN = 0.9
const MAX = 1
const STEP = 0.005

/**
 * Counts each class's detections and its confidence range
 *
 * @param {Array} features - the classifier's GeoJSON features
 * @return {Object} keyed by class name
 */
const summarizeClasses = (features) => {
    const summary = {}
    ;(features || []).forEach((feature) => {
        const className = getIn(feature, 'properties.predicted_class', null)
        if (className == null) return
        const confidence = getIn(feature, 'properties.posterior_probability', null)
        const entry = summary[className] || { count: 0, min: null, max: null }
        entry.count += 1
        if (typeof confidence === 'number') {
            if (entry.min == null || confidence < entry.min) entry.min = confidence
            if (entry.max == null || confidence > entry.max) entry.max = confidence
        }
        summary[className] = entry
    })
    return summary
}

const MLLayers = (props) => {
    const { features, featuresOn, classes = {}, model = {}, onChange } = props
    const c = useStyles()

    const [value, setValue] = useState([MIN, MAX])
    // A value range that replaces nulls with minmax (in case a user cleared an input field)
    const normalizedValue = [value[0] != null ? value[0] : MIN, value[1] != null ? value[1] : MAX]

    const handleSliderChange = (e, newValue) => {
        setValue(newValue)
        onChange('confidence', newValue)
    }
    const handleInputChange = (type, newValue) => {
        if (newValue === '') newValue = null
        else {
            newValue = parseFloat(newValue)
            if (isNaN(newValue)) return
        }

        const nextValue = [value[0], value[1]]
        if (type === 'min') nextValue[0] = newValue
        else if (type === 'max') nextValue[1] = newValue
        setValue(nextValue)
        onChange('confidence', [
            nextValue[0] != null ? nextValue[0] : MIN,
            nextValue[1] != null ? nextValue[1] : MAX,
        ])
    }

    const summary = summarizeClasses(features)
    const classNames = Object.keys(classes)
    const total = (features || []).length
    const shown = (featuresOn || []).length

    // The classifier's own range across every class, and the image it ran on.
    const bounds = Object.keys(summary).reduce(
        (acc, key) => {
            const stats = summary[key]
            if (stats.min != null && (acc.min == null || stats.min < acc.min)) acc.min = stats.min
            if (stats.max != null && (acc.max == null || stats.max > acc.max)) acc.max = stats.max
            return acc
        },
        { min: null, max: null }
    )
    const imageId = getIn(features, '0.properties.image_id', null)

    const tiles = [
        { label: 'Model', value: model.name },
        { label: 'Version', value: model.version },
        { label: 'Detections', value: total > 0 ? `${total}` : null },
        { label: 'Classes', value: classNames.length > 0 ? `${classNames.length}` : null },
        { label: 'Image', value: imageId },
        {
            label: 'Confidence',
            value:
                bounds.min != null
                    ? `${bounds.min.toFixed(3)} – ${bounds.max.toFixed(3)}`
                    : null,
        },
    ].filter((tile) => tile.value != null && tile.value !== '')

    return (
        <div className={c.MLLayers}>
            {tiles.length > 0 && (
                <>
                    <div className={c.heading}>Classifier</div>
                    <div className={c.tiles}>
                        {tiles.map((tile) => (
                            <div className={c.tile} key={tile.label}>
                                <div className={c.tileLabel}>{tile.label}</div>
                                <div className={c.tileValue} title={tile.value}>
                                    {tile.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            <div className={c.heading}>Layers</div>
            <div className={c.card}>
                    {classNames.length === 0 ? (
                        <div className={c.empty}>No classifications on this product.</div>
                    ) : (
                        classNames.map((key) => {
                            const checkedClass = classes[key] || {}
                            const isChecked = checkedClass.on === true
                            const stats = summary[key] || {}
                            return (
                                <button
                                    className={c.layerRow}
                                    key={key}
                                    aria-label={`toggle ${key} layer`}
                                    aria-pressed={isChecked}
                                    onClick={() => {
                                        const nextClasses = JSON.parse(JSON.stringify(classes))
                                        nextClasses[key] = nextClasses[key] || {}
                                        nextClasses[key].on = !isChecked
                                        onChange('classes', nextClasses)
                                    }}
                                >
                                    <Checkbox
                                        className={c.layerCheckbox}
                                        color="primary"
                                        size="small"
                                        checked={isChecked}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                    <div
                                        className={`${c.swatch} ${isChecked ? '' : c.swatchOff}`}
                                        style={
                                            isChecked ? { background: checkedClass.color } : null
                                        }
                                    />
                                    <div
                                        className={`${c.layerName} ${
                                            isChecked ? '' : c.layerNameOff
                                        }`}
                                    >
                                        {prettify(key)}
                                    </div>
                                    {stats.min != null && (
                                        <div className={c.layerMeta}>
                                            {stats.min.toFixed(3)} – {stats.max.toFixed(3)}
                                        </div>
                                    )}
                                    <div className={c.layerCount}>{stats.count}</div>
                                </button>
                            )
                        })
                    )}
            </div>
            <div className={c.heading}>Filters</div>
            <div className={`${c.card} ${c.cardPad}`}>
                <div className={c.filterLabel}>Confidence</div>
                <div className={c.sliderWrapper}>
                    <Slider
                        value={normalizedValue}
                        min={MIN}
                        max={MAX}
                        step={STEP}
                        onChange={handleSliderChange}
                    />
                    <div className={c.sliderMarks}>
                        <div>{MIN}</div>
                        <div>{MAX}</div>
                    </div>
                </div>
                <div className={c.inputs}>
                    <div className={c.inputField}>
                        <div className={c.filterLabel}>From</div>
                        <Input
                            className={c.input}
                            value={value[0] != null ? value[0] : ''}
                            inputProps={{
                                'step': STEP,
                                'min': MIN,
                                'max': MAX,
                                'type': 'number',
                                'aria-label': 'confidence from',
                            }}
                            onChange={(e) => {
                                handleInputChange('min', e.target.value)
                            }}
                        />
                    </div>
                    <div className={c.inputField}>
                        <div className={c.filterLabel}>To</div>
                        <Input
                            className={c.input}
                            value={value[1] != null ? value[1] : ''}
                            inputProps={{
                                'step': STEP,
                                'min': MIN,
                                'max': MAX,
                                'type': 'number',
                                'aria-label': 'confidence to',
                            }}
                            onChange={(e) => {
                                handleInputChange('max', e.target.value)
                            }}
                        />
                    </div>
                </div>
            </div>
            {total > 0 && (
                <div className={c.showing}>
                    Showing {shown} of {total} detections
                </div>
            )}
        </div>
    )
}

MLLayers.propTypes = {
    features: PropTypes.array,
    featuresOn: PropTypes.array,
    classes: PropTypes.object,
    model: PropTypes.object,
    onChange: PropTypes.func,
}

export default MLLayers
