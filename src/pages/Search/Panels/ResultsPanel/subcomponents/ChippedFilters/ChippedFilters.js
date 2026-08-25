import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { setFieldState, setMapSearchBoundary } from '../../../../../../core/redux/actions/actions'

import { clearDrawnMapBoundary } from '../../../../../../CartoCosmos/js/mapBoundary'

import { getActiveFilterChips } from './activeFilterChips'

import { makeStyles } from '@mui/styles'
import Chip from '@mui/material/Chip'

const useStyles = makeStyles((theme) => ({
    ChippedFilters: {
        height: '24px',
        minHeight: '24px',
        padding: theme.spacing(1),
    },
    chip: {
        'margin': `0 ${theme.spacing(1)}`,
        'color': theme.palette.text.primary,
        'border': `1px solid rgba(0,0,0,0.23)`,
        '& svg': {
            'color': theme.palette.text.primary,
            'transition': 'color 0.2s ease-out',
            '&:hover': {
                color: `${theme.palette.swatches.red.red500} !important`,
            },
        },
    },
}))

const ChippedFilters = () => {
    const c = useStyles()
    const dispatch = useDispatch()

    const activeFilters = useSelector((state) => {
        return state.getIn(['activeFilters'])
    }).toJS()

    const chips = getActiveFilterChips(activeFilters)

    return (
        <div className={c.ChippedFilters}>
            {chips.map((chip) => (
                <Chip
                    className={c.chip}
                    label={chip.label}
                    key={chip.id}
                    onDelete={() => {
                        if (chip.isMapBoundary) {
                            clearDrawnMapBoundary()
                            dispatch(setMapSearchBoundary())
                            return
                        }
                        dispatch(
                            setFieldState(chip.filterKey, chip.facetId, {
                                [chip.stateKey]: !(chip.currentValue || false),
                            })
                        )
                    }}
                    variant="outlined"
                    size="small"
                />
            ))}
        </div>
    )
}

export default ChippedFilters
