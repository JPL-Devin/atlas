import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

import { styled } from '@mui/material/styles'

import IconButton from '@mui/material/IconButton'
import Checkbox from '@mui/material/Checkbox'

import ClickAwayListener from '@mui/material/ClickAwayListener'
import Grow from '@mui/material/Grow'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Box from '@mui/material/Box'

const StyledIconButton = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'isOpen',
})(({ theme, isOpen }) => ({
    'color': theme.palette.swatches.grey.grey500,
    'width': '40px',
    'height': '40px',
    'fontSize': '1.5rem',
    'background': 'rgba(0,0,0,0)',
    'transition': 'all 0.2s ease-out',
    '&:hover': {
        background: theme.palette.swatches.grey.grey150,
        color: theme.palette.text.primary,
    },
    ...(isOpen && {
        background: theme.palette.swatches.grey.grey150,
        color: theme.palette.text.primary,
    }),
}))

const MenuPaper = styled(Paper)(({ theme }) => ({
    background: theme.palette.swatches.grey.grey800,
    color: theme.palette.text.secondary,
    marginTop: '4px',
}))

const StyledMenuItem = styled(MenuItem, {
    shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'isCheck',
})(({ theme, isActive, isCheck }) => ({
    'borderLeft': '4px solid rgba(0,0,0,0)',
    'transition': 'background 0.2s ease-out',
    '&:hover': {
        background: theme.palette.swatches.grey.grey700,
    },
    ...(isActive && {
        borderLeft: `4px solid ${theme.palette.swatches.blue.blue500}`,
        background: theme.palette.swatches.grey.grey700,
    }),
    ...(isCheck && {
        paddingLeft: theme.spacing(2),
    }),
}))

const HrDiv = styled('div')(({ theme }) => ({
    width: '100%',
    height: '1px',
    background: theme.palette.swatches.grey.grey600,
}))

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
    'padding': `0px ${theme.spacing(2)} 0px 0px`,
    '&.Mui-checked': {
        color: theme.palette.swatches.grey.grey100,
    },
}))

const MenuButton = (props) => {
    const { options, active, checkboxIndices, buttonComponent, title, onChange } = props

    let currentActive = active || null

    const [open, setOpen] = useState(false)
    const anchorRef = useRef(null)

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen)
    }

    const handleClose = (event, option, idx) => {
        if (typeof onChange === 'function') onChange(option, idx)
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return
        }

        setOpen(false)
    }

    function handleListKeyDown(event) {
        if (event.key === 'Tab') {
            event.preventDefault()
            setOpen(false)
        }
    }

    // return focus to the button when we transitioned from !open -> open
    const prevOpen = React.useRef(open)
    useEffect(() => {
        if (prevOpen.current === true && open === false) {
            anchorRef.current.focus()
        }

        prevOpen.current = open
    }, [open])

    return (
        <Box sx={{ zIndex: 1200 }}>
            <StyledIconButton
                isOpen={open}
                aria-label="menu"
                ref={anchorRef}
                aria-controls={open ? 'menu-list-grow' : undefined}
                aria-haspopup="true"
                onClick={handleToggle}
                size="large"
            >
                {buttonComponent}
            </StyledIconButton>
            <Popper
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
                placement="bottom-end"
                style={{
                    zIndex: 1300,
                }}
            >
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === 'bottom' ? 'center top' : 'center bottom',
                        }}
                    >
                        <MenuPaper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList
                                    autoFocusItem={open}
                                    id="menu-list-grow"
                                    onKeyDown={handleListKeyDown}
                                >
                                    {title != null ? (
                                        <StyledMenuItem key={-1} disabled>
                                            {title}
                                        </StyledMenuItem>
                                    ) : null}
                                    {options.map((o, idx) =>
                                        o === '-' ? (
                                            <HrDiv key={idx}></HrDiv>
                                        ) : (
                                            <StyledMenuItem
                                                key={idx}
                                                isActive={o === currentActive}
                                                isCheck={
                                                    checkboxIndices &&
                                                    checkboxIndices.includes(idx)
                                                }
                                                onClick={(e) => handleClose(e, o, idx)}
                                            >
                                                {checkboxIndices &&
                                                    checkboxIndices.includes(idx) && (
                                                        <StyledCheckbox
                                                            color="default"
                                                            checked={o === currentActive}
                                                            aria-label={
                                                                o === currentActive
                                                                    ? 'selected'
                                                                    : 'select'
                                                            }
                                                        />
                                                    )}
                                                {o}
                                            </StyledMenuItem>
                                        )
                                    )}
                                </MenuList>
                            </ClickAwayListener>
                        </MenuPaper>
                    </Grow>
                )}
            </Popper>
        </Box>
    )
}

MenuButton.propTypes = {
    options: PropTypes.array.isRequired,
    checkboxIndices: PropTypes.array,
    active: PropTypes.string,
    onChange: PropTypes.func,
}

export default MenuButton
