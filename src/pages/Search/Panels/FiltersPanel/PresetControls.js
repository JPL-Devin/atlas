import React, { useId, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import {
    Box, Button, Chip, IconButton, Snackbar, Tooltip, Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RefreshIcon from '@mui/icons-material/Refresh'
import TuneIcon from '@mui/icons-material/Tune'

import { getFilterPreset, getFilterPresets } from '../../../../config/filterPresets'
import PresetPicker from './PresetPicker'
import { getPresetFilterKeys, makePresetFilters, planPresetSwitch, sameFilterLayout } from '../../../../core/searchPresetState'
import { changeSearchPreset, dismissSearchPresetChange, resetFilters, undoSearchPresetChange } from '../../../../core/redux/actions/actions'

export const PresetReset = ({ disabled }) => {
    const dispatch = useDispatch()

    return (
        <Tooltip title="Reset Filters" arrow>
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
    const modified = preset && !sameFilterLayout(current, makePresetFilters(mapping, preset))
    const activeId = presetId || 'all'
    const label = preset?.label || 'All Atlas'
    const subtitle = <>
        <TuneIcon sx={{ fontSize: 16, flexShrink: 0 }} />
        <Typography component="span" sx={{ fontSize: 13, fontWeight: 650, overflowWrap: 'anywhere' }}>{label}</Typography>
    </>
    const getPreview = (item) => {
        const { filters, kept } = planPresetSwitch(current, makePresetFilters(mapping, item))
        return { filters: item.id === activeId ? current : filters, kept }
    }

    return (
        <>
            <Box ref={presetRow} role="group" aria-label="Filter preset" sx={{
                display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 8px', px: 3, pb: 1.5,
            }}>
                {selectable ? (
                    <Button size="small" aria-label={`Change filter preset: ${label}`}
                        onClick={() => setAnchor(presetRow.current)} aria-haspopup="dialog"
                        aria-expanded={Boolean(anchor)} aria-controls={anchor ? pickerId : undefined}
                        sx={{
                            minHeight: 27, minWidth: 0, gap: 1.5, px: 1, ml: -1,
                            justifyContent: 'flex-start', textAlign: 'left', textTransform: 'none',
                            color: '#1559bf', bgcolor: anchor ? '#dae9ff' : undefined,
                            '&:hover': { bgcolor: '#e1edfc' },
                        }}
                    >
                        {subtitle}
                        <ExpandMoreIcon sx={{ fontSize: 16, flexShrink: 0 }} />
                    </Button>
                ) : <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 27 }}>{subtitle}</Box>}
                {modified && <Chip label="Modified" size="small" color="info" variant="outlined" sx={{ height: 19 }} />}
            </Box>
            {anchor && <PresetPicker id={pickerId} anchor={anchor} presets={presets} activeId={activeId}
                getPreview={getPreview}
                onClose={() => setAnchor(null)}
                onSelect={(item) => {
                    setAnchor(null)
                    if (item.id !== activeId) {
                        dispatch(changeSearchPreset(item.id))
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
