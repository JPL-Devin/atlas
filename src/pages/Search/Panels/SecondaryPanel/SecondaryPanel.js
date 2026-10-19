import React, { useState, useRef, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { setMapVisible } from '../../../../core/redux/actions/actions'

import CartoCosmos from '../../../../CartoCosmos/CartoCosmos'

import MapListener from './subcomponents/MapListener/MapListener'

import { makeStyles } from '@mui/styles'

const useStyles = makeStyles((theme) => ({
    SecondaryPanel: {
        height: '100%',
        flexShrink: 0,
        minWidth: 0,
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

    const dispatch = useDispatch()
    const mainRef = useRef()
    const [firstOpen, setFirstOpen] = useState(false)

    // A closed map keeps its controls out of the tab and accessibility trees
    const style = {
        width,
        visibility: width === 0 ? 'hidden' : 'visible',
    }

    // This is so that the map never loads in the background on start up
    const visible = width !== 0
    if (visible && firstOpen === false) {
        setFirstOpen(true)
    }

    useEffect(() => {
        dispatch(setMapVisible(visible))
    }, [dispatch, visible])
    useEffect(() => () => dispatch(setMapVisible(false)), [dispatch])

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
