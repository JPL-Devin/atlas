import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles } from '@mui/styles'
import PropTypes from 'prop-types'

import clsx from 'clsx'

import Button from '@mui/material/Button'

import moment from 'moment'

import { setFieldState } from '../../../../core/redux/actions/actions.js'
import { getIn, prettify } from '../../../../core/utils.js'

import InputLabel from '@mui/material/InputLabel'
import FormHelperText from '@mui/material/FormHelperText'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers'

const useStyles = makeStyles((theme) => ({
    // DateRangeFilter: {
    //     width: '100%',
    //     display: 'flex',
    //     flexFlow: 'column',
    // },
    // notAlone: {
    //     paddingTop: '10px',
    //     position: 'relative',
    // },
    // title: {
    //     position: 'absolute',
    //     left: '50%',
    //     top: '146px',
    //     transform: 'translateX(-50%)',
    //     color: theme.palette.swatches.grey.grey400,
    // },
    wrapper: {
        width: '100%',
        padding: `4px ${theme.spacing(2)}`,
        boxSizing: 'border-box',
    },
    settings: {
        width: '100%',
        height: '0px',
        overflow: 'hidden',
        borderBottom: `1px solid ${theme.palette.swatches.grey.grey300}`,
        boxSizing: 'border-box',
        opacity: '0',
        transition:
            'height 0.2s ease-out, opacity 0.2s ease-out, padding 0.2s ease-out, margin 0.2s ease-out',
    },
    settingsActive: {
        height: '66px',
        opacity: '1',
        paddingTop: '8px',
        marginBottom: '8px',
    },
    // formControl: {
    //     width: '100%',
    //     marginBottom: '8px',
    // },
    // formHelperText: {
    //     color: theme.palette.swatches.grey.grey600,
    //     marginTop: '1px',
    //     marginLeft: '9px',
    // },
    gap: {
        textAlign: 'center',
        position: 'relative',
        top: '-9px',
        fontWeight: 'bold',
        fontSize: '12px',
        color: theme.palette.swatches.grey.grey500,
    },
    picker: {
        //     'display': 'flex',
        //     'justifyContent': 'space-between',
        //     '& .MuiOutlinedInput-input': {
        //         padding: '8px',
        //     },
        //     '& .MuiOutlinedInput-adornedEnd': {
        //         paddingRight: '0px',
        //     },
        //     '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
        //         borderColor: theme.palette.accent.main,
        //     },
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.accent.main,
        },
        '& .MuiFormLabel-root.MuiInputLabel-root': {
            color: theme.palette.swatches.grey.grey600,
        },
    },
    datePicker: {
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
    },
    // pickerModal: {
    //     '& .MuiPickersToolbar-toolbar': {
    //         background: theme.palette.swatches.grey.grey150,
    //     },
    //     '& .MuiDialogActions-root': {
    //         'background': theme.palette.swatches.grey.grey150,
    //         '& .MuiButton-label': {
    //             color: theme.palette.text.primary,
    //         },
    //     },
    //     '& .MuiPickersYear-root': {
    //         height: '30px',
    //     },
    //     '& .MuiPickersYear-root:focus': {
    //         color: theme.palette.text.primary,
    //     },
    //     '& .MuiPickersYear-yearSelected': {
    //         color: theme.palette.accent.main,
    //     },
    //     '& .MuiPickersClock-pin': {
    //         background: theme.palette.swatches.grey.grey800,
    //     },
    //     '& .MuiPickersClockPointer-pointer': {
    //         background: theme.palette.swatches.grey.grey400,
    //     },
    //     '& .MuiPickersClockPointer-thumb': {
    //         borderColor: theme.palette.accent.main,
    //     },
    //     '& .MuiPickersClockPointer-noPoint': {
    //         background: theme.palette.accent.main,
    //     },
    //     '& .MuiPickersClockNumber-clockNumberSelected': {
    //         color: 'white',
    //     },
    // },
    datesOutOfOrder: {
        textAlign: 'center',
        marginTop: '8px',
        color: theme.palette.swatches.red.red500,
        fontWeight: 'bold',
    },
    bottom: {
        marginTop: theme.spacing(2),
        padding: `0px ${theme.spacing(2)}`,
        display: 'flex',
        justifyContent: 'space-between',
    },
    clear: {
        'background': theme.palette.swatches.grey.grey500,
        '&:hover': {
            background: theme.palette.swatches.red.red500,
        },
    },
    submit: {},
}))

// Saved values are UTC ISO 8601 date-times ("2022-02-10T19:59:00.000Z") or dates ("2022-02-10").
// A date-only end value covers the whole day, matching how OpenSearch treats a date-only `lte`.
const parseSavedDate = (value, isEnd) => {
    if (typeof value !== 'string' || value.length === 0) {
        return null
    }
    const parsed = moment.utc(value, moment.ISO_8601)
    if (!parsed.isValid()) {
        return null
    }
    return isEnd && !value.includes('T') ? parsed.endOf('day') : parsed
}

const DateRangeFilter = (props) => {
    const { filterKey, facetId, alone, settingsActive } = props
    const c = useStyles()

    const dispatch = useDispatch()
    let facet = useSelector((state) => {
        return state.getIn(['activeFilters', filterKey, 'facets', facetId])
    })
    facet = facet ? facet.toJS() : {}

    const facetName = facet.field_name || filterKey

    // Displayed and queried in UTC. Start rounds down / end rounds up to `unit` (inclusive range).
    const formats = [
        {
            format: 'YYYY-MM-DD HH:mm',
            example: '2022-02-10 19:59',
            useTime: true,
            unit: 'minute',
            views: ['year', 'month', 'day', 'hours', 'minutes'],
        },
        {
            format: 'YYYY-MM-DD HH:mm:ss',
            example: '2022-02-10 19:59:30',
            useTime: true,
            unit: 'second',
            views: ['year', 'month', 'day', 'hours', 'minutes', 'seconds'],
        },
        {
            format: 'YYYY-MM-DD',
            example: '2022-02-10',
            useTime: false,
            unit: 'day',
            views: ['year', 'month', 'day'],
        },
        // Commenting out day of year format because the newer MUI DateTimePicker does not support day of year
        // date formats. If support is added in the future we can try enabling this format again
        // { format: 'YYYY-DDDD', example: '2022-078', useTime: false, views: ['year', 'day'] },
    ]

    const defaultMinDate = '1965-01-01'
    const [minDate, setMinDate] = useState(moment.utc(defaultMinDate))
    const [maxDate, setMaxDate] = useState(moment.utc(`${moment.utc().year()}-12-31`))
    const [dateFormatIdx, setDateFormatIdx] = useState(0)
    const dateFormat = formats[dateFormatIdx].format
    const dateUnit = formats[dateFormatIdx].unit
    const [selectedStartDate, handleStartDateChange] = useState(
        parseSavedDate(facet.state?.daterange?.start)
    )
    const [selectedEndDate, handleEndDateChange] = useState(
        parseSavedDate(facet.state?.daterange?.end, true)
    )
    const noDates = selectedStartDate === null && selectedEndDate === null
    const bothDates = selectedStartDate && selectedEndDate ? true : false
    const hasSavedRange =
        facet.state?.daterange?.start || facet.state?.daterange?.end ? true : false

    useEffect(() => {
        if (facet.state?.daterange === false) {
            handleStartDateChange(null)
            handleEndDateChange(null)
        } else if (facet.state?.daterange?.start || facet.state?.daterange?.end) {
            // Update local state when daterange is set (e.g., from deeplink)
            handleStartDateChange(parseSavedDate(facet.state.daterange.start))
            handleEndDateChange(parseSavedDate(facet.state.daterange.end, true))
        }
    }, [JSON.stringify(facet.state)])

    useEffect(() => {
        if (facet.fields && facet.fields.length > 0) {
            setMinDate(moment.utc(Math.max(facet.fields[0].key, moment.utc(defaultMinDate))))
            setMaxDate(moment.utc(facet.fields[facet.fields.length - 1].key + 2592000000)) //+ 30day to fill out bucket
        }
    }, [JSON.stringify(facet.fields)])

    const handleDateFormatChange = (nextIdx) => {
        setDateFormatIdx(nextIdx)
    }
    const handleClear = () => {
        if (!noDates || hasSavedRange)
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
            if (formattedStartDate !== null) {
                formattedStartDate = moment.utc(formattedStartDate).startOf(dateUnit).toISOString()
            }
            if (formattedEndDate !== null) {
                formattedEndDate = moment.utc(formattedEndDate).endOf(dateUnit).toISOString()
            }
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
        <div
            className={clsx(c.DateRangeFilter, {
                [c.notAlone]: !alone,
            })}
        >
            {!alone ? <div className={c.title}>{prettify(facetName)}</div> : null}
            <div className={c.wrapper}>
                <div className={clsx(c.settings, { [c.settingsActive]: settingsActive })}>
                    <FormControl className={c.formControl} variant="outlined">
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
                        <FormHelperText className={c.formHelperText}>
                            {`For example, "${formats[dateFormatIdx].example}"`}
                        </FormHelperText>
                    </FormControl>
                </div>
                <div className={c.picker}>
                    <InputLabel htmlFor="start-date-picker">Start (UTC)</InputLabel>
                    <DateTimePicker
                        id={'start-date-picker'}
                        className={c.datePicker}
                        ampm={false}
                        timezone="UTC"
                        value={selectedStartDate}
                        onChange={(val, context) => {
                            if (context.validationError === null) handleStartDateChange(val)
                        }}
                        format={dateFormat}
                        openTo="year"
                        disableFuture={true}
                        minDate={minDate}
                        maxDate={maxDate}
                        //invalidDateMessage={`Invalid Format. Use ${dateFormat}`}
                        //DialogProps={{
                        //    className: c.pickerModal,
                        //}}
                        slotProps={{
                            textField: {
                                InputLabelProps: {
                                    shrink: false,
                                },
                                helperText: `Min: ~${moment.utc(minDate).format(dateFormat)} UTC`,
                            },
                        }}
                        views={formats[dateFormatIdx].views}
                        viewRenderers={{
                            hours: formats[dateFormatIdx].useTime ? renderTimeViewClock : null,
                            minutes: formats[dateFormatIdx].useTime ? renderTimeViewClock : null,
                            seconds: formats[dateFormatIdx].useTime ? renderTimeViewClock : null,
                        }}
                    />
                </div>
                <div className={c.gap}>to</div>
                <div className={c.picker}>
                    <InputLabel htmlFor="end-date-picker">End (UTC)</InputLabel>
                    <DateTimePicker
                        id={'end-date-picker'}
                        className={c.datePicker}
                        ampm={false}
                        timezone="UTC"
                        value={selectedEndDate}
                        onChange={(val, context) => {
                            if (context.validationError === null) handleEndDateChange(val)
                        }}
                        format={dateFormat}
                        openTo="year"
                        disableFuture={true}
                        minDate={minDate}
                        maxDate={maxDate}
                        //invalidDateMessage={`Invalid Format. Use ${dateFormat}`}
                        //DialogProps={{
                        //    className: c.pickerModal,
                        //}}
                        slotProps={{
                            textField: {
                                InputLabelProps: {
                                    shrink: false,
                                },
                                helperText: `Max: ~${moment.utc(maxDate).format(dateFormat)} UTC`,
                            },
                        }}
                        views={formats[dateFormatIdx].views}
                        viewRenderers={{
                            hours: formats[dateFormatIdx].useTime ? renderTimeViewClock : null,
                            minutes: formats[dateFormatIdx].useTime ? renderTimeViewClock : null,
                            seconds: formats[dateFormatIdx].useTime ? renderTimeViewClock : null,
                        }}
                    />
                </div>
                {bothDates && selectedStartDate.utc() > selectedEndDate.utc() && (
                    <div className={c.datesOutOfOrder}>Start Date occurs after End Date!</div>
                )}
            </div>
            <div className={c.bottom}>
                <Button
                    className={c.clear}
                    size="small"
                    variant="contained"
                    onClick={handleClear}
                    disabled={noDates && !hasSavedRange}
                >
                    Clear
                </Button>
                <Button
                    className={c.submit}
                    size="small"
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={selectedStartDate?.utc() > selectedEndDate?.utc() || noDates}
                >
                    Search
                </Button>
            </div>
        </div>
    )
}

DateRangeFilter.propTypes = {
    filterKey: PropTypes.string.isRequired,
    facetId: PropTypes.number.isRequired,
}

export default DateRangeFilter
