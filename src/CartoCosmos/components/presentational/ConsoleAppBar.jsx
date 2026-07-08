import React from 'react'
import ConsoleTargetInfo from '../presentational/ConsoleTargetInfo.jsx'
import ConsoleProjectionButtons from '../presentational/ConsoleProjectionButtons.jsx'
import ConsoleLonLatSelects from '../presentational/ConsoleLonLatSelects.jsx'
import ConsoleCoordinates from './ConsoleCoordinates.jsx'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Grid from '@mui/material/Grid'
import { styled } from '@mui/material/styles'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'

const StyledAppBar = styled(AppBar)({
    background: '#f8f9fa',
})

const StyledToolbar = styled(Toolbar)({
    height: 100,
    maxWidth: 800,
    width: 'auto',
    padding: 0,
})

const StyledGrid = styled(Grid)({
    maxWidth: 800,
    height: 100,
})

/**
 * Main component of the console, which arranges all subcomponents into a grid
 * and passes in target information via props.
 *
 * @component
 */
export default function ConsoleAppBar(props) {
    return (
        <Box sx={{ height: 100, width: '100%' }} id="consoleToolbarParent">
            <StyledAppBar
                position="static"
                color="inherit"
                id="consoleToolbar"
            >
                <StyledToolbar>
                    <StyledGrid
                        container
                        justifyContent="space-between"
                        alignItems="stretch"
                    >
                        {/*<ConsoleProjectionButtons />*/}
                        <Divider orientation="vertical" />
                        <Grid container item direction="column" xs>
                            <ConsoleTargetInfo target={props.target} />
                            <Grid
                                container
                                item
                                xs
                                justifyContent="space-around"
                                alignItems="center"
                                wrap="nowrap"
                            >
                                <ConsoleLonLatSelects />
                                {/*<ConsoleCoordinates />*/}
                            </Grid>
                        </Grid>
                    </StyledGrid>
                </StyledToolbar>
            </StyledAppBar>
        </Box>
    );
}
