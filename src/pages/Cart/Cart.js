import React, { useEffect } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'

import Title from './Title/Title'
import Content from './Content/Content'

const CartRoot = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
    color: theme.palette.text.primary,
    overflow: 'hidden',
}))

const Cart = (props) => {
    useEffect(() => {
        document.title = 'Atlas - Cart | PDS-IMG'
    }, [])

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

    return (
        <CartRoot>
            <Title />
            <Content isMobile={isMobile} />
        </CartRoot>
    )
}

Cart.propTypes = {}

export default Cart
