import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { styled } from '@mui/material/styles'

const HelpRoot = styled('div')({
    width: '100%',
})

const Help = (props) => {
    const {} = props

    return <HelpRoot>Help</HelpRoot>
}

Help.propTypes = {}

export default Help
