import React, { useState } from 'react'
import Paper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Input from '@mui/material/Input'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import ConsoleContainer from './ConsoleContainer.jsx'
import MapContainer from './MapContainer.jsx'
import ListSubheader from '@mui/material/ListSubheader'
import WellKnownTextInput from '../presentational/WellKnownTextInput.jsx'

import { useSelector, useDispatch } from 'react-redux'
import { MISSIONS_TO_BODIES } from '../../../core/constants'
import { sAKeys, sASet } from '../../../core/redux/actions/subscribableActions'

const AppRoot = styled('div')({
    position: 'relative',
})

const ChangePlanet = styled('div')({
    'position': 'absolute',
    'top': 10,
    'left': 10,
    'zIndex': 1100,
    'background': 'black',
    '& .MuiInput-underline:before': {
        'border-bottom': '1px solid black',
    },
})

const StyledFormControl = styled(FormControl)({
    minWidth: 125,
})

const StyledSelect = styled(Select)({
    'color': '#efefef',
    'background': '#000',
    'border-bottom': '1px solid black',
    'borderRadius': '3px',
    '& > div:first-child': {
        padding: '8px 20px 6px 6px',
    },
    '& > svg': {
        color: '#efefef',
        top: '4px',
        right: '2px',
    },
})

const ListTitle = styled(ListSubheader)({
    pointerEvents: 'none',
    display: 'none',
})

const StyledSubheader = styled(ListSubheader)({
    lineHeight: '33px !important',
    fontSize: '14px !important',
    color: '#1c67e3',
    pointerEvents: 'none',
    minWidth: '180px',
})

const BoldMenuItem = styled(MenuItem, {
    shouldForwardProp: (prop) => prop !== 'isDisabled',
})(({ isDisabled }) => ({
    fontWeight: 'bold !important',
    paddingLeft: '32px !important',
    ...(isDisabled && {
        pointerEvents: 'none',
        opacity: 0.4,
        color: 'rgba(0,0,0,0.4) !important',
    }),
}))

const IndentMenuItem = styled(MenuItem, {
    shouldForwardProp: (prop) => prop !== 'isHidden',
})(({ isHidden }) => ({
    paddingLeft: '48px !important',
    ...(isHidden && {
        display: 'none',
    }),
}))

const StyledPaper = styled(Paper)({
    height: '100%',
})

const NoneBackground = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
    backgroundSize: '18px 18px',
    backgroundImage: `linear-gradient(to right, ${theme.palette.swatches.grey.grey700} 1px, transparent 1px), linear-gradient(to bottom, ${theme.palette.swatches.grey.grey700} 1px, transparent 1px)`,
    backgroundRepeat: 'repeat',
}))

const MessageContainer = styled(Paper)(({ theme }) => ({
    background: theme.palette.swatches.grey.grey150,
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translateX(-50%) translateY(-50%)',
    padding: '24px',
}))

const MessageText = styled(Typography)({
    fontSize: '16px',
    fontWeight: 700,
    textAlign: 'center',
})

const MessageChangePlanet = styled('div')({
    'display': 'flex',
    'justifyContent': 'center',
    'marginTop': '12px',
    '& .MuiInput-underline:before': {
        'border-bottom': '1px solid black',
    },
})

function TargetDropdown(props) {
    const { targetPlanet, handleChange, hasNone, bodyLimits } = props

    const structure = {
        planets: {
            name: 'Planets',
            children: [
                {
                    name: 'Mercury',
                    children: [],
                },
                {
                    name: 'Venus',
                    children: [],
                },
                {
                    name: 'Earth',
                    children: ['Moon'],
                },
                {
                    name: 'Mars',
                    children: ['Deimos', 'Phobos'],
                },
                {
                    name: 'Jupiter',
                    children: ['Callisto', 'Europa', 'Ganymede', 'Io'],
                },
                {
                    name: 'Saturn',
                    children: [
                        'Dione',
                        'Enceladus',
                        'Hyperion',
                        'Iapetus',
                        'Mimas',
                        'Phoebe',
                        'Rhea',
                        'Tethys',
                        'Titan',
                    ],
                },
                {
                    name: 'Uranus',
                    children: [],
                },
                {
                    name: 'Neptune',
                    children: [],
                },
            ],
        },
        otherBodies: {
            name: 'Other Bodies',
            children: [
                {
                    name: 'Ceres',
                    children: [],
                },
                {
                    name: 'Pluto',
                    children: ['Charon'],
                },
                {
                    name: 'Vesta',
                    children: [],
                },
            ],
        },
    }

    const constructItems = () => {
        const items = []
        if (hasNone)
            items.push(
                <ListTitle key="none" value="None">
                    Target Bodies
                </ListTitle>
            )

        for (let h in structure) {
            items.push(
                <StyledSubheader key={h}>
                    {structure[h].name}
                </StyledSubheader>
            )
            structure[h].children.forEach((child, idx) => {
                items.push(
                    <BoldMenuItem
                        key={`${h}_${idx}`}
                        value={child.name}
                        isDisabled={!(
                            bodyLimits == null || bodyLimits.includes(child.name.toLowerCase())
                        )}
                    >
                        {child.name}
                    </BoldMenuItem>
                )
                child.children.forEach((child2, idx2) => {
                    items.push(
                        <IndentMenuItem
                            key={`${h}_${idx}_${idx2}`}
                            value={child2}
                            isHidden={!(
                                bodyLimits == null || bodyLimits.includes(child2.toLowerCase())
                            )}
                        >
                            {`${child2 === 'Moon' ? 'The ' : ''}${child2}`}
                        </IndentMenuItem>
                    )
                })
            })
        }

        return items
    }

    return (
        <div>
            <StyledFormControl size="small">
                <StyledSelect
                    defaultValue={1}
                    onChange={handleChange}
                    value={targetPlanet}
                    input={<Input id="grouped-select" />}
                >
                    {constructItems()}
                </StyledSelect>
            </StyledFormControl>
        </div>
    )
}

/**
 * App is the parent component for all of the other components in the project. It
 * imports and creates all of the map and console components and contains the
 * target selector.
 *
 * @component
 */
export default function App(props) {
    const dispatch = useDispatch()

    const [targetPlanet, setTargetPlanet] = useState('None')

    const activeMissions = useSelector((state) => {
        return state.getIn(['activeMissions'])
    }).toJS()

    let bodyLimits = []
    if (activeMissions == null || activeMissions.length === 0) bodyLimits = null
    else {
        const mains = []
        activeMissions.forEach((m) => {
            const bodies = MISSIONS_TO_BODIES[m]
            if (bodies) {
                for (let key in bodies) {
                    if (key !== 'main') bodyLimits = bodyLimits.concat(bodies[key])
                }
                if (bodies.main) mains.push(bodies.main)
            }
        })
        // If target planet is outside of the limits
        if (!bodyLimits.includes(targetPlanet.toLowerCase())) {
            const nextTargetPlanet = mains[0] || 'None'
            if (nextTargetPlanet != targetPlanet) setTargetPlanet(nextTargetPlanet)
            sASet(sAKeys.MAP_TARGET, mains[0] || 'None')
        }
    }

    /**
     * Handles target selection
     *
     * @param {*} event selection event
     */
    const handleChange = (event) => {
        if (event.target.value != targetPlanet) setTargetPlanet(event.target.value)
        sASet(sAKeys.MAP_TARGET, event.target.value)
    }

    return (
        <AppRoot>
            {targetPlanet === 'None' ? (
                <NoneBackground>
                    <MessageContainer elevation={10}>
                        <MessageText>
                            Select a target body to get started
                        </MessageText>
                        <MessageChangePlanet>
                            <TargetDropdown
                                targetPlanet={targetPlanet}
                                handleChange={handleChange}
                                hasNone={true}
                                bodyLimits={bodyLimits}
                            />
                        </MessageChangePlanet>
                    </MessageContainer>
                </NoneBackground>
            ) : (
                <React.Fragment>
                    <ChangePlanet>
                        <TargetDropdown
                            targetPlanet={targetPlanet}
                            handleChange={handleChange}
                            bodyLimits={bodyLimits}
                        />
                    </ChangePlanet>
                    <StyledPaper elevation={10}>
                        <ConsoleContainer target={targetPlanet} />
                        <MapContainer target={targetPlanet} firstOpen={props.firstOpen} />
                        <WellKnownTextInput />
                    </StyledPaper>
                </React.Fragment>
            )}
        </AppRoot>
    )
}
