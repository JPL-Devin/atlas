import React, { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, ButtonBase, InputAdornment, Popover, TextField, Typography } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import SearchIcon from '@mui/icons-material/Search'

import fields from '../../../../config/fields.json'
import { FLIGHT_DAY } from '../../../../config/filterPresets'
import { getPresetFilterSummary } from '../../../../core/searchPresetState'

export const fieldLabel = (key) => fields[key]?.label || key.split('.').at(-1).replaceAll('_', ' ')

const summaryLabels = {
    [FLIGHT_DAY]: 'Flight Day Number',
    'gather.machine_learning.classification.classifications.class': 'ML Class',
    'gather.machine_learning.classification.classifications.confidence': 'ML Confidence',
}
const summaryLabel = (key) => summaryLabels[key] || fieldLabel(key)

const presetSummary = (preset) => {
    const { featured, added, hiddenCount } = getPresetFilterSummary(preset)
    return [
        featured.length > 0 && `Features ${featured.map(summaryLabel).join(' + ')}`,
        added.length > 0 && `Adds ${added.map(summaryLabel).join(' + ')}`,
        hiddenCount > 0 && `Hides ${hiddenCount}`,
    ].filter(Boolean).join(' · ') || 'Instance defaults'
}

const pickerInset = 8

const PresetPicker = ({ id, anchor, presets, activeId, onClose, onSelect }) => {
    const [search, setSearch] = useState('')
    const searchInput = useRef(null)
    const list = useRef(null)
    const term = search.trim().toLowerCase()
    const matches = presets.filter(({ label, description }) =>
        [label, description].some((text) => text.toLowerCase().includes(term)))

    const handleKeys = (event) => {
        const options = Array.from(list.current.querySelectorAll('button'))
        if (!options.length || !['ArrowUp', 'ArrowDown'].includes(event.key)) {
            return
        }
        const current = options.indexOf(event.target)
        const step = event.key === 'ArrowDown' ? 1 : -1
        event.preventDefault()
        options[(current < 0 ? (step === 1 ? 0 : options.length - 1)
            : (current + step + options.length) % options.length)].focus()
    }

    const handleSearchKeys = (event) => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing && matches.length) {
            event.preventDefault()
            onSelect(matches[0])
        }
    }

    return (
        <Popover
            open
            anchorEl={anchor}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: pickerInset }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            marginThreshold={pickerInset}
            TransitionProps={{ onEntered: () => searchInput.current?.focus() }}
            PaperProps={{
                id,
                role: 'dialog',
                'aria-modal': true,
                'aria-labelledby': `${id}-title`,
                onKeyDown: handleKeys,
                sx: {
                    width: anchor.offsetWidth - pickerInset * 2,
                    mt: '1px',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #c7d3e2',
                    borderRadius: '7px',
                    boxShadow: '0 12px 28px #1527453b, 0 2px 5px #1527451d',
                },
            }}
        >
            <Box sx={{ px: 1.75, pt: 1.5, pb: 1.25, borderBottom: '1px solid #dde5ef' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography id={`${id}-title`} component="h2" sx={{ fontSize: 16, fontWeight: 700 }}>
                        Change filter preset
                    </Typography>
                    <ButtonBase onClick={onClose} aria-label="Close preset picker" sx={{
                        color: '#56667a', bgcolor: '#f6f8fc', border: '1px solid #dde5ef',
                        borderRadius: '4px', px: 0.75, fontSize: 11,
                        '&.Mui-focusVisible': { outline: '2px solid #1559bf' },
                    }}>Esc</ButtonBase>
                </Box>
                <Typography component="p" sx={{ mt: 0.25, mb: 1.25, fontSize: 12, color: '#4c5b70' }}>
                    Choose which filters appear in Basic Filters.
                </Typography>
                <TextField
                    inputRef={searchInput}
                    fullWidth
                    variant="outlined"
                    size="small"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={handleSearchKeys}
                    placeholder="Search presets…"
                    inputProps={{ 'aria-label': 'Search presets' }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment>,
                    }}
                    sx={{
                        '& .MuiInputBase-root': {
                            fontSize: 14, border: '1px solid #98b2d5', borderRadius: '5px',
                            '&.Mui-focused': { borderColor: '#1559bf', boxShadow: '0 0 0 2px #dceaff' },
                        },
                        '& .MuiOutlinedInput-notchedOutline': { border: 0 },
                    }}
                />
            </Box>
            <Box ref={list} sx={{ p: 0.75, overflowY: 'auto' }}>
                {matches.map((preset) => {
                    const selected = preset.id === activeId
                    return (
                        <ButtonBase key={preset.id} aria-current={selected ? 'true' : undefined}
                            onClick={() => onSelect(preset)}
                            sx={{
                                display: 'block', width: '100%', textAlign: 'left', position: 'relative',
                                px: 1.125, pr: selected ? 3.75 : 1.125, py: 1, borderRadius: '5px',
                                bgcolor: selected ? '#edf4ff' : 'transparent',
                                border: '1px solid', borderColor: selected ? '#d2e2fb' : 'transparent',
                                '&:hover, &.Mui-focusVisible': { bgcolor: '#f2f7ff', borderColor: '#709de0' },
                            }}
                        >
                            <Typography component="span" sx={{ display: 'block', fontSize: 13, fontWeight: 700 }}>
                                {preset.label}
                            </Typography>
                            <Typography component="span" sx={{ display: 'block', fontSize: 12, color: '#4c5b70' }}>
                                {preset.description}
                            </Typography>
                            <Typography component="span" sx={{ display: 'block', mt: 0.5, fontSize: 11, fontWeight: 600, color: '#285885' }}>
                                {presetSummary(preset)}
                            </Typography>
                            {selected && <CheckIcon titleAccess="Active preset" sx={{ position: 'absolute', top: 8, right: 8, fontSize: 16, color: '#1559bf' }} />}
                        </ButtonBase>
                    )
                })}
                {!matches.length && <Typography role="status" sx={{ px: 1.125, py: 2.5, fontSize: 13, color: '#4c5b70' }}>
                    No matching presets
                </Typography>}
            </Box>
            <Box sx={{
                display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px 10px',
                px: 1.625, py: 1, bgcolor: '#f8fafd', borderTop: '1px solid #dde5ef', fontSize: 11, color: '#4d5f76',
            }}>
                <span>Values stay selected.</span>
                <span><b>↑ ↓</b> Navigate · <b>Enter</b> Select</span>
            </Box>
        </Popover>
    )
}

PresetPicker.propTypes = {
    id: PropTypes.string.isRequired,
    anchor: PropTypes.object.isRequired,
    presets: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
    })).isRequired,
    activeId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
}

export default PresetPicker
