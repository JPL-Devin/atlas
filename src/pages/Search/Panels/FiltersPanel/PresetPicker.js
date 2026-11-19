import React, { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Alert, Box, Button, ButtonBase, InputAdornment, Popover, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import SearchIcon from '@mui/icons-material/Search'

import fields from '../../../../config/fields.json'
import { FLIGHT_DAY } from '../../../../config/filterPresets'
import { getPresetFilterSummary } from '../../../../core/searchPresetState'
import { prettify } from '../../../../core/utils'

const summaryLabels = {
    [FLIGHT_DAY]: 'Flight Day Number',
    'archive.bundle_id': 'Bundle ID',
    'gather.machine_learning.classification.classifications.class': 'ML Class',
    'gather.machine_learning.classification.classifications.confidence': 'ML Confidence',
}
const fieldLabel = (key, displayName) =>
    summaryLabels[key] || (displayName ? prettify(displayName) : fields[key]?.label || prettify(key.split('.').at(-1)))

const getPresetChips = (preset) => {
    const { featured, added, hidden } = getPresetFilterSummary(preset)
    return [
        ...featured.map((key) => [`Features ${fieldLabel(key)}`, false]),
        ...added.map((key) => [`Adds ${fieldLabel(key)}`, false]),
        ...hidden.map((key) => [`Hides ${fieldLabel(key)}`, true]),
    ]
}

const chipStyle = { borderRadius: '4px', px: 0.625, py: 0.25, fontSize: 10, fontWeight: 650 }
const warningStyle = { color: '#614307', bgcolor: '#fff4da', fontSize: 12, alignItems: 'center' }
const quickActionStyle = { color: '#1559bf', textTransform: 'none' }
const presetExplanation = 'Presets change which filters are shown. Switching keeps your selected values, including Mission.'
const keptExplanation = 'Choose which extra filters to keep or clear. Mission and other selected values stay.'
const pickerInset = 8
const diffStyles = {
    added: { symbol: '+', label: 'Added', countLabel: 'added', color: '#165839', bgcolor: '#e7f4eb' },
    removed: { symbol: '−', label: 'Removed', countLabel: 'removed', color: '#8a302c', bgcolor: '#faecea' },
    kept: { symbol: '↳', label: 'Kept because it has a value', countLabel: 'kept', color: '#644a19', bgcolor: '#fff3d8' },
    unchanged: { symbol: '=', label: 'Unchanged', countLabel: 'unchanged', color: '#405571', bgcolor: '#f5f8fc' },
}

const PresetPicker = ({ id, anchor, presets, activeId, getPreview, onClose, onSelect }) => {
    const [search, setSearch] = useState('')
    const [previewId, setPreviewId] = useState(null)
    const [pinnedId, setPinnedId] = useState(null)
    const [hoverId, setHoverId] = useState(null)
    const [clearKeys, setClearKeys] = useState([])
    const searchInput = useRef(null)
    const list = useRef(null)
    const term = search.trim().toLowerCase()
    const matches = presets.filter(({ label, description }) =>
        [label, description].some((text) => text.toLowerCase().includes(term)))
    const pinned = matches.find((preset) => preset.id === pinnedId)
    const preview = matches.find((preset) => preset.id === (pinned ? hoverId || pinnedId : previewId))
        || matches.find((preset) => preset.id === activeId) || matches[0]
    const layout = preview && getPreview(preview)
    const pinnedLayout = pinned && (pinnedId === preview.id ? layout : getPreview(pinned))
    const keptRows = pinnedLayout?.rows.filter((row) => row.status === 'kept') || []
    const deciding = pinned && pinnedId === preview.id
    const clearCount = keptRows.filter(({ key }) => clearKeys.includes(key)).length
    const keepCount = keptRows.length - clearCount
    const applyLabel = `Apply · ${[keepCount && `keep ${keepCount}`, clearCount && `clear ${clearCount}`].filter(Boolean).join(', ')}`

    const selectPreset = (preset) => {
        if (!getPreview(preset).rows.some(({ status }) => status === 'kept')) {
            onSelect(preset)
            return
        }
        if (pinnedId !== preset.id) {
            setClearKeys([])
        }
        setPinnedId(preset.id)
        setHoverId(null)
        list.current.querySelectorAll('[data-preset-option]')[matches.indexOf(preset)]?.focus()
    }

    const handleKeys = (event) => {
        const option = event.target.closest('[data-preset-option]')
        if ((!option && event.target !== searchInput.current) || !['ArrowUp', 'ArrowDown'].includes(event.key)) {
            return
        }
        const options = Array.from(list.current.querySelectorAll('[data-preset-option]'))
        if (!options.length) {
            return
        }
        const current = options.indexOf(option)
        const step = event.key === 'ArrowDown' ? 1 : -1
        event.preventDefault()
        options[(current < 0 ? (step === 1 ? 0 : options.length - 1)
            : (current + step + options.length) % options.length)].focus()
    }

    const handleSearchKeys = (event) => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing && matches.length) {
            event.preventDefault()
            selectPreset(matches[0])
        }
    }

    const renderRows = (rows, editable) => (
        <Box component="ul" sx={{ m: 0, mt: 0.75, p: 0, borderTop: '1px solid #dde5ef', listStyle: 'none' }}>
            {rows.map(({ key, displayName, status }) => {
                const canChoose = editable && status === 'kept'
                const clearing = canChoose && clearKeys.includes(key)
                const { symbol, label, color, bgcolor } = diffStyles[clearing ? 'removed' : status]
                const name = fieldLabel(key, displayName)
                return (
                    <Box component="li" key={key} sx={{
                        display: 'grid', gridTemplateColumns: '13px minmax(0, 1fr) auto', alignItems: 'center',
                        gap: 0.75, px: 0.75, py: 0.25, minHeight: 21, fontSize: 12, color, bgcolor,
                        borderBottom: '1px solid #dde5ef',
                    }}>
                        <Box component="span" aria-hidden="true" sx={{ textAlign: 'center', fontWeight: 800 }}>{symbol}</Box>
                        <Box component="span" sx={{ overflowWrap: 'anywhere', textDecoration: status === 'removed' || clearing ? 'line-through' : undefined }}>
                            {name}
                        </Box>
                        {canChoose ? (
                            <ToggleButtonGroup size="small" exclusive value={clearing ? 'clear' : 'keep'}
                                aria-label={`Keep or clear ${name}`}
                                onChange={(_, value) => {
                                    if (value) {
                                        setClearKeys((keys) => value === 'clear' ? [...keys, key] : keys.filter((item) => item !== key))
                                    }
                                }}
                                sx={{
                                    '& .MuiToggleButton-root': { textTransform: 'none', px: 0.875, py: 0.25, minHeight: { xs: 36, md: 25 }, color: '#405571' },
                                    '& .Mui-selected, & .Mui-selected:hover': { bgcolor: '#e3edfc', color: '#154986', fontWeight: 700 },
                                }}
                            >
                                <ToggleButton value="keep">Keep</ToggleButton>
                                <ToggleButton value="clear">Clear</ToggleButton>
                            </ToggleButtonGroup>
                        ) : <Box component="span" sx={{ fontSize: 10, fontWeight: 700 }}>{label}</Box>}
                    </Box>
                )
            })}
        </Box>
    )

    const renderActions = () => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
            <Button size="small" sx={quickActionStyle} onClick={() => setClearKeys([])}>Keep all</Button>
            <Button size="small" sx={quickActionStyle} onClick={() => setClearKeys(keptRows.map(({ key }) => key))}>Clear all kept</Button>
            <Button size="small" variant="contained" disableElevation sx={{ ml: 'auto', textTransform: 'none' }}
                onClick={() => onSelect(pinned, clearKeys)}
            >{applyLabel}</Button>
        </Box>
    )

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
                    width: {
                        xs: anchor.offsetWidth - pickerInset * 2,
                        md: `min(680px, calc(100vw - ${pickerInset * 2}px))`,
                    },
                    maxHeight: {
                        xs: `calc(100dvh - ${Math.ceil(anchor.getBoundingClientRect().bottom) + pickerInset + 1}px)`,
                        md: `calc(100% - ${pickerInset * 2}px)`,
                    },
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
                        Choose a filter preset
                    </Typography>
                    <ButtonBase onClick={onClose} aria-label="Close preset picker" sx={{
                        color: '#56667a', bgcolor: '#f6f8fc', border: '1px solid #dde5ef',
                        borderRadius: '4px', px: 0.75, fontSize: 11,
                        '&.Mui-focusVisible': { outline: '2px solid #1559bf' },
                    }}>Esc</ButtonBase>
                </Box>
                <Typography component="p" sx={{ mt: 0.25, mb: 1.25, fontSize: 12, color: '#4c5b70' }}>
                    Labels under each preset describe how it differs from the standard Atlas filters.<Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                        {' '}Hover or focus a preset to preview changes from your current filters.
                    </Box>
                </Typography>
                <TextField
                    inputRef={searchInput}
                    fullWidth
                    variant="outlined"
                    size="small"
                    type="search"
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value)
                        setPreviewId(null)
                        setPinnedId(null)
                        setHoverId(null)
                        setClearKeys([])
                    }}
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
            <Alert severity="warning" role="note" sx={{ ...warningStyle, display: { xs: 'flex', md: 'none' }, borderRadius: 0 }}>
                {pinned ? keptExplanation : presetExplanation}
            </Alert>
            <Box sx={{
                display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
                minHeight: 0,
            }}>
                <Box ref={list} sx={{ p: 0.75, overflowY: 'auto' }}>
                    {matches.map((preset) => {
                        const selected = preset.id === activeId
                        const isPinned = preset.id === pinnedId
                        const inspecting = preset.id === preview?.id
                        const chips = getPresetChips(preset)
                        return (
                            <React.Fragment key={preset.id}>
                            <ButtonBase aria-current={selected ? 'true' : undefined} data-preset-option
                                aria-expanded={isPinned || undefined} tabIndex={pinned && !isPinned ? -1 : 0}
                                onClick={() => selectPreset(preset)}
                                onPointerEnter={(event) => {
                                    if (event.pointerType !== 'mouse') {
                                        return
                                    }
                                    if (pinned) {
                                        setHoverId(preset.id)
                                    } else {
                                        setPreviewId(preset.id)
                                    }
                                }}
                                onPointerLeave={() => setHoverId(null)}
                                onFocus={() => {
                                    if (!pinned) {
                                        setPreviewId(preset.id)
                                    }
                                }}
                                sx={{
                                    display: 'block', width: '100%', textAlign: 'left', position: 'relative',
                                    px: 1.125, pr: selected ? 3.75 : 1.125, py: 1, borderRadius: '5px',
                                    bgcolor: selected ? '#edf4ff' : { xs: 'transparent', md: inspecting ? '#f2f7ff' : 'transparent' },
                                    border: '1px solid',
                                    borderColor: isPinned ? '#1559bf' : selected ? '#d2e2fb' : { xs: 'transparent', md: inspecting ? '#a9c8f6' : 'transparent' },
                                    '&:hover, &.Mui-focusVisible': { bgcolor: '#f2f7ff', borderColor: '#709de0' },
                                }}
                            >
                                <Typography component="span" sx={{ display: 'block', fontSize: 13, fontWeight: 700 }}>
                                    {preset.label}
                                </Typography>
                                <Typography component="span" sx={{ display: 'block', fontSize: 12, color: '#4c5b70' }}>
                                    {preset.description}
                                </Typography>
                                {chips.length ? <Box component="span" sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px', mt: 0.625 }}>
                                    {chips.map(([label, hidden]) => <Box key={label} component="span" sx={{
                                        ...chipStyle, bgcolor: hidden ? '#eff1f5' : '#eaf1ff', color: hidden ? '#4c5664' : '#264e83',
                                    }}>{label}</Box>)}
                                </Box> : <Typography component="span" sx={{ display: 'block', mt: 0.5, fontSize: 11, fontWeight: 600, color: '#285885' }}>
                                    Standard Atlas filters
                                </Typography>}
                                {selected && <CheckIcon titleAccess="Active preset" sx={{ position: 'absolute', top: 8, right: 8, fontSize: 16, color: '#1559bf' }} />}
                            </ButtonBase>
                            {isPinned && <Box role="group" aria-label={`Kept filters for ${preset.label}`} sx={{
                                display: { xs: 'block', md: 'none' }, p: 0.75, bgcolor: '#f6f9fe', borderRadius: '5px',
                            }}>
                                {renderRows(keptRows, true)}
                                <Box sx={{ mt: 1 }}>{renderActions()}</Box>
                            </Box>}
                            </React.Fragment>
                        )
                    })}
                    {!matches.length && <Typography role="status" sx={{ px: 1.125, py: 2.5, fontSize: 13, color: '#4c5b70' }}>
                        No matching presets
                    </Typography>}
                </Box>
                <Box component="aside" aria-label="Filter changes" sx={{
                    display: { xs: 'none', md: 'block' }, overflowY: 'auto', p: 2,
                    bgcolor: '#f6f9fe', borderLeft: '1px solid #dde5ef',
                }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#436282' }}>
                        Filter changes
                    </Typography>
                    {layout ? <>
                        <Typography component="h3" sx={{ fontSize: 19, fontWeight: 700, my: 0.5 }}>{preview.label}</Typography>
                        {!layout.isActive && <Typography sx={{ mb: 0.75, fontSize: 12, color: '#405571' }}>
                            In sidebar order. Crossed-out filters won’t appear.
                        </Typography>}
                        <Alert severity="info" role="note" sx={{
                            color: '#2c486c', bgcolor: '#eef3fa', fontSize: 11, alignItems: 'center', px: 1, py: 0,
                            '& .MuiAlert-icon': { color: 'inherit', opacity: 1, mr: 0.75 },
                        }}>{deciding ? keptExplanation : presetExplanation}</Alert>
                        {layout.isActive ? <Typography sx={{ mt: 1, fontSize: 12, fontWeight: 700 }}>You’re already using this preset.</Typography> : (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                {Object.entries(diffStyles).map(([status, { symbol, countLabel, color, bgcolor }]) => (
                                    <Box component="span" key={status} sx={{ ...chipStyle, color, bgcolor, border: '1px solid #d6e1ef' }}>
                                        <span aria-hidden="true">{symbol}</span>{' '}
                                        {layout.rows.filter((row) =>
                                            (deciding && row.status === 'kept' && clearKeys.includes(row.key) ? 'removed' : row.status) === status
                                        ).length} {countLabel}
                                    </Box>
                                ))}
                            </Box>
                        )}
                        {renderRows(layout.rows, deciding)}
                    </> : <Typography sx={{ mt: 1, fontSize: 12, color: '#4c5b70' }}>No preset to preview.</Typography>}
                </Box>
            </Box>
            <Box sx={{
                display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px 10px',
                px: 1.625, py: 1, bgcolor: '#f8fafd', borderTop: '1px solid #dde5ef', fontSize: 11, color: '#4d5f76',
            }}>
                {pinned ? <>
                    <span>Clearing a kept filter removes its control and value.</span>
                    <Box sx={{ display: { xs: 'none', md: 'block' }, ml: 'auto' }}>{renderActions()}</Box>
                </> : <>
                    <span>Choose a preset to apply it or review kept filters. You can undo it.</span>
                    <span><b>↑ ↓</b> Navigate · <b>Enter</b> Choose</span>
                </>}
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
    getPreview: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
}

export default PresetPicker
