import React, { useId, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import {
    Box, Button, Chip, IconButton, Snackbar, Tooltip, Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RefreshIcon from '@mui/icons-material/Refresh'

import { getFilterPreset, getFilterPresets } from '../../../../config/filterPresets'
import PresetPicker from './PresetPicker'
import { getPresetFilterKeys, makePresetFilters, planPresetSwitch, sameFilterLayout } from '../../../../core/searchPresetState'
import { changeSearchPreset, dismissSearchPresetChange, resetFilters, undoSearchPresetChange } from '../../../../core/redux/actions/actions'

export const PresetReset = ({ disabled }) => {
    const dispatch = useDispatch()
    const restoresEntry = useSelector((state) => {
        const id = state.get('searchPresetId')
        return state.get('filterType') === 'basic' && Boolean(id) && state.get('searchPresetEntry')?.presetId === id
    })

    return (
        <Tooltip title={restoresEntry ? 'Restore starting filters and values' : 'Restore default filters and values'} describeChild arrow>
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
    const getPreview = (item) => {
        const plan = planPresetSwitch(current, makePresetFilters(mapping, item))
        const isActive = item.id === activeId
        return {
            isActive, filters: isActive ? current : plan.filters, kept: plan.kept,
            added: isActive ? [] : plan.added.map((key) => ({ key, displayName: plan.filters[key].display_name })),
            removed: isActive ? [] : plan.removed.map((key) => ({ key, displayName: current[key].display_name })),
        }
    }

    return (
        <>
            <Box ref={presetRow} role="group" aria-label="Filter layout" sx={{ px: 3, pb: 2, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 8px', mb: 1 }}>
                    <Typography component="span" sx={{ fontSize: 12, fontWeight: 700 }}>Filter layout</Typography>
                    {modified && <Chip id={`${pickerId}-modified`} label="Layout modified" size="small" color="info"
                        variant="outlined" sx={{ height: 19 }} />}
                </Box>
                {selectable ? (
                    <Button size="small" variant="outlined" fullWidth aria-label={`Change filter layout: ${label}`}
                        onClick={() => setAnchor(presetRow.current)} aria-haspopup="dialog"
                        aria-expanded={Boolean(anchor)} aria-controls={anchor ? pickerId : undefined}
                        aria-describedby={modified ? `${pickerId}-modified` : undefined}
                        sx={{
                            minHeight: { xs: 40, md: 34 }, minWidth: 0, gap: 1.5, px: 2,
                            justifyContent: 'space-between', textAlign: 'left', textTransform: 'none',
                            fontSize: 13, fontWeight: 650, color: '#1559bf', borderColor: '#81a5dd',
                            bgcolor: anchor ? '#dae9ff' : '#fff',
                            '&:hover': { bgcolor: '#e1edfc' },
                        }}
                    >
                        <Box component="span" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>{label}</Box>
                        <ExpandMoreIcon sx={{ fontSize: 16, flexShrink: 0 }} />
                    </Button>
                ) : <Typography variant="body2" sx={{ fontWeight: 650 }}>{label}</Typography>}
                {selectable && <Typography sx={{ mt: 1, fontSize: 11, color: '#465671' }}>Controls shown in Basic Filters.</Typography>}
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
