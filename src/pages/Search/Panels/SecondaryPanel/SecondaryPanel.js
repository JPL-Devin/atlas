import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

import CartoCosmos from '../../../../CartoCosmos/CartoCosmos'

import MapListener from './subcomponents/MapListener/MapListener'

import { styled } from '@mui/material/styles'

const SecondaryPanelRoot = styled('div')({
    height: '100%',
    transition: 'width 0.4s ease-out',
    overflow: 'hidden',
    position: 'relative',
})

const Content = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
    margin: 0,
    background: theme.palette.swatches.grey.grey800,
    display: 'flex',
    flexFlow: 'column',
}))

const Heading = styled('div')(({ theme }) => ({
    width: '100%',
    height: theme.headHeights[1],
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 12px',
    boxSizing: 'border-box',
    background: theme.palette.swatches.grey.grey700,
}))

const Title = styled('div')(({ theme }) => ({
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: '34px',
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
}))

const MapContainer = styled('div')({
    'width': '100%',
    'height': '100%',
    'overflow': 'hidden',
    '& > div': {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
})

const SecondaryPanel = (props) => {
    const { mobile } = props
    const mainRef = useRef()
    const [firstOpen, setFirstOpen] = useState(false)

    const w = useSelector((state) => {
        return state.getIn(['workspace', 'main'])
    }).toJS()

    let width = 0
    if (mobile) width = '100%'
    else if (w.secondary) {
        if (w.results) width = w.secondarySize
        else width = '100%'
    }

    const style = {
        width,
    }

    // This is so that the map never loads in the background on start up
    if (width !== 0 && firstOpen === false) {
        setFirstOpen(true)
    }

    return (
        <SecondaryPanelRoot style={style} ref={mainRef}>
            <MapListener parentClass="mapContainer" firstOpen={firstOpen} />
            <Content>
                <Heading>
                    <div>
                        <Title>Map</Title>
                    </div>
                    <div></div>
                </Heading>
                <MapContainer className="mapContainer">
                    <CartoCosmos firstOpen={firstOpen} />
                </MapContainer>
            </Content>
        </SecondaryPanelRoot>
    )
}

SecondaryPanel.propTypes = {}

export default SecondaryPanel
