import React, { useState, useRef } from 'react'
import PropTypes from 'prop-types'

import CartoCosmos from '../../../../CartoCosmos/CartoCosmos'

import MapListener from './subcomponents/MapListener/MapListener'

import { makeStyles } from '@mui/styles'

const useStyles = makeStyles((theme) => ({
    SecondaryPanel: {
        height: '100%',
        flexShrink: 0,
        transition: 'width 0.4s ease-out',
        overflow: 'hidden',
        position: 'relative',
    },
    content: {
        width: '100%', //`calc(100% - ${theme.spacing(2)})`,
        height: '100%', //`calc(100% - ${theme.spacing(4)})`,
        margin: 0, //`${theme.spacing(2)} ${theme.spacing(1)}`,
        background: theme.palette.swatches.grey.grey800,
        display: 'flex',
        flexFlow: 'column',
    },
    map: {
        'width': '100%',
        'height': '100%',
        'overflow': 'hidden',
        '& > div': {
            width: '100%',
            height: '100%',
            overflow: 'hidden',
        },
    },
}))

const SecondaryPanel = (props) => {
    const { width } = props
    const c = useStyles()

    const mainRef = useRef()
    const [firstOpen, setFirstOpen] = useState(false)

    const style = {
        width,
    }

    // This is so that the map never loads in the background on start up
    if (width !== 0 && firstOpen === false) 
        setFirstOpen(true)
    

    return (
        <div className={c.SecondaryPanel} style={style} ref={mainRef}>
            <MapListener parentClass={c.map} firstOpen={firstOpen} />
            <div className={c.content}>
                <div className={c.map}>
                    <CartoCosmos firstOpen={firstOpen} />
                </div>
            </div>
        </div>
    )
}

SecondaryPanel.propTypes = {
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

export default SecondaryPanel
