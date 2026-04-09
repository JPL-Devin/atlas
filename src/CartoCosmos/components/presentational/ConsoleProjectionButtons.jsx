import React from 'react'
import Grid from '@mui/material/Grid'
import ButtonBase from '@mui/material/ButtonBase'
import Typography from '@mui/material/Typography'
import { alpha, styled } from '@mui/material/styles'
import Zoom from '@mui/material/Zoom'
import StyledTooltip from './StyledTooltip.jsx'

const ProjGrid = styled(Grid)({
    width: 38,
    position: 'absolute',
    top: '58px',
    right: '9px',
    zIndex: 500,
})

const ButtonWrap = styled('div')({
    width: 34,
    height: 34,
    border: '1px solid #232323',
})

const ProjButton = styled(ButtonBase)({
    'width': '100%',
    'height': '100%',
    'background': '#000',
    'padding': '3px',
    'transition': 'background 0.2s ease-out',
    'color': 'white',
    '&.disabled': {
        'border': 'none',
        'cursor': 'not-allowed',
        'pointerEvents': 'none',
        '&:hover': {
            border: 'none',
        },
    },
    '&:active': {
        background: alpha('#1971c2', 0.5),
    },
    '&:hover, &.Mui-focusVisible': {
        background: 'black',
    },
})

const ActiveProjButton = styled(ButtonBase)(({ theme }) => ({
    width: '100%',
    height: '100%',
    background: theme.palette.swatches.blue.blue500,
    color: '#000',
    padding: '3px',
}))

/**
 * Component used only in this file, passed in to the Tooltip to
 * determine which tooltip to use if north polar projection is disabled
 *
 * @component
 *
 */
function NorthDisabled() {
    let north = document.getElementById('projectionNorthPole')
    if (north != null && north.classList.contains('disabled')) {
        return (
            <Typography variant="body2">
                The north polar projection for this body is unavailable.
            </Typography>
        )
    } else {
        return (
            <Typography variant="body2">
                Switch to a north polar projection for the target body.
            </Typography>
        )
    }
}

/**
 * Component used only in this file, passed in to the Tooltip to
 * determine which tooltip to use if south polar projection is disabled
 *
 * @component
 *
 */
function SouthDisabled() {
    let south = document.getElementById('projectionSouthPole')
    if (south != null && south.classList.contains('disabled')) {
        return (
            <Typography variant="body2">
                The south polar projection for this body is unavailable.
            </Typography>
        )
    } else {
        return (
            <Typography variant="body2">
                Switch to a south polar projection for the target body.
            </Typography>
        )
    }
}

/**
 * Main component that displays the console's projection buttons and handles
 * user click events.
 *
 * @component
 */
export default function ConsoleProjectionButtons() {

    const [active, setActive] = React.useState('cylindrical')

    const handleNorthClick = (event) => {
        if (!event.currentTarget.classList.contains('disabled')) {
            setActive('north')
        } else {
            event.stopPropagation()
        }
    }

    const handleSouthClick = (event) => {
        if (!event.currentTarget.classList.contains('disabled')) {
            setActive('south')
        } else {
            event.stopPropagation()
        }
    }

    return (
        <ProjGrid
            id="projContainer"
            container
            item
            direction="column"
            justifyContent="center"
            alignItems="center"
            xs
        >
            <Grid item>
                <StyledTooltip
                    title={<NorthDisabled />}
                    enterDelay={800}
                    leaveDelay={0}
                    placement="left"
                    arrow
                    TransitionComponent={Zoom}
                >
                    <ButtonWrap>
                        {active == 'north' ? (
                        <ActiveProjButton
                            id="projectionNorthPole"
                            focusRipple
                            onClick={handleNorthClick}
                        >
                            <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 18 18">
                                <circle
                                    cx="9"
                                    cy="9"
                                    r="5.75"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                                <circle cx="9" cy="6.75" r="1.875" fill="currentColor" />
                            </svg>
                        </ActiveProjButton>
                        ) : (
                        <ProjButton
                            id="projectionNorthPole"
                            focusRipple
                            onClick={handleNorthClick}
                        >
                            <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 18 18">
                                <circle
                                    cx="9"
                                    cy="9"
                                    r="5.75"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                                <circle cx="9" cy="6.75" r="1.875" fill="currentColor" />
                            </svg>
                        </ProjButton>
                        )}
                    </ButtonWrap>
                </StyledTooltip>
            </Grid>
            <Grid item>
                <StyledTooltip
                    title={
                        <Typography variant="body2">
                            Switch to a cylindrical projection for the target body.
                        </Typography>
                    }
                    enterDelay={800}
                    leaveDelay={0}
                    placement="left"
                    arrow
                    TransitionComponent={Zoom}
                >
                    <ButtonWrap>
                        {active == 'cylindrical' ? (
                        <ActiveProjButton
                            id="projectionCylindrical"
                            focusRipple
                            value="cylindrical"
                            onClick={() => setActive('cylindrical')}
                        >
                            <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 18 18">
                                <path
                                    fill="currentColor"
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M13.5083 10.5C12.8803 12.3883 11.0992 13.75 9 13.75C6.90081 13.75 5.11967 12.3883 4.4917 10.5H13.5083ZM13.5083 7.5H4.4917C5.11967 5.61171 6.90081 4.25 9 4.25C11.0992 4.25 12.8803 5.61171 13.5083 7.5ZM15.75 9C15.75 12.7279 12.7279 15.75 9 15.75C5.27208 15.75 2.25 12.7279 2.25 9C2.25 5.27208 5.27208 2.25 9 2.25C12.7279 2.25 15.75 5.27208 15.75 9Z"
                                />
                            </svg>
                        </ActiveProjButton>
                        ) : (
                        <ProjButton
                            id="projectionCylindrical"
                            focusRipple
                            value="cylindrical"
                            onClick={() => setActive('cylindrical')}
                        >
                            <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 18 18">
                                <path
                                    fill="currentColor"
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M13.5083 10.5C12.8803 12.3883 11.0992 13.75 9 13.75C6.90081 13.75 5.11967 12.3883 4.4917 10.5H13.5083ZM13.5083 7.5H4.4917C5.11967 5.61171 6.90081 4.25 9 4.25C11.0992 4.25 12.8803 5.61171 13.5083 7.5ZM15.75 9C15.75 12.7279 12.7279 15.75 9 15.75C5.27208 15.75 2.25 12.7279 2.25 9C2.25 5.27208 5.27208 2.25 9 2.25C12.7279 2.25 15.75 5.27208 15.75 9Z"
                                />
                            </svg>
                        </ProjButton>
                        )}
                    </ButtonWrap>
                </StyledTooltip>
            </Grid>
            <Grid item>
                <StyledTooltip
                    title={<SouthDisabled />}
                    enterDelay={800}
                    leaveDelay={0}
                    placement="left"
                    arrow
                    TransitionComponent={Zoom}
                >
                    <ButtonWrap>
                        {active == 'south' ? (
                        <ActiveProjButton
                            id="projectionSouthPole"
                            focusRipple
                            onClick={handleSouthClick}
                        >
                            <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 18 18">
                                <circle
                                    cx="9"
                                    cy="9"
                                    r="5.75"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                                <circle cx="9" cy="11.25" r="1.875" fill="currentColor" />
                            </svg>
                        </ActiveProjButton>
                        ) : (
                        <ProjButton
                            id="projectionSouthPole"
                            focusRipple
                            onClick={handleSouthClick}
                        >
                            <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 18 18">
                                <circle
                                    cx="9"
                                    cy="9"
                                    r="5.75"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                                <circle cx="9" cy="11.25" r="1.875" fill="currentColor" />
                            </svg>
                        </ProjButton>
                        )}
                    </ButtonWrap>
                </StyledTooltip>
            </Grid>
        </ProjGrid>
    );
}
