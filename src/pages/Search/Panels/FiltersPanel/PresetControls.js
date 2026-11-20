import React, { useId, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import {
    Box, Button, IconButton, Tooltip,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RefreshIcon from '@mui/icons-material/Refresh'
import UndoIcon from '@mui/icons-material/Undo'

import { getFilterPreset, getFilterPresets } from '../../../../config/filterPresets'
import PresetPicker from './PresetPicker'
import { getAppConfig } from '../../../../core/appConfig'
import { getPresetFilterKeys, getPresetPreview, makePresetFilters, sameFilterLayout } from '../../../../core/searchPresetState'
import { changeSearchPreset, resetFilters, undoSearchPresetChange } from '../../../../core/redux/actions/actions'

export const PresetUndo = () => {
    const dispatch = useDispatch()
    const undo = useSelector((state) => state.get('searchPresetUndo'))
    const activeId = useSelector((state) => state.get('searchPresetId'))
    if (!undo) {
        return null
    }

    const previous = getFilterPreset(undo.presetId || 'all')?.label || getAppConfig().appTitle
    const title = undo.presetId === activeId
        ? `Undo preset reset: restore previous ${previous} filters`
        : `Undo preset change: restore ${previous}`

    return (
        <Tooltip title={title} arrow>
            <IconButton aria-label={title} onClick={() => dispatch(undoSearchPresetChange())}
                sx={{ color: '#656666', '& svg': { fontSize: 18 } }}
            >
                <UndoIcon />
            </IconButton>
        </Tooltip>
    )
}

export const PresetReset = ({ disabled }) => {
    const dispatch = useDispatch()
    const resetTitle = useSelector((state) => {
        const id = state.get('searchPresetId')
        if (state.get('filterType') !== 'basic') {
            return 'Restore default filters and values'
        }
        if (!id) {
            return getFilterPreset('all') ? `Restore standard ${getAppConfig().appTitle} filters and default values` : 'Restore default filters and values'
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
    const simple = getAppConfig().presetPickerMode === 'simple'
    if (!presets.length) {
        return null
    }

    const current = active.toJS()
    const modified = preset && !sameFilterLayout(current, makePresetFilters(mapping, preset), retainedKeys)
    const activeId = presetId || 'all'
    const label = <>
        <Box component="span" sx={{ color: '#465671', fontWeight: 400 }}>Preset:</Box>{' '}
        <Box component="span" sx={{ color: '#1559bf', fontWeight: 700 }}>{preset?.label || getFilterPreset('all')?.label || 'Default'}</Box>
        {modified && <>{' '}<Box component="span" sx={{ color: '#725013', fontSize: 11, fontWeight: 500 }}>(modified)</Box></>}
    </>
    const getPreview = (item) => getPresetPreview(current, makePresetFilters(mapping, item), item.id === activeId)

    return (
        <>
            <Box ref={presetRow} role="group" aria-label="Filter preset" sx={{ px: 3, pb: 2, minWidth: 0 }}>
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
            </Box>
            {anchor && <PresetPicker id={pickerId} anchor={anchor} presets={presets} activeId={activeId}
                simple={simple} getPreview={getPreview}
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

export const usePresetFilterKeys = () => {
    const id = useSelector((state) => state.get('searchPresetId'))
    const preset = getFilterPreset(id)
    return { preset, keys: getPresetFilterKeys(preset) }
}
