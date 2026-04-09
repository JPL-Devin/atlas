import React, { useState, useEffect, useRef } from 'react'

import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Grow from '@mui/material/Grow'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import Checkbox from '@mui/material/Checkbox'

import { styled } from '@mui/material/styles'

const SplitButtonGroup = styled(ButtonGroup, {
    shouldForwardProp: (prop) => prop !== 'isContained',
})(({ theme, isContained }) => ({
    'borderRadius': '2px',
    '& > .MuiButton-root': {
        background: theme.palette.swatches.grey.grey0,
    },
    '& .MuiButtonGroup-groupedOutlinedHorizontal:not(:last-child)': {
        borderRight: '2px solid rgba(23, 23, 27, 0.5) !important',
    },
    ...(isContained && {
        'border': 'none',
        'borderRadius': '2px',
        '& > .MuiButton-root': {
            background: theme.palette.accent.main,
            border: 'none',
        },
    }),
}))

const ArrowButton = styled(Button)({
    padding: '4px 0px',
    minWidth: '33px',
    borderLeft: `1px solid rgba(255,255,255,0.4) !important`,
})

const StyledPopper = styled(Popper)({
    zIndex: 3000,
    marginTop: '5px',
})

const StyledMenuList = styled(MenuList)(({ theme }) => ({
    background: theme.palette.swatches.grey.grey800,
    color: theme.palette.text.secondary,
    borderRadius: '3px',
}))

const StyledMenuItem = styled(MenuItem, {
    shouldForwardProp: (prop) => prop !== 'isActive',
})(({ theme, isActive }) => ({
    'display': 'flex',
    'justifyContent': 'space-between',
    'borderLeft': '4px solid rgba(0,0,0,0)',
    'transition': 'background 0.2s ease-out',
    '&:hover': {
        background: theme.palette.swatches.grey.grey700,
    },
    ...(isActive && {
        borderLeft: `4px solid ${theme.palette.swatches.blue.blue500}`,
        background: `${theme.palette.swatches.grey.grey700} !important`,
    }),
}))

const MenuItemLeft = styled('div')({
    display: 'flex',
})

const MenuItemSubname = styled('div')({
    opacity: 0.7,
    marginLeft: '24px',
})

const DelimitedPath = styled('div')({
    opacity: 0.7,
    lineHeight: '27px',
})

const MenuName = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isBold',
})(({ isBold }) => ({
    lineHeight: '27px',
    ...(isBold && {
        fontWeight: 'bold',
    }),
}))

const StyledCheckbox = styled(Checkbox)({
    marginRight: '4px',
})

// items is [{ name: 'My Items' }, { ... }]

export default function SplitButton(props) {
    const {
        className,
        forceName,
        items,
        type,
        onClick,
        onChange,
        startIcon,
        forceIndex,
        startingIndex,
        truncateDelimiter,
        variant,
    } = props

    const [open, setOpen] = useState(false)
    const anchorRef = useRef(null)
    const [selectedIndex, setSelectedIndex] = useState(startingIndex || 0)
    const [checkedIndices, setCheckedIndices] = useState([])

    useEffect(() => {
        if (type === 'checklist') {
            const nextCheckedIndices = []
            items.forEach((item, idx) => {
                if (item.checked) nextCheckedIndices.push(idx)
            })
            setCheckedIndices(nextCheckedIndices)
        }
    }, [])

    const handleClick = () => {
        if (typeof onClick === 'function') {
            if (type === 'checklist') {
                const checkedItems = []
                checkedIndices.forEach((index) => {
                    checkedItems.push(items[index])
                })
                onClick(checkedItems)
            } else onClick(items[selectedIndex], selectedIndex)
        }
    }

    const handleMenuItemClick = (event, index) => {
        if (type === 'checklist') {
            let nextCheckedIndices = JSON.parse(JSON.stringify(checkedIndices))
            const indexOfIndex = nextCheckedIndices.indexOf(index)
            if (indexOfIndex === -1) nextCheckedIndices.push(index)
            else nextCheckedIndices.splice(indexOfIndex, 1)
            setCheckedIndices(nextCheckedIndices)
        } else {
            setOpen(false)
            setSelectedIndex(index)
            if (typeof onChange === 'function') onChange(items[index], index)
        }
    }

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen)
    }

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return
        }

        setOpen(false)
    }

    let name = items[forceIndex != null ? forceIndex : selectedIndex].name
    if (truncateDelimiter) {
        name = name.split(truncateDelimiter)
        name = name[name.length - 1]
    }

    if (forceName) name = forceName

    return (
        <>
            <SplitButtonGroup
                className={className}
                isContained={variant != 'outlined'}
                variant={variant || 'contained'}
                color="secondary"
                size="small"
                aria-label="split button"
            >
                <Button startIcon={startIcon} onClick={handleClick}>
                    {name}
                </Button>
                <ArrowButton
                    color="secondary"
                    size="small"
                    aria-controls={open ? 'split-button-menu' : undefined}
                    aria-expanded={open ? 'true' : undefined}
                    aria-label="button options"
                    aria-haspopup="menu"
                    onClick={handleToggle}
                    ref={anchorRef}
                >
                    <ArrowDropDownIcon />
                </ArrowButton>
            </SplitButtonGroup>
            <StyledPopper
                open={open}
                anchorEl={anchorRef.current}
                placement="bottom-end"
                transition
                disablePortal
            >
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === 'bottom' ? 'center top' : 'center bottom',
                        }}
                    >
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <StyledMenuList>
                                    {items.map((item, index) => {
                                        let delimitedName
                                        let delimitedPath
                                        if (truncateDelimiter) {
                                            let lastIndex = item.name.lastIndexOf('.')
                                            if (lastIndex != -1) {
                                                delimitedName = item.name.substr(lastIndex + 1)
                                                delimitedPath = item.name.substr(0, lastIndex + 1)
                                            }
                                        }
                                        return (
                                            <StyledMenuItem
                                                key={index}
                                                isActive={
                                                    index === selectedIndex &&
                                                    type !== 'checklist'
                                                }
                                                selected={
                                                    index === selectedIndex && type !== 'checklist'
                                                }
                                                onClick={(event) =>
                                                    handleMenuItemClick(event, index)
                                                }
                                            >
                                                <MenuItemLeft>
                                                    {type === 'checklist' && (
                                                        <StyledCheckbox
                                                            color="default"
                                                            checked={checkedIndices.includes(index)}
                                                            size="medium"
                                                        />
                                                    )}
                                                    {delimitedPath && delimitedName ? (
                                                        <>
                                                            <DelimitedPath>
                                                                {delimitedPath}
                                                            </DelimitedPath>
                                                            <MenuName>
                                                                {delimitedName}
                                                            </MenuName>
                                                        </>
                                                    ) : (
                                                        <MenuName
                                                            isBold={
                                                                type !== 'checklist' ||
                                                                checkedIndices.includes(index)
                                                            }
                                                        >
                                                            {item.name}
                                                        </MenuName>
                                                    )}
                                                </MenuItemLeft>
                                                {item.subname != null && (
                                                    <MenuItemSubname>
                                                        {item.subname}
                                                    </MenuItemSubname>
                                                )}
                                            </StyledMenuItem>
                                        )
                                    })}
                                </StyledMenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </StyledPopper>
        </>
    )
}
