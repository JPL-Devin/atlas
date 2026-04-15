import React from 'react'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { styled, useTheme } from '@mui/material/styles'
import Zoom from '@mui/material/Zoom'
import Paper from '@mui/material/Paper'
import Divider from '@mui/material/Divider'
import StyledTooltip from './StyledTooltip.jsx'

import useMediaQuery from '@mui/material/useMediaQuery'

const CoordContainer = styled('div')({
    'display': 'flex',
    'flexWrap': 'noWrap',
    'width': '100%',
    'height': 27,
    'margin': 'auto',
    'position': 'absolute',
    'bottom': '0px',
    'background': 'rgba(0,0,0,0.5)',
    'zIndex': 401,
    'justifyContent': 'flex-end',
    'boxSizing': 'border-box',
    'padding': '0px 8px',
    'pointerEvents': 'none',
    '& > div': {
        display: 'flex',
        pointerEvents: 'all',
    },
    '& > div > *': {
        margin: 0,
        padding: 0,
        lineHeight: '28px',
        fontWeight: 400,
        color: '#ececec',
    },
})

const TitleLabel = styled(Typography)({
    color: '#343a40',
    lineHeight: '1rem',
    paddingBottom: 1,
    fontWeight: 600,
})

const CoordsText = styled(Typography)({
    textAlign: 'center',
})

/**
 * Main component that displays the container for the coordinate display
 * and controls styling.
 *
 * @component
 */
export default function ConsoleCoordinates() {
    const theme = useTheme()
    const isMobileXS = useMediaQuery(theme.breakpoints.down('sm'))

    return (
        <CoordContainer id="coordContainer">
            <StyledTooltip
                title={
                    <Typography variant="subtitle1">
                        Displays the longitude and latitude of the area on the map underneath the
                        cursor.
                    </Typography>
                }
                enterDelay={800}
                leaveDelay={0}
                arrow
                TransitionComponent={Zoom}
            >
                <div>
                    <TitleLabel
                        variant="overline"
                        style={{ marginRight: '2px' }}
                    >
                        {isMobileXS ? 'Lon, Lat:' : 'Longitude, Latitude:'}
                    </TitleLabel>
                    <CoordsText
                        noWrap
                        id="lonCoordinateDisplay"
                        variant="subtitle2"
                    />
                    <Typography style={{ marginRight: '2px' }}>{'°,'}</Typography>
                    <CoordsText
                        noWrap
                        id="latCoordinateDisplay"
                        variant="subtitle2"
                    />
                    <Typography>{'°'}</Typography>
                </div>
            </StyledTooltip>
        </CoordContainer>
    )
}
