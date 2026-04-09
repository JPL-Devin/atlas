import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { styled, useTheme } from '@mui/material/styles'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Slider from '@mui/material/Slider'
import Button from '@mui/material/Button'

import { setSnackBarText } from '../../../../../../../core/redux/actions/actions'
import {
    getIn,
    getPDSUrl,
    prettify,
    abbreviateNumber,
    copyToClipboard,
} from '../../../../../../../core/utils.js'

const MLLayersRoot = styled('div')({
    width: '100%',
    height: '100%',
    color: '#666',
    display: 'flex',
    flexFlow: 'column',
})

const LayerTitle = styled('h4')(({ theme }) => ({
    fontSize: '14px',
    textTransform: 'uppercase',
    fontWeight: 600,
    margin: '0px',
    padding: '12px 12px 8px 12px',
    borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
}))

const Subtitle = styled('h4')({
    fontSize: '13px',
    fontWeight: 400,
    margin: '0px',
    padding: '12px 12px 8px 12px',
})

const LayersSection = styled('div')({
    paddingBottom: '4px',
})

const LayersUl = styled('ul')({
    padding: 0,
    margin: 0,
})

const LayersLi = styled('li')({
    height: '42px',
    width: '100%',
    display: 'flex',
    cursor: 'pointer',
    transition: 'background 0.2s ease-in-out',
})

const StyledCheckbox = styled(Checkbox)({
    padding: '0px 12px',
})

const Message = styled(Typography, {
    shouldForwardProp: (prop) => prop !== 'isChecked',
})(({ isChecked }) => ({
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '42px',
    textTransform: 'capitalize',
    userSelect: 'none',
}))

const FiltersSection = styled('div')({
    '& > ul': {
        margin: 0,
        padding: 0,
    },
})

const SliderWrapper = styled('div')({
    height: '30px',
    width: 'calc(100% - 46px)',
    padding: '4px 23px 4px 23px',
})

const SliderMarks = styled('div')({
    display: 'flex',
    justifyContent: 'space-between',
    margin: '-9px -4px 0px -4px',
    fontSize: '12px',
})

const InputsWrapper = styled('div')({
    display: 'flex',
    justifyContent: 'space-between',
    width: 'calc(100% - 40px)',
    padding: '0px 20px',
})

const StyledTextField = styled(TextField)(({ theme }) => ({
    'width': 'calc(50% - 6px)',
    '& .MuiFormLabel-root': {
        color: theme.palette.swatches.grey.grey700,
    },
}))

const TopBar = styled('div')(({ theme }) => ({
    height: `${theme.headHeights[2]}px`,
    display: 'flex',
    justifyContent: 'flex-end',
    boxSizing: 'border-box',
    borderBottom: `1px solid ${theme.palette.swatches.grey.grey200}`,
    background: theme.palette.swatches.grey.grey0,
}))

const TopBarButton = styled(Button)(({ theme }) => ({
    height: 30,
    margin: '5px',
    color: theme.palette.text.primary,
}))

const MLLayers = (props) => {
  
    const { features, classes, onChange } = props
    const theme = useTheme()

    const dispatch = useDispatch()

    const min = 0.9
    const max = 1
    const step = 0.005
    const [value, setValue] = useState([min, max])
    // A value range the replaces nulls with minmax (in case a user cleared an input field)
    const normalizedValue = [value[0] != null ? value[0] : min, value[1] != null ? value[1] : max]

    const handleSliderChange = (e, newValue) => {
        setValue(newValue)
        onChange('confidence', newValue)
    }
    const handleInputChange = (type, newValue) => {
        if (newValue === '') {
            newValue = null
        } else {
            newValue = parseFloat(newValue)
            if (isNaN(newValue)) return
        }

        let nextValue = [value[0], value[1]]

        if (type === 'min') nextValue[0] = newValue
        else if (type === 'max') nextValue[1] = newValue
        setValue(nextValue)
    }

    return (
        <MLLayersRoot>
            <TopBar>
                <TopBarButton
                    variant="outlined"
                    aria-label="copy ML features"
                    size="small"
                    onClick={() => {
                        copyToClipboard(JSON.stringify({ ml_features: features }, null, 2))
                        dispatch(
                            setSnackBarText('Copied ML Features JSON to Clipboard!', 'success')
                        )
                    }}
                >
                    Copy ML Features JSON
                </TopBarButton>
            </TopBar>
            <LayersSection>
                <LayerTitle>Layers</LayerTitle>
                <LayersUl>
                    {Object.keys(classes).map((key, idx) => {
                        const checkedClass = classes[key] || {}
                        const isChecked = checkedClass.on
                        return (
                            <LayersLi
                                style={{
                                    background: isChecked
                                        ? checkedClass.color
                                        : theme.palette.swatches.grey.grey200,
                                }}
                                key={idx}
                                onClick={() => {
                                    const nextClasses = JSON.parse(JSON.stringify(classes))
                                    nextClasses[key] = nextClasses[key] || {}
                                    nextClasses[key].on = !classes[key].on
                                    onChange('classes', nextClasses)
                                }}
                            >
                                <StyledCheckbox
                                    color="secondary"
                                    checked={isChecked}
                                    title="Select"
                                    aria-label="select"
                                />
                                <Message isChecked={isChecked}>
                                    {prettify(key)}
                                </Message>
                            </LayersLi>
                        )
                    })}
                </LayersUl>
            </LayersSection>
            <FiltersSection>
                <LayerTitle>Filters</LayerTitle>
                <ul>
                    <li>
                        <Subtitle>Confidence</Subtitle>
                        <SliderWrapper>
                            <Slider
                                value={normalizedValue}
                                min={min}
                                max={max}
                                step={step}
                                onChange={handleSliderChange}
                            />
                            <SliderMarks>
                                <div>{min}</div>
                                <div>{max}</div>
                            </SliderMarks>
                        </SliderWrapper>
                        <InputsWrapper>
                            <StyledTextField
                                label="From"
                                value={value[0] != null ? value[0] : ''}
                                margin="dense"
                                onChange={(e) => {
                                    handleInputChange('min', e.target.value)
                                }}
                                inputProps={{
                                    step: step,
                                    min: min,
                                    max: max,
                                    type: 'number',
                                }}
                            />
                            <StyledTextField
                                label="To"
                                value={value[1] != null ? value[1] : ''}
                                margin="dense"
                                onChange={(e) => {
                                    handleInputChange('max', e.target.value)
                                }}
                                inputProps={{
                                    step: step,
                                    min: min,
                                    max: max,
                                    type: 'number',
                                }}
                            />
                        </InputsWrapper>
                    </li>
                </ul>
            </FiltersSection>
        </MLLayersRoot>
    )
}

MLLayers.propTypes = {
    features: PropTypes.array,
    onChange: PropTypes.func,
}

export default MLLayers;
