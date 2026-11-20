import React, { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Button, ButtonBase, IconButton, Popover, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

const inset = 8

const SimplePresetPicker = ({ id, anchor, presets, activeId, onClose, onApply }) => {
    const [selectedId, setSelectedId] = useState(activeId)
    const options = useRef([])
    const selected = presets.find((preset) => preset.id === selectedId)
    const tabbable = selected?.id ?? presets[0]?.id

    const handleKeys = (event, index) => {
        const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key]
        if (!step) {
            return
        }
        event.preventDefault()
        const nextIndex = (index + step + presets.length) % presets.length
        setSelectedId(presets[nextIndex].id)
        options.current[nextIndex]?.focus()
    }

    return (
        <Popover
            open anchorEl={anchor} onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: inset }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            marginThreshold={inset}
            TransitionProps={{ onEntered: () => options.current[presets.findIndex((preset) => preset.id === tabbable)]?.focus() }}
            PaperProps={{
                id,
                role: 'dialog',
                'aria-modal': true,
                'aria-labelledby': `${id}-title`,
                'aria-describedby': `${id}-description`,
                sx: {
                    width: `min(404px, calc(100vw - ${inset * 2}px))`,
                    maxHeight: `calc(100dvh - ${Math.ceil(anchor.getBoundingClientRect().bottom) + inset}px)`,
                    display: 'flex', flexDirection: 'column',
                    border: '1px solid #c7d3e2', borderRadius: '7px',
                    boxShadow: '0 12px 28px #1527453b, 0 2px 5px #1527451d',
                },
            }}
        >
            <Box sx={{ px: 3.5, pt: 2.5, pb: 3, borderBottom: '1px solid #dde5ef' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Typography id={`${id}-title`} component="h2" sx={{ fontSize: 17, fontWeight: 700 }}>
                        Choose a filter preset
                    </Typography>
                    <IconButton aria-label="Close preset picker" onClick={onClose} size="small" sx={{ color: '#425873' }}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>
                <Typography id={`${id}-description`} sx={{ mt: 0.75, fontSize: 12, color: '#4b5c71' }}>
                    Presets change which filters are shown. Your selections stay.
                </Typography>
            </Box>
            <Box role="radiogroup" aria-labelledby={`${id}-title`} sx={{
                display: 'flex', flexDirection: 'column', gap: 1, p: 2, minHeight: 0, overflowY: 'auto',
            }}>
                {presets.map((preset, index) => {
                    const active = preset.id === activeId
                    const checked = preset.id === selectedId
                    return (
                        <ButtonBase key={preset.id} ref={(option) => { options.current[index] = option }}
                            role="radio" aria-checked={checked} aria-current={active || undefined}
                            tabIndex={preset.id === tabbable ? 0 : -1}
                            onClick={() => setSelectedId(preset.id)} onKeyDown={(event) => handleKeys(event, index)}
                            sx={{
                                justifyContent: 'space-between', flexShrink: 0, gap: 2, px: 3, py: 2,
                                minHeight: 48, borderRadius: '5px', textAlign: 'left',
                                border: '1px solid', borderColor: checked ? '#779ed7' : 'transparent',
                                bgcolor: checked ? '#edf4ff' : '#fff',
                                boxShadow: checked ? 'inset 3px 0 #1559bf' : undefined,
                                '&:hover': { bgcolor: checked ? '#edf4ff' : '#f3f7fd' },
                                '&.Mui-focusVisible': { outline: '2px solid #1559bf', outlineOffset: '-2px' },
                            }}
                        >
                            <Box component="span" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                                <Typography component="span" sx={{ display: 'block', fontSize: 13, fontWeight: 700, color: active ? '#0b3d91' : '#172231' }}>
                                    {preset.label}
                                </Typography>
                                <Typography component="span" sx={{ display: 'block', mt: 0.5, fontSize: 12, color: '#4b5c71' }}>
                                    {preset.description}
                                </Typography>
                            </Box>
                            {(active || checked) && <Typography component="span" sx={{
                                flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#25588d',
                            }}>{active ? '✓ Active' : '● Selected'}</Typography>}
                        </ButtonBase>
                    )
                })}
            </Box>
            <Box sx={{
                display: 'flex', justifyContent: 'flex-end', gap: 2, px: 3, py: 2.25, flexShrink: 0,
                bgcolor: '#f7f9fc', borderTop: '1px solid #dde5ef',
                '& .MuiButton-root': { minHeight: 38, px: 3.5, fontSize: 13, fontWeight: 700, textTransform: 'none' },
            }}>
                <Button variant="outlined" onClick={onClose}
                    sx={{ color: '#1559bf', borderColor: '#acbbcf', '&:hover': { borderColor: '#1559bf' } }}
                >Cancel</Button>
                <Button variant="contained" disableElevation disabled={!selected || selectedId === activeId}
                    sx={{ bgcolor: '#1559bf', '&:hover': { bgcolor: '#12499d' } }}
                    onClick={() => onApply(selected)}
                >Apply</Button>
            </Box>
        </Popover>
    )
}

SimplePresetPicker.propTypes = {
    id: PropTypes.string.isRequired,
    anchor: PropTypes.object.isRequired,
    presets: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
    })).isRequired,
    activeId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onApply: PropTypes.func.isRequired,
}

export default SimplePresetPicker
