import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { styled } from '@mui/material/styles'
import PropTypes from 'prop-types'

import Button from '@mui/material/Button'

import moment from 'moment'

import { setFieldState } from '../../../../core/redux/actions/actions.js'
import { getIn, prettify } from '../../../../core/utils.js'
import { ClearButton , BottomDiv } from '../../../shared/FilterComponents'

import InputLabel from '@mui/material/InputLabel'
import FormHelperText from '@mui/material/FormHelperText'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers'

const WrapperDiv = styled('div')(({ theme }) => ({
    width: '100%',
    padding: `4px ${theme.spacing(2)}`,
    boxSizing: 'border-box',
}))

const SettingsDiv = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isActive',
})(({ theme, isActive }) => ({
    width: '100%',
    height: '0px',
    overflow: 'hidden',
    borderBottom: `1px solid ${theme.palette.swatches.grey.grey300}`,
    boxSizing: 'border-box',
    opacity: '0',
    transition:
        'height 0.2s ease-out, opacity 0.2s ease-out, padding 0.2s ease-out, margin 0.2s ease-out',
    ...(isActive && {
        height: '66px',
        opacity: '1',
        paddingTop: '8px',
        marginBottom: '8px',
    }),
}))

const GapDiv = styled('div')(({ theme }) => ({
    textAlign: 'center',
    position: 'relative',
    top: '-9px',
    fontWeight: 'bold',
    fontSize: '12px',
    color: theme.palette.swatches.grey.grey500,
}))

const PickerDiv = styled('div')(({ theme }) => ({
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.accent.main,
    },
    '& .MuiFormLabel-root.MuiInputLabel-root': {
        color: theme.palette.swatches.grey.grey600,
    },
}))

const StyledDatePicker = styled(DateTimePicker)(({ theme }) => ({
    'width': '100%',
    '& .MuiOutlinedInput-input': {
        padding: 8,
    },
    '& .MuiFormLabel-root': {
        top: -8,
        color: 'rgba(0,0,0,0.54)',
    },
    '& .MuiFormHelperText-root': {
        color: theme.palette.swatches.grey.grey500,
        marginLeft: '8px',
    },
}))

const DatesOutOfOrderDiv = styled('div')(({ theme }) => ({
    textAlign: 'center',
    marginTop: '8px',
    color: theme.palette.swatches.red.red500,
    fontWeight: 'bold',
}))


const DateRangeFilter = (props) => {
    const { filterKey, facetId, alone, settingsActive } = props

    const dispatch = useDispatch()
    let facet = useSelector((state) => {
        return state.getIn(['activeFilters', filterKey, 'facets', facetId])
    })
    facet = facet ? facet.toJS() : {}

    const facetName = facet.field_name || filterKey

    const formats = [
        {
            format: 'YYYY-MM-DD',
            example: '2022-02-10',
            useTime: false,
            views: ['year', 'month', 'day'],
        },
        {
            format: 'YYYY-MM-DD HH:mm',
            example: '2022-02-10 19:59',
            useTime: true,
            views: ['year', 'month', 'day', 'hours', 'minutes'],
        },
        // Commenting out day of year format because the newer MUI DateTimePicker does not support day of year
        // date formats. If support is added in the future we can try enabling this format again
        // { format: 'YYYY-DDDD', example: '2022-078', useTime: false, views: ['year', 'day'] },
    ]

    const defaultMinDate = '1965-01-01'
    const [minDate, setMinDate] = useState(moment(defaultMinDate))
    const [maxDate, setMaxDate] = useState(moment(`${moment().year()}-12-31`))
    const [dateFormatIdx, setDateFormatIdx] = useState(0)
    const dateFormat = formats[dateFormatIdx].format
    const [selectedStartDate, handleStartDateChange] = useState(
        facet.state?.daterange?.start?.length > 0 ? moment.utc(facet.state.daterange.start, dateFormat) : null
    )
    const [selectedEndDate, handleEndDateChange] = useState(
        facet.state?.daterange?.end?.length > 0 ? moment.utc(facet.state.daterange.end, dateFormat) : null
    )
    const noDates = selectedStartDate === null && selectedEndDate === null
    const bothDates = selectedStartDate && selectedEndDate ? true : false

    useEffect(() => {
        if (facet.state?.daterange === false) {
            handleStartDateChange(null)
            handleEndDateChange(null)
        } else if (facet.state?.daterange?.start || facet.state?.daterange?.end) {
            // Update local state when daterange is set (e.g., from deeplink)
            const start = facet.state.daterange.start?.length > 0
                ? moment.utc(facet.state.daterange.start, dateFormat)
                : null
            const end = facet.state.daterange.end?.length > 0
                ? moment.utc(facet.state.daterange.end, dateFormat)
                : null
            handleStartDateChange(start)
            handleEndDateChange(end)
        }
    }, [JSON.stringify(facet.state), dateFormat])

    useEffect(() => {
        if (facet.fields && facet.fields.length > 0) {
            setMinDate(moment(Math.max(facet.fields[0].key, moment(defaultMinDate).utc())))
            setMaxDate(moment(facet.fields[facet.fields.length - 1].key + 2592000000)) //+ 30day to fill out bucket
        }
    }, [JSON.stringify(facet.fields)])

    const handleDateFormatChange = (nextIdx) => {
        if (selectedStartDate !== null)
            handleStartDateChange(moment.utc(selectedStartDate, dateFormat))
        if (selectedEndDate !== null) handleEndDateChange(moment.utc(selectedEndDate, dateFormat))
        setDateFormatIdx(nextIdx)
    }
    const handleClear = () => {
        if (!noDates)
            dispatch(
                setFieldState(filterKey, facetId, {
                    daterange: false,
                })
            )
        handleStartDateChange(null)
        handleEndDateChange(null)
    }
    const handleSubmit = () => {
        let formattedStartDate = selectedStartDate
        let formattedEndDate = selectedEndDate
        if (facet.field_format === 'ISO') {
            if (formattedStartDate !== null)
                formattedStartDate = moment(
                    moment.utc(formattedStartDate, dateFormat).valueOf()
                ).toISOString()
            if (formattedEndDate !== null)
                formattedEndDate = moment(
                    moment.utc(formattedEndDate, dateFormat).valueOf()
                ).toISOString()
        }

        dispatch(
            setFieldState(filterKey, facetId, {
                daterange: {
                    start: formattedStartDate,
                    end: formattedEndDate,
                },
            })
        )
    }

    return (
        <div>
            {!alone ? <div>{prettify(facetName)}</div> : null}
            <WrapperDiv>
                <SettingsDiv isActive={settingsActive}>
                    <FormControl variant="outlined">
                        <InputLabel htmlFor="outlined-date-format">Date Format</InputLabel>
                        <Select
                            value={dateFormatIdx}
                            onChange={(e) => {
                                handleDateFormatChange(e.target.value)
                            }}
                            label="Date Format"
                            labelId="outlined-date-format"
                        >
                            {formats.map((f, idx) => {
                                return (
                                    <MenuItem key={idx} value={idx}>
                                        {f.format}
                                    </MenuItem>
                                )
                            })}
                        </Select>
                        <FormHelperText>
                            {`For example, "${formats[dateFormatIdx].example}"`}
                        </FormHelperText>
                    </FormControl>
                </SettingsDiv>
                <PickerDiv>
                    <InputLabel htmlFor="start-date-picker">Start Date</InputLabel>
                    <StyledDatePicker
                        id={'start-date-picker'}
                        ampm={false}
                        value={selectedStartDate}
                        onChange={(val, context) => {
                            if (context.validationError === null) handleStartDateChange(val)
                        }}
                        format={dateFormat}
                        openTo="year"
                        disableFuture={true}
                        minDate={minDate}
                        maxDate={maxDate}
                        slotProps={{
                            textField: {
                                InputLabelProps: {
                                    shrink: false,
                                },
                                helperText: `Min: ~${moment.utc(minDate).format(dateFormat)}`,
                            },
                        }}
                        views={formats[dateFormatIdx].views}
                        viewRenderers={{
                            hours: formats[dateFormatIdx].useTime ? renderTimeViewClock : null,
                            minutes: formats[dateFormatIdx].useTime ? renderTimeViewClock : null,
                            seconds: formats[dateFormatIdx].useTime ? renderTimeViewClock : null,
                        }}
                    />
                </PickerDiv>
                <GapDiv>to</GapDiv>
                <PickerDiv>
                    <InputLabel htmlFor="end-date-picker">End Date</InputLabel>
                    <StyledDatePicker
                        id={'end-date-picker'}
                        ampm={false}
                        value={selectedEndDate}
                        onChange={(val, context) => {
                            if (context.validationError === null) handleEndDateChange(val)
                        }}
                        format={dateFormat}
                        openTo="year"
                        disableFuture={true}
                        minDate={minDate}
                        maxDate={maxDate}
                        slotProps={{
                            textField: {
                                InputLabelProps: {
                                    shrink: false,
                                },
                                helperText: `Max: ~${moment.utc(maxDate).format(dateFormat)}`,
                            },
                        }}
                        views={formats[dateFormatIdx].views}
                        viewRenderers={{
                            hours: formats[dateFormatIdx].useTime ? renderTimeViewClock : null,
                            minutes: formats[dateFormatIdx].useTime ? renderTimeViewClock : null,
                            seconds: formats[dateFormatIdx].useTime ? renderTimeViewClock : null,
                        }}
                    />
                </PickerDiv>
                {bothDates && selectedStartDate.utc() > selectedEndDate.utc() && (
                    <DatesOutOfOrderDiv>Start Date occurs after End Date!</DatesOutOfOrderDiv>
                )}
            </WrapperDiv>
            <BottomDiv sx={{ padding: (theme) => `0px ${theme.spacing(2)}`, display: 'flex', justifyContent: 'space-between' }}>
                <ClearButton
                    size="small"
                    variant="contained"
                    onClick={handleClear}
                    disabled={selectedStartDate !== null || selectedEndDate !== null}
                >
                    Clear
                </ClearButton>
                <Button
                    size="small"
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={
                        selectedStartDate?.utc() > selectedEndDate?.utc() ||
                        (selectedStartDate === null && selectedStartDate === null)
                    }
                >
                    Search
                </Button>
            </BottomDiv>
        </div>
    )
}

DateRangeFilter.propTypes = {
    filterKey: PropTypes.string.isRequired,
    facetId: PropTypes.number.isRequired,
}

export default DateRangeFilter
