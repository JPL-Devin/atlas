import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { styled } from '@mui/material/styles'

import CartView from './CartView/CartView'
import Panel from './Panel/Panel'
import MobileDownloadBar from './MobileDownloadBar/MobileDownloadBar'
import RemoveFromCartModal from '../Modals/RemoveFromCartModal/RemoveFromCartModal'

const ContentRoot = styled('div')(({ theme }) => ({
    width: '100%',
    height: `calc(100% - ${theme.headHeights[1]}px)`,
    display: 'flex',
}))

const Content = (props) => {
    const { isMobile } = props

    return (
        <ContentRoot>
            <CartView />
            {isMobile ? <MobileDownloadBar /> : <Panel />}
            <RemoveFromCartModal />
        </ContentRoot>
    )
}

Content.propTypes = {}

export default Content
