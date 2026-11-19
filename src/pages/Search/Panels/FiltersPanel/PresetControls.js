import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import {
    Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
    IconButton, Menu, MenuItem, Snackbar, Tooltip, Typography,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import TuneIcon from '@mui/icons-material/Tune'

import { getFilterPreset, getFilterPresets } from '../../../../config/filterPresets'
import fields from '../../../../config/fields.json'
import { getAppConfig } from '../../../../core/appConfig'
import { getPresetFilterKeys, makePresetFilters, planPresetSwitch, sameFilterLayout } from '../../../../core/searchPresetState'
import { changeSearchPreset, dismissSearchPresetChange, resetFilters, undoSearchPresetChange } from '../../../../core/redux/actions/actions'

const fieldLabel = (key) => fields[key]?.label || key.split('.').at(-1).replaceAll('_', ' ')

export const PresetReset = ({ basic, disabled }) => {
    const dispatch = useDispatch()
    const presetId = useSelector((state) => state.get('searchPresetId'))
    const preset = getFilterPreset(presetId)
    const [anchor, setAnchor] = useState(null)

    const choose = (reset) => {
        setAnchor(null)
        dispatch(changeSearchPreset(reset ? presetId : null, reset))
    }

    return (
        <>
            <Tooltip title="Reset Filters" arrow>
                <span>
                    <IconButton
                        aria-label="reset filters" disabled={disabled}
                        aria-haspopup={basic && preset ? 'menu' : undefined}
                        onClick={(event) => basic && preset
                            ? setAnchor(event.currentTarget) : dispatch(resetFilters())}
                        sx={{ ml: 0.5, color: '#656666', '& svg': { fontSize: 18, transform: 'rotateY(180deg)' } }}
                    >
                        <RefreshIcon />
                    </IconButton>
                </span>
            </Tooltip>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
                <MenuItem onClick={() => choose(true)}>Reset to {preset?.label} preset</MenuItem>
                <MenuItem onClick={() => choose(false)}>
                    Clear preset ({getAppConfig().appTitle === 'Atlas' ? 'All Atlas' : getAppConfig().appTitle} defaults)
                </MenuItem>
            </Menu>
        </>
    )
}

PresetReset.propTypes = {
    basic: PropTypes.bool,
    disabled: PropTypes.bool,
}

export const PresetIndicator = () => {
    const dispatch = useDispatch()
    const presetId = useSelector((state) => state.get('searchPresetId'))
    const mapping = useSelector((state) => state.getIn(['mappings', 'atlas']))
    const active = useSelector((state) => state.get('activeFilters'))
    const [anchor, setAnchor] = useState(null)
    const [pending, setPending] = useState(null)
    const presets = getFilterPresets()
    const preset = getFilterPreset(presetId)
    const selectable = presets.length > 1
    if (!preset && !selectable) {
        return null
    }

    const current = active.toJS()
    const modified = preset && !sameFilterLayout(current, makePresetFilters(mapping, preset))
    const plan = pending && planPresetSwitch(current, makePresetFilters(mapping, pending))
    const changes = plan && [['Added', plan.added], ['Removed (empty filters only)', plan.removed], ['Kept · has value', plan.kept]]

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5,
                px: 1.25, py: 0.75, borderBottom: '1px solid #c9dbfb', bgcolor: '#edf4ff' }}>
                <Box>
                    <Typography variant="overline" component="div" sx={{ lineHeight: 1.35, color: '#425571' }}>Filter preset</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <TuneIcon sx={{ fontSize: 16, color: '#1559bf' }} />
                        <Typography component="strong" variant="body2" sx={{ fontWeight: 700 }}>{preset?.label || 'All Atlas'}</Typography>
                        {modified && <Chip label="Modified" size="small" color="info" variant="outlined" />}
                    </Box>
                </Box>
                <Box sx={{ display: 'flex' }}>
                    {selectable && <Button size="small" sx={{ color: '#1559bf' }}
                        onClick={(event) => setAnchor(event.currentTarget)} aria-haspopup="menu">Change</Button>}
                    {preset && <Button size="small" color="inherit" onClick={() => dispatch(changeSearchPreset(null))}>Clear preset</Button>}
                </Box>
            </Box>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
                {presets.map((item) => (
                    <MenuItem key={item.id} selected={item.id === (presetId || 'all')} onClick={() => {
                        setAnchor(null)
                        if (item.id !== (presetId || 'all')) {
                            setPending(item)
                        }
                    }}>{item.label}</MenuItem>
                ))}
            </Menu>
            <Dialog open={Boolean(pending)} onClose={() => setPending(null)} fullWidth maxWidth="sm" aria-labelledby="switch-preset-title">
                <DialogTitle id="switch-preset-title">Switch to {pending?.label} preset?</DialogTitle>
                <DialogContent dividers>
                    <Typography>This changes which filters are shown. Your selected values still apply.</Typography>
                    <Alert severity="warning" sx={{ my: 1.5 }}>
                        Switching presets does not change the selected mission or other criteria.
                    </Alert>
                    {changes?.map(([label, keys]) => (
                        <Box key={label} sx={{ py: 0.75, display: 'grid', gridTemplateColumns: '155px 1fr', gap: 1,
                            borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{label}</Typography>
                            <Typography variant="body2">{keys.map(fieldLabel).join(', ') || 'None'}</Typography>
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button color="secondary" onClick={() => setPending(null)}>Cancel</Button>
                    <Button variant="contained" sx={{ bgcolor: '#1c67e3', color: '#fff', '&:hover': { bgcolor: '#1459c7' } }} onClick={() => {
                        dispatch(changeSearchPreset(pending.id))
                        setPending(null)
                    }}>Switch preset</Button>
                </DialogActions>
            </Dialog>
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
