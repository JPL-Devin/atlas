import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import SplitButton from '../SplitButton/SplitButton'

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'

import { setResultSorting } from '../../core/redux/actions/actions.js'
import { ES_PATHS } from '../../core/constants'
import { getFieldLabel } from '../../core/recordPresentation'

import { makeStyles } from '@mui/styles'
import { Typography } from '@mui/material'

// Always offered, above the filter and column driven sorts
const PINNED_SORT_FIELDS = [ES_PATHS.ml_novelty_score.join('.'), ES_PATHS.start_time.join('.')]

const useStyles = makeStyles((theme) => ({
    ResultsSorter: {
        height: '26px',
        marginLeft: '4px',
        margin: '7px 5px',
    },
    label: {
        lineHeight: '26px',
        paddingRight: '4px',
        fontSize: '10px',
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    flex: {
        'display': 'flex',
        '& > svg': {
            paddingTop: '2px',
        },
    },
}))

// items is [{ name: 'My Items' }, { ... }]

export default function ResultsSorter(props) {
    const {} = props

    const c = useStyles()
    const dispatch = useDispatch()

    const activeFilters = useSelector((state) => {
        return state.getIn(['activeFilters'])
    }).toJS()

    const resultsTable = useSelector((state) => {
        return state.getIn(['resultsTable'])
    }).toJS()

    const resultSorting = useSelector((state) => {
        return state.getIn(['resultSorting'])
    }).toJS()

    //Primary sorts, always offered first regardless of filters and columns
    const flatFields = [resultSorting.defaultField]
    PINNED_SORT_FIELDS.forEach((field) => {
        if (!flatFields.includes(field)) flatFields.push(field)
    })

    const items = flatFields.map((field) => ({ name: field, label: getFieldLabel(field) }))
    items[items.length - 1].dividerAfter = true

    //Add all active filters as potential sorts
    Object.keys(activeFilters).forEach((filter) => {
        activeFilters[filter].facets.forEach((f) => {
            if (f.type != 'text' && f.field !== '*' && !flatFields.includes(f.field)) {
                items.push({ name: f.field, label: getFieldLabel(f.field) })
                flatFields.push(f.field)
            }
        })
    })

    //Add all table columns as potential sorts
    resultsTable.columns.forEach((field) => {
        if (!flatFields.includes(field)) {
            items.push({ name: field, label: getFieldLabel(field) })
            flatFields.push(field)
        }
    })

    if (resultSorting.field != null && !flatFields.includes(resultSorting.field)) {
        items.push({ name: resultSorting.field, label: getFieldLabel(resultSorting.field) })
    }

    let selectedIndex = items.findIndex((item) => item.name === resultSorting.field)
    if (selectedIndex === -1) selectedIndex = null

    return (
        <SplitButton
            className={c.ResultsSorter}
            startIcon={
                resultSorting.direction === 'desc' ? (
                    <div className={c.flex}>
                        <Typography className={c.label}>Sort</Typography>
                        <ArrowDownwardIcon />
                    </div>
                ) : (
                    <div className={c.flex}>
                        <Typography className={c.label}>Sort</Typography>
                        <ArrowUpwardIcon />
                    </div>
                )
            }
            items={items}
            variant="outlined"
            forceIndex={selectedIndex}
            onChange={(item, index) => {
                dispatch(setResultSorting(item.name))
            }}
            onClick={() => {
                dispatch(
                    setResultSorting(null, resultSorting.direction === 'desc' ? 'asc' : 'desc')
                )
            }}
        />
    )
}
