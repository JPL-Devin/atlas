import React from 'react'
import ConsoleAppBar from '../presentational/ConsoleAppBar.jsx'
import { styled } from '@mui/material/styles'

const ContainerRoot = styled('div')({
    maxWidth: 800,
    height: 100,
    width: '100%',
    display: 'none',
})

const StyledConsoleAppBar = styled(ConsoleAppBar)({
    maxWidth: 800,
    height: 100,
    width: 'auto',
})

/**
 * Container component that holds the ConsoleAppBar and all of its subcomponents
 *
 * @component
 *
 */
export default function ConsoleContainer(props) {
    return (
        <ContainerRoot>
            <StyledConsoleAppBar target={props.target} />
        </ContainerRoot>
    )
}
