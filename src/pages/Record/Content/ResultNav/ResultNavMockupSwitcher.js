import React from 'react'

import { makeStyles } from '@mui/styles'

import Paper from '@mui/material/Paper'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

import { RESULT_NAV_VARIANTS, RESULT_NAV_STATES } from './resultNavFixtures'
import { useResultNav, useResultNavControls } from './ResultNavMockup'

// Floating panel for flipping between mockup variants and states.
const useStyles = makeStyles((theme) => ({
    ResultNavMockupSwitcher: {
        'position': 'fixed',
        'right': '12px',
        'bottom': '12px',
        'zIndex': 1300,
        'padding': '8px 10px',
        'display': 'flex',
        'flexFlow': 'column',
        'gap': '6px',
        'fontSize': '11px',
        'color': theme.palette.swatches.grey.grey700,
        'border': `1px dashed ${theme.palette.swatches.grey.grey400}`,
        '& .MuiToggleButton-root': {
            padding: '2px 8px',
            fontSize: '11px',
            textTransform: 'none',
            lineHeight: '16px',
        },
    },
    heading: {
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: theme.palette.swatches.grey.grey500,
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    rowLabel: {
        width: '42px',
    },
    status: {
        fontFamily: 'monospace',
        color: theme.palette.swatches.grey.grey500,
    },
}))

const ResultNavMockupSwitcher = () => {
    const c = useStyles()
    const controls = useResultNavControls()
    const nav = useResultNav()

    if (controls == null) {
        return null
    }

    return (
        <Paper
            className={c.ResultNavMockupSwitcher}
            elevation={4}
            aria-label="result nav mockup controls"
        >
            <div className={c.heading}>Result nav mockup</div>
            <div className={c.row}>
                <span className={c.rowLabel}>Variant</span>
                <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={controls.variant}
                    onChange={(e, v) => v && controls.setVariant(v)}
                >
                    {RESULT_NAV_VARIANTS.map((v) => (
                        <ToggleButton key={v} value={v} aria-label={`mockup variant ${v}`}>
                            {v.toUpperCase()}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </div>
            <div className={c.row}>
                <span className={c.rowLabel}>State</span>
                <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={controls.preset}
                    onChange={(e, v) => v && controls.applyPreset(v)}
                >
                    {Object.entries(RESULT_NAV_STATES).map(([key, s]) => (
                        <ToggleButton key={key} value={key} aria-label={`mockup state ${s.label}`}>
                            {s.label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </div>
            <div className={c.status}>
                {nav
                    ? `index ${nav.index} · loaded ${nav.loaded}/${nav.total}${nav.loadingNext ? ' · loading' : ''}`
                    : 'no result context · nav hidden'}
            </div>
        </Paper>
    )
}

export default ResultNavMockupSwitcher
