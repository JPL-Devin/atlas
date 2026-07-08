import React, { useEffect, useState } from 'react'

import { styled } from '@mui/material/styles'

import Tooltip from '@mui/material/Tooltip'

import GpsOnIcon from '@mui/icons-material/GpsNotFixed'
import GpsOffIcon from '@mui/icons-material/GpsOff'
import PanoramaVerticalIcon from '@mui/icons-material/PanoramaVertical';
import MobileOffIcon from '@mui/icons-material/MobileOff';
import GridOnIcon from '@mui/icons-material/GridOn'
import GridOffIcon from '@mui/icons-material/GridOff'

const SpecialLayersRoot = styled('div')({
    'top': '10px',
    'right': '56px',
    'display': 'flex',
    'zIndex': 500,
    'position': 'absolute',
    '& > a': {
        width: '36px',
        height: '36px',
        lineHeight: '46px',
        textAlign: 'center',
        boxSizing: 'border-box',
        color: '#fdfdfd',
        background: '#000000',
        border: '1px solid #232323',
        transition: 'all 0.2s ease-in-out',
    },
    '& > a:hover': {
        cursor: 'pointer',
        background: '#222',
    },
    '& > a:first-child': {
        borderTopLeftRadius: '2px',
        borderBottomLeftRadius: '2px',
    },
    '& > a:last-child': {
        borderTopRightRadius: '2px',
        borderBottomRightRadius: '2px',
    },
})

const LayerLink = styled('a', {
    shouldForwardProp: (prop) => prop !== 'isOff',
})(({ isOff }) => ({
    ...(isOff && {
        color: '#cccccc !important',
    }),
}))

/**
 * Component used only in this file, passed in to the Tooltip to
 * determine which tooltip to use if north polar projection is disabled
 *
 * @component
 *
 */

/**
 * Main component that displays the console's projection buttons and handles
 * user click events.
 *
 * @component
 */
export default function ConsoleSpecialButtons(props) {
    const { target } = props

    const [useClusters, setUseClusters] = useState(false)
    const [useFootprints, setUseFootprints] = useState(false)
    const [useGrid, setUseGrid] = useState(false)

    useEffect(() => {
        // When the target body changes, we need to refresh the layers on it
        if (window.clusterGroup) {
            if (useClusters) window.CartoCosmosMap.addLayer(window.clusterGroup)
            else window.CartoCosmosMap.removeLayer(window.clusterGroup)
        }
        if (window.footprintsLayer) {
            if (useFootprints) window.CartoCosmosMap.addLayer(window.footprintsLayer)
            else window.CartoCosmosMap.removeLayer(window.footprintsLayer)
        }
        if (window.geoGridLayer) {
            if (useGrid) window.CartoCosmosMap.addLayer(window.geoGridLayer)
            else window.CartoCosmosMap.removeLayer(window.geoGridLayer)
        }
    }, [target])

    const handleClustersClick = () => {
        if (window.clusterGroup == null) return
        if (useClusters) {
            // then turn off
            window.CartoCosmosMap.removeLayer(window.clusterGroup)
            window.clusterGroupOn = false
        } else {
            // else turn on
            window.CartoCosmosMap.addLayer(window.clusterGroup)
            window.clusterGroupOn = true
        }
        setUseClusters(!useClusters)
    }

    const handleFootprintsClick = () => {
        if (window.footprintsLayer == null) return
        if (useFootprints) {
            // then turn off
            window.CartoCosmosMap.removeLayer(window.footprintsLayer)
            window.footprintsLayerOn = false
        } else {
            // else turn on
            window.CartoCosmosMap.addLayer(window.footprintsLayer)
            window.footprintsLayerOn = true
        }
        setUseFootprints(!useFootprints)
    }

    const handleGridClick = () => {
        if (window.geoGridLayer == null) return
        if (useGrid) {
            // then turn off
            window.CartoCosmosMap.removeLayer(window.geoGridLayer)
            window.geoGridLayerOn = false
        } else {
            // else turn on
            window.CartoCosmosMap.addLayer(window.geoGridLayer)
            window.geoGridLayerOn = true
        }
        setUseGrid(!useGrid)
    }

    return (
        <SpecialLayersRoot>
            <Tooltip title="Plotted imagery centers from the results panel." arrow placement="bottom-end">
                <LayerLink onClick={handleClustersClick} isOff={!useClusters}>
                    {useClusters ? <GpsOnIcon /> : <GpsOffIcon />}
                </LayerLink>
            </Tooltip>
            <Tooltip title="Plotted imagery footprints from the results panel." arrow placement="bottom-end">
                <LayerLink onClick={handleFootprintsClick} isOff={!useFootprints}>
                    {useFootprints ? <PanoramaVerticalIcon /> : <MobileOffIcon />}
                </LayerLink>
            </Tooltip>
            <Tooltip
                title="A heatmap of all query result center points."
                arrow
                placement="bottom-end"
            >
                <LayerLink onClick={handleGridClick} isOff={!useGrid}>
                    {useGrid ? <GridOnIcon /> : <GridOffIcon />}
                </LayerLink>
            </Tooltip>
        </SpecialLayersRoot>
    )
}
