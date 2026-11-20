import React, { useId, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import {
    Box, Button, IconButton, Snackbar, Tooltip, Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RefreshIcon from '@mui/icons-material/Refresh'

import { getFilterPreset, getFilterPresets } from '../../../../config/filterPresets'
import PresetPicker from './PresetPicker'
import { getPresetFilterKeys, getPresetPreview, makePresetFilters, sameFilterLayout } from '../../../../core/searchPresetState'
import { changeSearchPreset, dismissSearchPresetChange, resetFilters, undoSearchPresetChange } from '../../../../core/redux/actions/actions'

export const PresetReset = ({ disabled }) => {
    const dispatch = useDispatch()
    const resetTitle = useSelector((state) => {
        const id = state.get('searchPresetId')
        if (state.get('filterType') !== 'basic') {
            return 'Restore default filters and values'
        }
        if (!id) {
            return getFilterPreset('all') ? 'Restore standard Atlas filters and default values' : 'Restore default filters and values'
        }
        return state.get('searchPresetEntry')?.presetId === id
            ? 'Restore preset filters and starting values' : 'Restore preset filters and default values'
    })

    return (
        <Tooltip title={resetTitle} describeChild arrow>
            <span>
                <IconButton
                    aria-label="reset filters" disabled={disabled}
                    onClick={() => dispatch(resetFilters())}
                    sx={{ ml: 0.5, color: '#656666', '& svg': { fontSize: 18, transform: 'rotateY(180deg)' } }}
                >
                    <RefreshIcon />
                </IconButton>
            </span>
        </Tooltip>
    )
}

PresetReset.propTypes = {
    disabled: PropTypes.bool,
}

export const PresetIndicator = () => {
    const dispatch = useDispatch()
    const presetId = useSelector((state) => state.get('searchPresetId'))
    const mapping = useSelector((state) => state.getIn(['mappings', 'atlas']))
    const active = useSelector((state) => state.get('activeFilters'))
    const retainedKeys = useSelector((state) => state.get('searchPresetRetainedKeys'))
    const pickerId = useId()
    const presetRow = useRef(null)
    const [anchor, setAnchor] = useState(null)
    const presets = getFilterPresets()
    const preset = getFilterPreset(presetId)
    const selectable = presets.length > 1
    if (!preset && !selectable) {
        return null
    }

    const current = active.toJS()
    const modified = preset && !sameFilterLayout(current, makePresetFilters(mapping, preset), retainedKeys)
    const activeId = presetId || 'all'
    const label = <>
        <Box component="span" sx={{ color: '#465671', fontWeight: 400 }}>Preset:</Box>{' '}
        <Box component="span" sx={{ color: '#1559bf', fontWeight: 700 }}>{preset?.label || getFilterPreset('all')?.label}</Box>
        {modified && <>{' '}<Box component="span" sx={{ color: '#725013', fontSize: 11, fontWeight: 500 }}>(modified)</Box></>}
    </>
    const getPreview = (item) => getPresetPreview(current, makePresetFilters(mapping, item), item.id === activeId)

    return (
        <>
            <Box ref={presetRow} role="group" aria-label="Filter preset" sx={{ px: 3, pb: 2, minWidth: 0 }}>
                {selectable ? (
                    <Button size="small" variant="outlined" fullWidth
                        onClick={() => setAnchor(presetRow.current)} aria-haspopup="dialog"
                        aria-expanded={Boolean(anchor)} aria-controls={anchor ? pickerId : undefined}
                        sx={{
                            minHeight: { xs: 40, md: 34 }, minWidth: 0, gap: 1.5, px: 2,
                            justifyContent: 'space-between', textAlign: 'left', textTransform: 'none',
                            fontSize: 13, color: '#1559bf', borderColor: '#81a5dd',
                            bgcolor: anchor ? '#dae9ff' : '#fff',
                            '&:hover': { bgcolor: '#e1edfc' },
                        }}
                    >
                        <Box component="span" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>{label}</Box>
                        <ExpandMoreIcon sx={{ fontSize: 16, flexShrink: 0 }} />
                    </Button>
                ) : <Typography variant="body2" sx={{ fontSize: 13 }}>{label}</Typography>}
            </Box>
            {anchor && <PresetPicker id={pickerId} anchor={anchor} presets={presets} activeId={activeId}
                getPreview={getPreview}
                onClose={() => setAnchor(null)}
                onApply={(item, clearKeys) => {
                    setAnchor(null)
                    if (item.id !== activeId) {
                        dispatch(changeSearchPreset(item.id, { clearKeys }))
                    }
                }}
            />}
        </>
    )
}

export const PresetNotification = () => {
    const dispatch = useDispatch()
    const message = useSelector((state) => state.get('searchPresetNotification'))
    return <Snackbar open={Boolean(message)} message={message} autoHideDuration={6500}
        onClose={(_, reason) => {
            if (reason !== 'clickaway') {
                dispatch(dismissSearchPresetChange())
            }
        }}
        action={<Button size="small" sx={{ color: '#b6d2ff' }}
            onClick={() => dispatch(undoSearchPresetChange())}>Undo</Button>} />
}

export const usePresetFilterKeys = () => {
    const id = useSelector((state) => state.get('searchPresetId'))
    const preset = getFilterPreset(id)
    return { preset, keys: getPresetFilterKeys(preset) }
}
